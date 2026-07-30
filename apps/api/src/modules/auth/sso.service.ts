import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import { Client, Issuer, generators } from 'openid-client';

export interface SsoAuthRequest {
  url: string;
  codeVerifier: string;
  state: string;
  nonce: string;
}

export interface SsoIdentity {
  /** Microsoft Entra Object ID — the permanent, cross-app identity key. */
  oid: string;
  email: string;
}

/**
 * Microsoft Entra (Azure AD) SSO — OpenID Connect authorization-code flow with PKCE.
 * openid-client validates the id_token's signature (against Microsoft's JWKS), issuer,
 * audience, expiry and nonce for us; we add tenant (tid) and oid checks on top
 * (Microsoft SSO Implementation Guide §8).
 */
@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);
  private clientPromise: Promise<Client> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get tenantId(): string {
    return this.config.getOrThrow<string>('AAD_TENANT_ID');
  }

  private get redirectUri(): string {
    return this.config.getOrThrow<string>('AAD_REDIRECT_URI');
  }

  /** Lazily discover the issuer and build the client, cached; a failed discovery is retried next call. */
  private getClient(): Promise<Client> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const issuer = await Issuer.discover(
          `https://login.microsoftonline.com/${this.tenantId}/v2.0`,
        );
        return new issuer.Client({
          client_id: this.config.getOrThrow<string>('AAD_CLIENT_ID'),
          client_secret: this.config.getOrThrow<string>('AAD_CLIENT_SECRET'),
          redirect_uris: [this.redirectUri],
          response_types: ['code'],
        });
      })().catch((err) => {
        this.clientPromise = null;
        throw err;
      });
    }
    return this.clientPromise;
  }

  /** Build the Microsoft authorize URL plus the PKCE/state/nonce values the callback must verify against. */
  async createAuthRequest(): Promise<SsoAuthRequest> {
    const client = await this.getClient();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);
    const state = generators.state();
    const nonce = generators.nonce();

    const url = client.authorizationUrl({
      scope: 'openid profile email',
      response_mode: 'query',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    return { url, codeVerifier, state, nonce };
  }

  /** Exchange the code and fully validate the returned identity token. Throws on any failure (fail closed). */
  async validateCallback(
    params: Record<string, string>,
    expected: { codeVerifier: string; state: string; nonce: string },
  ): Promise<SsoIdentity> {
    const client = await this.getClient();
    const tokenSet = await client.callback(this.redirectUri, params, {
      code_verifier: expected.codeVerifier,
      state: expected.state,
      nonce: expected.nonce,
    });

    const claims = tokenSet.claims();

    if ((claims.tid as string | undefined) !== this.tenantId) {
      throw new Error('id_token tenant (tid) does not match the expected tenant');
    }

    const oid = claims.oid as string | undefined;
    if (!oid) {
      throw new Error('id_token is missing the oid claim');
    }

    const email = (claims.preferred_username || claims.email || (claims.upn as string)) as
      | string
      | undefined;
    if (!email) {
      throw new Error('id_token is missing an email/UPN claim');
    }

    return { oid, email: email.toLowerCase() };
  }

  /**
   * Match the Microsoft identity to an existing, active app user (guide §3.2/§3.3):
   *   1. by oid, 2. else by email, then backfill the oid on the record.
   * Returns null (denied) if there is no active account — accounts are never auto-created.
   */
  async resolveUser(identity: SsoIdentity) {
    let user = await this.prisma.user.findUnique({
      where: { azureOid: identity.oid },
      include: { tenant: true },
    });
    let matchedBy: 'oid' | 'email' | null = user ? 'oid' : null;

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: identity.email },
        include: { tenant: true },
      });
      matchedBy = user ? 'email' : null;
    }

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }

    // Backfill the oid once — only after the active check passed, only on an exact email match,
    // and never overwrite an oid that is already set (the unique index guarantees one owner).
    if (matchedBy === 'email' && !user.azureOid && user.email.toLowerCase() === identity.email) {
      try {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { azureOid: identity.oid },
          include: { tenant: true },
        });
      } catch {
        // Unique violation: another record already owns this oid — deny rather than mis-tag.
        this.logger.warn(`oid backfill conflict while linking ${identity.email}`);
        return null;
      }
    }

    return user;
  }
}
