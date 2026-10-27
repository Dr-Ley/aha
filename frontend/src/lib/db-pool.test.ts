import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { databaseConnectionMode, poolSettingsForDatabaseUrl } from "./db-pool";

describe("database connection mode", () => {
  it("recognizes the shared transaction pooler", () => {
    const mode = databaseConnectionMode(
      "postgresql://postgres.example:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
    );
    assert.equal(mode, "transaction-pooler");
  });

  it("recognizes the shared session pooler", () => {
    const mode = databaseConnectionMode(
      "postgresql://postgres.example:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    );
    assert.equal(mode, "session-pooler");
  });

  it("recognizes a direct Supabase host", () => {
    const mode = databaseConnectionMode("postgresql://postgres:secret@db.example.supabase.co:5432/postgres");
    assert.equal(mode, "direct");
  });
});

describe("serverless pool settings", () => {
  it("caps a transaction-mode client at one connection", () => {
    const settings = poolSettingsForDatabaseUrl(
      "postgresql://postgres.example:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    );
    assert.equal(settings.mode, "transaction-pooler");
    assert.equal(settings.max, 1);
    assert.equal(settings.allowExitOnIdle, true);
    assert.equal(settings.idleTimeoutMillis, 20_000);
    assert.equal(settings.connectionTimeoutMillis, 10_000);
  });
});

function sourceBetween(file: string, start: string, end: string): string {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const from = source.indexOf(start);
  const to = end ? source.indexOf(end, from + start.length) : source.length;
  assert.ok(from >= 0, `missing ${start} in ${file}`);
  return source.slice(from, to === -1 ? source.length : to);
}

describe("dashboard read path does not run schema maintenance", () => {
  it("overview route does not create tables or backfill rows", () => {
    const source = readFileSync(new URL("../app/api/dashboard/overview/route.ts", import.meta.url), "utf8");
    for (const name of ["ensureBookingCustomerColumn", "ensureInvoiceTables", "ensureHotelBookingRoomsTable"]) {
      assert.equal(source.includes(name), false, name);
    }
  });

  it("permissions read does not alter enums or backfill memberships", () => {
    const route = readFileSync(new URL("../app/api/dashboard/permissions/route.ts", import.meta.url), "utf8");
    assert.equal(route.includes("ensureOverviewPermissionModuleEnum"), false);
    const gate = sourceBetween("./permissions-server.ts", "async function tenantAccessGate", "export async function checkApiPermission");
    assert.equal(gate.includes("ensureMembershipsReady"), false);
    const payload = sourceBetween("./permissions-server.ts", "export async function loadUserPermissionPayload", "async function tenantAccessGate");
    assert.equal(payload.includes("ensureMembershipsReady"), false);
  });

  it("notification read does not alter tables before the arrival scan", () => {
    const get = sourceBetween("../app/api/notifications/route.ts", "export async function GET", "export async function PATCH");
    assert.equal(get.includes("ensureDashboardNotificationsColumn"), false);
    assert.equal(get.includes("ensureEnquiryNotificationEnum"), false);
    const scan = sourceBetween("./arrival-day-notifications.ts", "async function scanArrivalDayNotifications", "const safariRows");
    for (const name of ["ensureBookingCustomerColumn", "ensureBookingTravellerColumns", "ensureHotelStayPartyColumns"]) {
      assert.equal(scan.includes(name), false, name);
    }
  });

  it("membership lookup does not create the membership table", () => {
    const lookup = sourceBetween("./membership.ts", "export async function getActiveMembership", "export async function getActiveMembershipCompanyIds");
    assert.equal(lookup.includes("ensureCompanyMembershipsTable"), false);
    const list = sourceBetween("./membership.ts", "export async function listActiveMemberships", "export function companyAdminIdsFromMemberships");
    assert.equal(list.includes("ensureCompanyMembershipsTable"), false);
  });
});
