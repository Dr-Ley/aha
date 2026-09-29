import type { ItineraryStatus } from "@/server/services/itinerary/types";

export type ItineraryAccessRecord = {
  id: number;
  publicToken: string;
  companyId: string;
  userId: number | null;
  guestEmail: string | null;
  status: ItineraryStatus | string;
};

export type ItineraryActor =
  | { kind: "public"; token: string }
  | { kind: "customer"; userId: number; email?: string | null }
  | { kind: "staff"; companyId: string; canEdit: boolean };

export type ItineraryAccess = {
  view: boolean;
  edit: boolean;
  accept: boolean;
  approve: boolean;
  convert: boolean;
  reason?: string;
};

const CUSTOMER_EDITABLE: ReadonlySet<string> = new Set(["generated", "modified", "draft"]);
const CUSTOMER_ACCEPTABLE: ReadonlySet<string> = new Set(["generated", "modified"]);

export function itineraryAccess(actor: ItineraryActor, record: ItineraryAccessRecord): ItineraryAccess {
  const denied = (reason: string): ItineraryAccess => ({
    view: false,
    edit: false,
    accept: false,
    approve: false,
    convert: false,
    reason,
  });

  if (actor.kind === "staff") {
    if (actor.companyId !== record.companyId) {
      return denied("tenant_mismatch");
    }
    return {
      view: true,
      edit: actor.canEdit && record.status !== "converted" && record.status !== "cancelled",
      accept: false,
      approve: actor.canEdit && record.status === "accepted",
      convert: actor.canEdit && (record.status === "accepted" || record.status === "approved"),
    };
  }

  if (actor.kind === "public") {
    if (actor.token !== record.publicToken) return denied("token_mismatch");
    const editable = CUSTOMER_EDITABLE.has(record.status);
    return {
      view: true,
      edit: editable,
      accept: CUSTOMER_ACCEPTABLE.has(record.status),
      approve: false,
      convert: false,
    };
  }

  const owns =
    (record.userId != null && record.userId === actor.userId) ||
    (!!actor.email && !!record.guestEmail && actor.email.toLowerCase() === record.guestEmail.toLowerCase());
  if (!owns) return denied("not_owner");
  return {
    view: true,
    edit: CUSTOMER_EDITABLE.has(record.status),
    accept: CUSTOMER_ACCEPTABLE.has(record.status),
    approve: false,
    convert: false,
  };
}

export function publicItineraryFields<T extends Record<string, unknown>>(row: T): T {
  const blocked = new Set(["guestPhone"]);
  const next = { ...row };
  for (const key of blocked) {
    if (key in next) delete next[key];
  }
  return next;
}
