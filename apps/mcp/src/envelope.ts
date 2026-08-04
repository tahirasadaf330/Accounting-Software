/**
 * The canonical tabular result (Spec §6). Numbers are numbers (not "$1.2M"
 * strings); the currency is a separate field. Row cap + byte cap set
 * `truncated:true` so the agent NARROWS the query rather than paging.
 */

export interface Envelope {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  truncated: boolean;
  as_of: string; // ISO-8601 UTC
  currency?: string; // e.g. "USD" — numeric monetary columns are in this currency
}

export interface EnvelopeOpts {
  rowCap: number;
  byteCap: number;
  asOf?: string;
  currency?: string;
}

const MAX_TEXT_LEN = 4000;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/** Prompt-injection-via-data (Spec/Guide 7.4): free text is data, not instructions. */
function sanitizeCell(value: unknown): unknown {
  if (typeof value !== 'string') return value; // numbers/booleans pass through unchanged
  let s = value.replace(CONTROL_CHARS, ' ');
  if (s.length > MAX_TEXT_LEN) s = s.slice(0, MAX_TEXT_LEN) + '…[truncated]';
  return s;
}

export function buildEnvelope(columns: string[], rows: unknown[][], opts: EnvelopeOpts): { envelope: Envelope } {
  let truncated = false;
  let out = rows.map((r) => r.map(sanitizeCell));
  if (out.length > opts.rowCap) {
    out = out.slice(0, opts.rowCap);
    truncated = true;
  }

  let env: Envelope = {
    columns,
    rows: out,
    row_count: out.length,
    truncated,
    as_of: opts.asOf ?? new Date().toISOString(),
  };
  if (opts.currency) env.currency = opts.currency;

  // Byte cap on the serialized result — halve rows until it fits.
  while (Buffer.byteLength(JSON.stringify(env), 'utf8') > opts.byteCap && env.rows.length > 0) {
    const keep = Math.floor(env.rows.length / 2);
    env = { ...env, rows: env.rows.slice(0, keep), row_count: keep, truncated: true };
  }

  return { envelope: env };
}
