import { createHash } from 'crypto';

// Deterministic v4-format UUID derived from a stable seed string.
// Same input → same UUID, so seeders stay idempotent (skip-if-exists works),
// while producing a real UUID that passes @IsUUID('4') / ParseUUIDPipe across
// the app (voucher detail, reversal, netting, payment allocation, etc.).
export function deterministicUuid(seed: string): string {
  const h = createHash('sha256').update(seed).digest('hex');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16); // 8..b
  return (
    `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-` +
    `${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`
  );
}
