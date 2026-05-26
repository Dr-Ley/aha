import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";

export type NotificationEntity =
  | "booking"
  | "hotel"
  | "payment"
  | "expense"
  | "restaurant"
  | "bar"
  | "enquiry";
export type NotificationAction = "created" | "updated" | "deleted";

type Entity = NotificationEntity;
type Action = NotificationAction;

export async function createNotification(input: {
  companyId: string;
  type: Entity;
  action: Action;
  referenceId: number;
  title: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(notifications).values({
      companyId: input.companyId,
      type: input.type,
      action: input.action,
      referenceId: input.referenceId,
      title: input.title.slice(0, 512),
      metadata: input.metadata ?? null,
      isRead: false,
    });
  } catch (e) {
    console.error("createNotification", e);
  }
}
