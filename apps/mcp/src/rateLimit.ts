/**
 * Per-user rate limit (Guide 7.2) — a simple fixed 60s window. On breach the
 * runner returns the generic error string + an audit row (a fast friendly error,
 * never a hang).
 */
import { config } from './config.js';

interface Window {
  start: number;
  count: number;
}
const windows = new Map<string, Window>();

export function allow(userId: string): boolean {
  const now = Date.now();
  const w = windows.get(userId);
  if (!w || now - w.start >= 60_000) {
    windows.set(userId, { start: now, count: 1 });
    return true;
  }
  if (w.count >= config.rateLimitPerMin) return false;
  w.count += 1;
  return true;
}

/** Test helper. */
export function _resetRateLimit(): void {
  windows.clear();
}
