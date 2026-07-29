/**
 * The THREE approved response strings (Guide A.6). These are the ONLY messages
 * that ever reach the agent for a denial/rejection/error. Never leak exceptions,
 * driver messages, SQL fragments, table/column names, or stack traces.
 */
import { config } from './config.js';

/** The ONE generic denial for EVERY deny path — identical wording each time. */
export function denialMessage(): string {
  return `Access denied: your account is not provisioned for ${config.systemLabel} (or it is inactive).`;
}

/** SQL-guard rejection. Never names the offending tables/columns. */
export function guardRejectMessage(): string {
  return `Query rejected: it references tables or columns outside your access.`;
}

/** Internal errors / limit breaches. Carries only the request id for tracing. */
export function internalErrorMessage(requestId: string | null): string {
  return `${config.systemLabel} could not complete that request (ref: ${requestId ?? 'n/a'}).`;
}

/** Shape every tool result the agent receives: a normal text result. */
export function textResult(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}
