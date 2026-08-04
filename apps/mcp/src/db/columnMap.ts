/**
 * Case map for identifiers: lower-case column name -> real (camelCase) name.
 *
 * Our columns are camelCase (voucherType, totalAmount, contactId, …). When the
 * agent writes them UNQUOTED in acct_query, Postgres and the parser fold them to
 * lower-case and they no longer match. The SQL guard uses this map to restore the
 * real casing before emitting SQL, so natural (unquoted) queries "just work".
 *
 * Built once from information_schema over the columns this account can read
 * (which is exactly the allow-listed set). Ambiguous lower-cases (two real names
 * that differ only by case) are dropped, so we never guess.
 */
import { roPool } from './pools.js';
import { log } from '../logging.js';

let cache: Map<string, string> | null = null;

export async function getColumnCaseMap(): Promise<Map<string, string>> {
  if (cache) return cache;
  const map = new Map<string, string>();
  const ambiguous = new Set<string>();
  try {
    const { rows } = await roPool.query(
      `SELECT DISTINCT column_name FROM information_schema.columns WHERE table_schema = 'public'`,
    );
    for (const r of rows as Array<{ column_name: string }>) {
      const real = r.column_name;
      const key = real.toLowerCase();
      if (key === real) continue; // already lower-case, no remap needed
      const existing = map.get(key);
      if (existing && existing !== real) {
        ambiguous.add(key); // two different real names share a lower-case form
      } else {
        map.set(key, real);
      }
    }
    for (const k of ambiguous) map.delete(k);
  } catch (e) {
    log.warn(null, 'could not build column case map — acct_query will require quoted identifiers', e);
  }
  cache = map;
  return cache;
}

/** Test helper: inject a map without hitting the DB. */
export function _setColumnCaseMap(m: Map<string, string>): void {
  cache = m;
}
