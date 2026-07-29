/**
 * Constant-time verification of the Atlas shared secret (Guide 3.2/3.3).
 * Plain string comparison leaks timing information, so we use timingSafeEqual.
 * Supports OLD + NEW simultaneously for zero-downtime rotation.
 */
import { timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

function constantTimeEquals(presented: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  // timingSafeEqual requires equal lengths; the length check itself is cheap and
  // does not reveal the secret's content.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Returns true iff the presented key matches the current OR the old secret.
 * Both branches are always evaluated (no early-out) to avoid revealing which
 * secret matched via timing.
 */
export function isValidAgentKey(presented: string | undefined): boolean {
  if (!presented) return false;
  const matchNew = constantTimeEquals(presented, config.secret);
  const matchOld = config.secretOld ? constantTimeEquals(presented, config.secretOld) : false;
  return matchNew || matchOld;
}
