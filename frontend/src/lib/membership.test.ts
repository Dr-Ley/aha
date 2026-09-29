import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapGlobalRoleToMembershipRole, mergeMemberships, canProceedTenantAccess } from "./membership-role";

describe("mapGlobalRoleToMembershipRole", () => {
  it("maps current global dashboard roles", () => {
    assert.equal(mapGlobalRoleToMembershipRole("admin"), "owner");
    assert.equal(mapGlobalRoleToMembershipRole("finance"), "finance");
    assert.equal(mapGlobalRoleToMembershipRole("operations"), "operations");
    assert.equal(mapGlobalRoleToMembershipRole("staff"), "operations");
  });

  it("defaults unknown or customer roles to sales", () => {
    assert.equal(mapGlobalRoleToMembershipRole("customer"), "sales");
    assert.equal(mapGlobalRoleToMembershipRole(""), "sales");
    assert.equal(mapGlobalRoleToMembershipRole(null), "sales");
  });
});

describe("mergeMemberships", () => {
  it("keeps existing per-company role when access is unchanged", () => {
    const next = mergeMemberships({
      existing: [{ companyId: "aha", role: "finance", status: "active" }],
      companyIds: ["aha", "ewc"],
      defaultRole: "operations",
    });
    assert.deepEqual(next, [
      { companyId: "aha", role: "finance", status: "active" },
      { companyId: "ewc", role: "operations", status: "active" },
    ]);
  });

  it("drops companies that are no longer in access", () => {
    const next = mergeMemberships({
      existing: [
        { companyId: "aha", role: "owner", status: "active" },
        { companyId: "bth", role: "guide", status: "suspended" },
      ],
      companyIds: ["aha"],
      defaultRole: "sales",
    });
    assert.deepEqual(next, [{ companyId: "aha", role: "owner", status: "active" }]);
  });

  it("applies explicit role and status overrides", () => {
    const next = mergeMemberships({
      existing: [{ companyId: "aha", role: "sales", status: "active" }],
      companyIds: ["aha"],
      defaultRole: "operations",
      overrides: [{ companyId: "aha", role: "finance", status: "suspended" }],
    });
    assert.deepEqual(next, [{ companyId: "aha", role: "finance", status: "suspended" }]);
  });
});

describe("canProceedTenantAccess", () => {
  it("lets a company owner through without module permissions", () => {
    assert.equal(
      canProceedTenantAccess({
        isPlatformAdmin: false,
        membership: { role: "owner", status: "active" },
        hasModuleAccess: false,
      }),
      true
    );
  });

  it("lets a company admin through without module permissions", () => {
    assert.equal(
      canProceedTenantAccess({
        isPlatformAdmin: false,
        membership: { role: "finance", status: "active" },
        hasModuleAccess: false,
      }),
      false
    );
    assert.equal(
      canProceedTenantAccess({
        isPlatformAdmin: false,
        membership: { role: "admin", status: "active" },
        hasModuleAccess: false,
      }),
      true
    );
  });

  it("blocks suspended members even with module permissions", () => {
    assert.equal(
      canProceedTenantAccess({
        isPlatformAdmin: false,
        membership: { role: "owner", status: "suspended" },
        hasModuleAccess: true,
      }),
      false
    );
  });

  it("lets sales through only with module permissions", () => {
    assert.equal(
      canProceedTenantAccess({
        isPlatformAdmin: false,
        membership: { role: "sales", status: "active" },
        hasModuleAccess: true,
      }),
      true
    );
  });

  it("lets platform admins through without membership", () => {
    assert.equal(
      canProceedTenantAccess({
        isPlatformAdmin: true,
        membership: null,
        hasModuleAccess: false,
      }),
      true
    );
  });
});
