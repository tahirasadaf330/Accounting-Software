/**
 * The ONE canonical output envelope (Guide 6.0). Tabular tool results serialize
 * to this shape. Row cap + byte cap set `truncated:true` so the agent NARROWS
 * the query rather than paging (there is no pagination).
 */

export interface Envelope {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  truncated: boolean;
  as_of: string; // ISO-8601 UTC
}

export interface EnvelopeOpts {
  rowCap: number;
  byteCap: number;
  asOf?: string;
}

const MAX_TEXT_LEN = 4000;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/**
 * Sanitize a cell before it reaches the agent (Guide 7.4 prompt-injection-via-data):
 * free-text is data, never instructions — strip control chars and cap length.
 */
function sanitizeCell(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  let s = value.replace(CONTROL_CHARS, ' ');
  if (s.length > MAX_TEXT_LEN) s = s.slice(0, MAX_TEXT_LEN) + '…[truncated]';
  return s;
}

export function buildEnvelope(columns: string[], rows: unknown[][], opts: EnvelopeOpts): {
  text: string;
  envelope: Envelope;
} {
  let truncated = false;
  let out = rows.map((r) => r.map(sanitizeCell));
  if (out.length > opts.rowCap) {
    out = out.slice(0, opts.rowCap);
    truncated = true;
  }

  const asOf = opts.asOf ?? new Date().toISOString();
  let env: Envelope = { columns, rows: out, row_count: out.length, truncated, as_of: asOf };
  let text = JSON.stringify(env);

  // Byte cap on the serialized envelope — halve rows until it fits.
  while (Buffer.byteLength(text, 'utf8') > opts.byteCap && env.rows.length > 0) {
    const keep = Math.floor(env.rows.length / 2);
    env = { ...env, rows: env.rows.slice(0, keep), row_count: keep, truncated: true };
    text = JSON.stringify(env);
  }

  return { text, envelope: env };
}

/** Empty results return the same envelope shape (never a bare apology string). */
export function emptyEnvelope(columns: string[], asOf?: string): { text: string; envelope: Envelope } {
  const env: Envelope = { columns, rows: [], row_count: 0, truncated: false, as_of: asOf ?? new Date().toISOString() };
  return { text: JSON.stringify(env), envelope: env };
}
