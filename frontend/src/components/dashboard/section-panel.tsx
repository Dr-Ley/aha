"use client";

import type { ReactNode } from "react";
import { useCompany } from "@/store/company-context";

type SectionPanelProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function SectionPanel({ title, description, children }: SectionPanelProps) {
  const { selectedCompany } = useCompany();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-base-content/60">{description}</p>
      </div>

      <div className="rounded-2xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">Active company</p>
        <p className="mt-1 text-lg font-semibold">{selectedCompany.name}</p>
        <p className="mt-3 text-sm text-base-content/70">
          This page updates automatically when you switch companies from the top navbar.
        </p>
      </div>

      {children ? <div className="rounded-2xl border border-base-content/10 bg-base-100 p-6 shadow-sm">{children}</div> : null}
    </section>
  );
}
