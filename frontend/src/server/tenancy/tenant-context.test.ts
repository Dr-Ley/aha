import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { requireCompanyId } from "../../lib/tenant";

describe("TenantContext company resolution", () => {
  it("returns 400 when companyId is missing", () => {
    const missing = requireCompanyId(null);
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.response.status, 400);
  });

  it("returns 400 when companyId is unknown", () => {
    const invalid = requireCompanyId("zzz");
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.response.status, 400);
  });

  it("accepts a known tenant", () => {
    const ok = requireCompanyId("aha");
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.companyId, "aha");
  });
});
