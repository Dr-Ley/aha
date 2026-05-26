/**
 * Drizzle and Neon wrap Postgres errors: the useful message / PG code are often on `cause`.
 * Use this when ignoring benign duplicates (e.g. `ALTER TYPE ... ADD VALUE` idempotency).
 */
export function isPostgresDuplicateOrAlreadyExists(e: unknown): boolean {
  let cur: unknown = e;
  const seen = new Set<unknown>();
  while (cur != null && typeof cur === "object" && !seen.has(cur)) {
    seen.add(cur);
    const code = (cur as { code?: string }).code;
    if (code === "42710") return true;
    const msg = cur instanceof Error ? cur.message : String(cur);
    const lower = msg.toLowerCase();
    if (
      lower.includes("already exists") ||
      lower.includes("duplicate") ||
      lower.includes("duplicate_object")
    ) {
      return true;
    }
    cur = (cur as { cause?: unknown }).cause;
  }
  return false;
}
