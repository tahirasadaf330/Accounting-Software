/**
 * User-facing messages (Spec §3.6). Say little — never reveal which check failed.
 * The precise reason goes in the audit block, not here.
 */
import type { DenyReason } from './audit/block.js';

export function denialMessage(reason: DenyReason): string {
  switch (reason) {
    case 'no_account':
    case 'ambiguous_account':
      return 'Access denied: no account provisioned, or it is inactive.';
    case 'no_permission':
    case 'not_allowed_operation':
      return 'Access denied: you do not have access to that data.';
    case 'rate_limited':
      return 'Rate limit exceeded; please retry shortly.';
    // bad_token / token_expired / token_replayed — reveal nothing at all
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
