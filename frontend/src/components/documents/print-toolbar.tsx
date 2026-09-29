"use client";

import { Download, Printer } from "lucide-react";

export function PrintToolbar({
  title,
  pdfHref,
}: {
  title: string;
  pdfHref?: string | null;
}) {
  return (
    <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-4 py-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm" onClick={() => window.history.back()}>
          Close
        </button>
        {pdfHref ? (
          <a className="btn btn-sm gap-1" href={pdfHref}>
            <Download className="h-4 w-4" />
            PDF
          </a>
        ) : null}
        <button type="button" className="btn btn-sm btn-primary gap-1" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>
    </div>
  );
}
