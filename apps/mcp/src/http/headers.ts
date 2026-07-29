/**
 * Out-of-band identity headers (Guide 3.2). Identity is NEVER a tool argument.
 *
 *   x-atlas-agent-key   shared secret proving the trusted Atlas agent
 *   x-atlas-user-id     the human the agent acts for (lower-cased company e-mail)
 *   x-atlas-request-id  correlation id, echoed into the audit row
 *
 * Reject requests where an identity header appears more than once (smuggling
 * ambiguity). Node merges duplicate request headers of these names into a single
 * comma-joined string, so a comma in an agent key / e-mail is treated as a
 * duplicate. Arrays (if a framework supplies them) are duplicates when len > 1.
 */

export const HEADER_AGENT_KEY = 'x-atlas-agent-key';
export const HEADER_USER_ID = 'x-atlas-user-id';
export const HEADER_REQUEST_ID = 'x-atlas-request-id';

export interface Identity {
  agentKey?: string;
  userId?: string; // normalized (lower-cased, validated) e-mail, or undefined if invalid
  requestId: string | null;
  duplicated: boolean; // any identity header presented more than once
}

type HeaderBag = Record<string, string | string[] | undefined>;

function rawSingle(headers: HeaderBag, name: string): { value?: string; duplicated: boolean } {
  const v = headers[name] ?? headers[name.toLowerCase()];
  if (v === undefined) return { value: undefined, duplicated: false };
  if (Array.isArray(v)) {
    if (v.length > 1) return { value: undefined, duplicated: true };
    return { value: v[0], duplicated: false };
  }
  return { value: v, duplicated: false };
}

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
// Reject ASCII control characters (0x00-0x1F and 0x7F) in the user id.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\x00-\x1f\x7f]/;

/** Lower-case, trim, and validate an e-mail shape. Returns undefined if invalid. */
export function normalizeEmail(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.includes(',')) return undefined; // smuggled/duplicated value
  const e = raw.trim().toLowerCase();
  if (e.length === 0 || e.length > 320) return undefined;
  if (CONTROL_RE.test(e)) return undefined;
  if (!EMAIL_RE.test(e)) return undefined;
  return e;
}

export function parseIdentity(headers: HeaderBag | undefined): Identity {
  const h = headers ?? {};
  const key = rawSingle(h, HEADER_AGENT_KEY);
  const uid = rawSingle(h, HEADER_USER_ID);
  const rid = rawSingle(h, HEADER_REQUEST_ID);

  // A comma inside an agent key means Node merged duplicates → smuggling.
  const keyDuplicated = key.duplicated || (typeof key.value === 'string' && key.value.includes(','));

  return {
    agentKey: keyDuplicated ? undefined : key.value,
    userId: uid.duplicated ? undefined : normalizeEmail(uid.value),
    requestId: rid.duplicated ? null : rid.value ?? null,
    duplicated: key.duplicated || uid.duplicated || rid.duplicated || keyDuplicated,
  };
}
