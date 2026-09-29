"use client";

import { useState } from "react";

export function VoucherToCompanyField({
  bookingId,
  companyId,
  initial,
  canEdit,
}: {
  bookingId: number;
  companyId: string;
  initial: string | null;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function persist(next: string) {
    if (!canEdit) return;
    const trimmed = next.trim();
    if (trimmed === (initial ?? "").trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          companyId,
          voucherToCompany: trimmed || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b border-neutral-400 pb-1">
      <span className="font-semibold">To (Company / Supplier): </span>
      {canEdit ? (
        <>
          <input
            className="border-0 border-b border-dotted border-neutral-600 bg-transparent px-1 py-0.5 min-w-[16rem] max-w-full outline-none"
            value={value}
            maxLength={255}
            placeholder="Lodge, camp, or supplier name"
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            onBlur={() => void persist(value)}
          />
          <span className="no-print ml-2 text-[10px] text-neutral-500">
            {saving ? "Saving…" : saved ? "Saved" : "Edit and leave field to save"}
          </span>
        </>
      ) : (
        <span>{value.trim() || "_______________________________"}</span>
      )}
    </div>
  );
}
