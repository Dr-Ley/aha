"use client";

import { useMemo, useState } from "react";

export type ExportColumn<T> = {
  key: string;
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function tableHtml<T>(title: string, rows: T[], columns: ExportColumn<T>[]): string {
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(c.value(row))}</td>`).join("")}</tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f4f4f4}</style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DashboardTableExport<T>({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: T[];
  columns: ExportColumn<T>[];
}) {
  function exportXls() {
    downloadBlob(
      tableHtml(title, rows, columns),
      `${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.xls`,
      "application/vnd.ms-excel"
    );
  }

  function exportPdf() {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(tableHtml(title, rows, columns));
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" className="btn btn-outline btn-xs" onClick={exportPdf}>
        Download PDF
      </button>
      <button type="button" className="btn btn-outline btn-xs" onClick={exportXls}>
        Download XLS
      </button>
    </div>
  );
}

export function useDashboardPagination<T>(rows: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize]
  );
  return { page: safePage, pageCount, setPage, pagedRows };
}

export function DashboardPagination({
  page,
  pageCount,
  setPage,
}: {
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="join">
      <button type="button" className="btn join-item btn-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <button type="button" className="btn join-item btn-xs pointer-events-none">
        Page {page} of {pageCount}
      </button>
      <button
        type="button"
        className="btn join-item btn-xs"
        disabled={page >= pageCount}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
