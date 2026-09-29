import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isPostgresDuplicateOrAlreadyExists } from "@/lib/pg-error";

let enquiryEnumEnsured = false;

/** Live DBs may predate `enquiry` on `notification_entity`. Safe to call repeatedly. */
export async function ensureEnquiryNotificationEnum(): Promise<void> {
  if (enquiryEnumEnsured) return;
  try {
    await db.execute(sql`ALTER TYPE "notification_entity" ADD VALUE IF NOT EXISTS 'enquiry'`);
  } catch (e) {
    if (!isPostgresDuplicateOrAlreadyExists(e)) throw e;
  }
  enquiryEnumEnsured = true;
}
