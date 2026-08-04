/**
 * User-facing denial text. Atlas asked (2026-08) for the specific reason to be
 * surfaced here too — not only in the audit block — so its model can tell an
 * expired/replayed token apart from a genuine permission problem instead of
 * misdiagnosing every denial as "get your account provisioned". The reason is an
 * operational state, not sensitive; the precise detail still lives in the audit.
 */
import type { DenyReason } from './audit/block.js';

export function denialMessage(reason: DenyReason): string {
  switch (reason) {
    case 'bad_token':
      return 'Access denied: the identity token was missing or invalid (bad_token).';
    case 'token_expired':
      return 'Access denied: the identity token has expired (token_expired) — a fresh token is required.';
    case 'token_replayed':
      return 'Access denied: this identity token was already used (token_replayed) — tokens are single-use.';
    case 'no_account':
      return 'Access denied: no active account is provisioned for this identity (no_account).';
    case 'ambiguous_account':
      return 'Access denied: this identity matches more than one account (ambiguous_account).';
    case 'no_permission':
      return 'Access denied: your role does not grant access to that data (no_permission).';
    case 'not_allowed_operation':
      return 'Access denied: that operation is not permitted for your role (not_allowed_operation).';
    case 'rate_limited':
      return 'Rate limit exceeded (rate_limited); please retry shortly.';
    default:
      return 'Access denied.';
  }
}

export function errorMessage(): string {
  return 'The request could not be completed.';
}

/** Every tool result is a single text item carrying the JSON envelope. */
export function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
