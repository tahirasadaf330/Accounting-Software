import { Role } from '../enums/roles';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface LoginDto {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  role: Role;
  mfaVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
}
