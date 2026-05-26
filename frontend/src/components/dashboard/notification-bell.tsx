"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCompany } from "@/store/company-context";
import type { NotificationEntity } from "@/lib/notify";
import { EntityViewModal } from "@/components/dashboard/entity-view-modal";

type NotificationRow = {
  id: number;
  companyId: string;
  type: NotificationEntity;
  action: string;
  referenceId: number;
  title: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
};

function relTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { selectedCompanyId } = useCompany();
  const [disabled, setDisabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<{ kind: NotificationEntity; id: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/notifications?companyId=${encodeURIComponent(selectedCompanyId)}`);
    const j = await r.json();
    if (j.notificationsDisabled) {
      setDisabled(true);
      setItems([]);
      setUnreadCount(0);
      return;
    }
    setDisabled(false);
    if (j.success) {
      setItems(j.notifications ?? []);
      setUnreadCount(Number(j.unreadCount ?? 0));
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 45000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function onItemClick(n: NotificationRow) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    setOpen(false);
    setModal({ kind: n.type, id: n.referenceId });
    void load();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true, companyId: selectedCompanyId }),
    });
    void load();
  }

  if (disabled) return null;

  return (
    <>
      <div ref={rootRef} className={`relative ${open ? "dropdown-open" : ""}`}>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Notifications"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <div className="indicator">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="badge badge-accent px-1 badge-xs indicator-item">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </div>
        </button>
        {open ? (
          <div
            className="fixed right-3 top-16 z-100 w-[calc(100vw-1.5rem)] max-w-80 rounded-box border border-base-content/10 bg-base-100 p-0 shadow-lg md:absolute md:right-0 md:top-full md:mt-2 md:w-80"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-base-content/10 px-3 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 ? (
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => void markAllRead()}>
                  Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-base-content/50">No activity yet.</li>
              ) : (
                items.map((n) => (
                  <li key={n.id} className="border-b border-base-content/5 last:border-0">
                    <button
                      type="button"
                      className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-base-200/80 ${
                        n.isRead ? "text-base-content/70" : "bg-primary/5 font-medium text-base-content"
                      }`}
                      onClick={() => void onItemClick(n)}
                    >
                      <span className="line-clamp-2">{n.title}</span>
                      <span className="text-xs text-base-content/50">
                        {relTime(typeof n.createdAt === "string" ? n.createdAt : String(n.createdAt))} ·{" "}
                        {n.metadata && typeof n.metadata === "object" && (n.metadata as { kind?: string }).kind === "arrival_day"
                          ? "Arrival day"
                          : n.action}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
      <EntityViewModal
        open={modal !== null}
        onClose={() => setModal(null)}
        companyId={selectedCompanyId}
        kind={modal?.kind ?? null}
        entityId={modal?.id ?? null}
      />
    </>
  );
}
