/**
 * Server-side logging. Full detail stays HERE, keyed by request id — it must
 * never reach the agent (Guide 5.1). Never log the shared secret or its value.
 */
import { config } from './config.js';

type Level = 'info' | 'warn' | 'error' | 'alert';

function emit(level: Level, requestId: string | null, message: string, detail?: unknown): void {
  const line: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    svc: `${config.systemSlug}-mcp`,
    reqId: requestId,
    msg: message,
  };
  if (detail !== undefined) line.detail = serialize(detail);
  const out = JSON.stringify(line);
  if (level === 'error' || level === 'alert') {
    // eslint-disable-next-line no-console
    console.error(out);
  } else {
    // eslint-disable-next-line no-console
    console.log(out);
  }
}

function serialize(detail: unknown): unknown {
  if (detail instanceof Error) {
    return { name: detail.name, message: detail.message, stack: detail.stack };
  }
  return detail;
}

export const log = {
  info: (reqId: string | null, msg: string, detail?: unknown) => emit('info', reqId, msg, detail),
  warn: (reqId: string | null, msg: string, detail?: unknown) => emit('warn', reqId, msg, detail),
  error: (reqId: string | null, msg: string, detail?: unknown) => emit('error', reqId, msg, detail),
  /** Use for conditions that must page an on-call human (e.g. audit-write failure). */
  alert: (reqId: string | null, msg: string, detail?: unknown) => emit('alert', reqId, msg, detail),
};
