import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isPostgresDuplicateOrAlreadyExists } from "@/lib/pg-error";

let permissionModuleEnumsEnsured = false;

/** Postgres requires enum labels added before inserts reference them. Safe to call repeatedly. */
export async function ensureOverviewPermissionModuleEnum(): Promise<void> {
  if (permissionModuleEnumsEnsured) return;
  for (const label of ["overview", "enquiries"]) {
    try {
      await db.execute(sql.raw(`ALTER TYPE permission_module ADD VALUE '${label}'`));
    } catch (e) {
      if (!isPostgresDuplicateOrAlreadyExists(e)) {
        throw e;
      }
    }
  }
  permissionModuleEnumsEnsured = true;
}
