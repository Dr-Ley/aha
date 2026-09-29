import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { companyMemberships } from "@/lib/schema";
import { COMPANY_IDS, type CompanyId } from "@/types/company";
import {
  mapGlobalRoleToMembershipRole,
  mergeMemberships,
  membershipGrantsFullCompanyAccess,
  type MembershipDraft,
  type MembershipRole,
  type MembershipStatus,
} from "@/lib/membership-role";

export {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  mapGlobalRoleToMembershipRole,
  mergeMemberships,
  membershipGrantsFullCompanyAccess,
  canProceedTenantAccess,
  type MembershipDraft,
  type MembershipRole,
  type MembershipStatus,
} from "@/lib/membership-role";

let membershipTableEnsured = false;

export async function ensureCompanyMembershipsTable(): Promise<void> {
  if (membershipTableEnsured) return;
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "membership_role" AS ENUM ('owner', 'admin', 'sales', 'operations', 'guide', 'finance');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "membership_status" AS ENUM ('active', 'invited', 'suspended');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "company_memberships" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL REFERENCES "users"("id"),
      "company_id" varchar(32) NOT NULL REFERENCES "companies"("id"),
      "role" "membership_role" NOT NULL,
      "status" "membership_status" NOT NULL DEFAULT 'active',
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "company_memberships_user_company"
    ON "company_memberships" ("user_id", "company_id")
  `);
  membershipTableEnsured = true;
}

/**
 * Backfill from permission rows and global admins.
 * Safe to run repeatedly (ON CONFLICT DO NOTHING).
 */
export async function backfillCompanyMemberships(): Promise<void> {
  await ensureCompanyMembershipsTable();
  await db.execute(sql`
    INSERT INTO "company_memberships" ("user_id", "company_id", "role", "status")
    SELECT DISTINCT
      up.user_id,
      up.company_id,
      CASE
        WHEN u.role = 'admin' THEN 'owner'::membership_role
        WHEN u.role = 'finance' THEN 'finance'::membership_role
        WHEN u.role IN ('operations', 'staff') THEN 'operations'::membership_role
        ELSE 'sales'::membership_role
      END,
      'active'::membership_status
    FROM "user_permissions" up
    INNER JOIN "users" u ON u.id = up.user_id
    ON CONFLICT ("user_id", "company_id") DO NOTHING
  `);

  for (const companyId of COMPANY_IDS) {
    await db.execute(sql`
      INSERT INTO "company_memberships" ("user_id", "company_id", "role", "status")
      SELECT u.id, ${companyId}, 'owner'::membership_role, 'active'::membership_status
      FROM "users" u
      WHERE u.role = 'admin'
      ON CONFLICT ("user_id", "company_id") DO NOTHING
    `);
  }
}

let membershipsBackfilled = false;

export async function ensureMembershipsReady(): Promise<void> {
  if (membershipsBackfilled) return;
  await backfillCompanyMemberships();
  membershipsBackfilled = true;
}

export async function userHasActiveMembership(
  userId: number,
  companyId: string
): Promise<boolean> {
  const row = await getActiveMembership(userId, companyId);
  return Boolean(row);
}

export async function getActiveMembership(
  userId: number,
  companyId: string
): Promise<{ id: number; role: MembershipRole; status: MembershipStatus } | null> {
  await ensureCompanyMembershipsTable();
  const [row] = await db
    .select({
      id: companyMemberships.id,
      role: companyMemberships.role,
      status: companyMemberships.status,
    })
    .from(companyMemberships)
    .where(
      and(
        eq(companyMemberships.userId, userId),
        eq(companyMemberships.companyId, companyId),
        eq(companyMemberships.status, "active")
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getActiveMembershipCompanyIds(userId: number): Promise<CompanyId[]> {
  const rows = await listActiveMemberships(userId);
  return rows.map((r) => r.companyId);
}

export async function listActiveMemberships(
  userId: number
): Promise<{ companyId: CompanyId; role: MembershipRole; status: MembershipStatus }[]> {
  await ensureCompanyMembershipsTable();
  const rows = await db
    .select({
      companyId: companyMemberships.companyId,
      role: companyMemberships.role,
      status: companyMemberships.status,
    })
    .from(companyMemberships)
    .where(
      and(eq(companyMemberships.userId, userId), eq(companyMemberships.status, "active"))
    );
  return rows.filter((r): r is { companyId: CompanyId; role: MembershipRole; status: MembershipStatus } =>
    (COMPANY_IDS as readonly string[]).includes(r.companyId)
  );
}

export function companyAdminIdsFromMemberships(
  rows: { companyId: CompanyId; role: MembershipRole; status: MembershipStatus }[]
): CompanyId[] {
  return rows
    .filter((r) => membershipGrantsFullCompanyAccess(r.role, r.status))
    .map((r) => r.companyId);
}

export async function listMembershipsForUser(userId: number): Promise<MembershipDraft[]> {
  await ensureCompanyMembershipsTable();
  const rows = await db
    .select({
      companyId: companyMemberships.companyId,
      role: companyMemberships.role,
      status: companyMemberships.status,
    })
    .from(companyMemberships)
    .where(eq(companyMemberships.userId, userId));
  return rows;
}

export async function syncMembershipsFromPermissionCompanies(
  userId: number,
  companyIds: string[],
  globalRole: string | null | undefined,
  overrides?: MembershipDraft[]
): Promise<void> {
  await ensureCompanyMembershipsTable();
  const existing = await listMembershipsForUser(userId);
  const next = mergeMemberships({
    existing,
    companyIds,
    defaultRole: mapGlobalRoleToMembershipRole(globalRole),
    overrides,
  });
  await db.delete(companyMemberships).where(eq(companyMemberships.userId, userId));
  if (next.length === 0) return;
  await db.insert(companyMemberships).values(
    next.map((row) => ({
      userId,
      companyId: row.companyId,
      role: row.role,
      status: row.status,
      updatedAt: new Date(),
    }))
  );
}
