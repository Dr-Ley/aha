export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export type ListPage = { page: number; pageSize: number };

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function readListPage(
  searchParams: URLSearchParams
): { ok: true; page: ListPage | null } | { ok: false; error: string } {
  const raw = searchParams.get("page");
  if (raw == null || raw.trim() === "") return { ok: true, page: null };
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    return { ok: false, error: "page must be a positive integer" };
  }
  const sizeRaw = searchParams.get("pageSize");
  let pageSize = DEFAULT_PAGE_SIZE;
  if (sizeRaw != null && sizeRaw.trim() !== "") {
    if (!/^\d+$/.test(sizeRaw) || Number(sizeRaw) < 1) {
      return { ok: false, error: "pageSize must be a positive integer" };
    }
    pageSize = Math.min(MAX_PAGE_SIZE, Number(sizeRaw));
  }
  return { ok: true, page: { page: Number(raw), pageSize } };
}

/** Empty means no bound. A non-empty value must be YYYY-MM-DD. */
export function readYmdParam(value: string | null): string | null | "invalid" {
  if (value == null || value.trim() === "") return null;
  return YMD.test(value) ? value : "invalid";
}
