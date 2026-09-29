import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidCompanyId, parseCompanyId, requireCompanyId } from "./tenant";

describe("parseCompanyId", () => {
  it("accepts known tenants", () => {
    assert.equal(parseCompanyId("aha"), "aha");
    assert.equal(parseCompanyId("ewc"), "ewc");
    assert.equal(parseCompanyId("bth"), "bth");
    assert.equal(parseCompanyId("  aha  "), "aha");
  });

  it("rejects missing and unknown tenants instead of falling back to aha", () => {
    assert.equal(parseCompanyId(null), null);
    assert.equal(parseCompanyId(undefined), null);
    assert.equal(parseCompanyId(""), null);
    assert.equal(parseCompanyId("not-a-company"), null);
    assert.equal(parseCompanyId("AHA"), null);
  });
});

describe("isValidCompanyId", () => {
  it("narrows only known ids", () => {
    assert.equal(isValidCompanyId("aha"), true);
    assert.equal(isValidCompanyId("invalid"), false);
  });
});

describe("requireCompanyId", () => {
  it("returns ok for valid company", () => {
    const result = requireCompanyId("ewc");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.companyId, "ewc");
  });

  it("returns 400 for missing or invalid company", () => {
    const missing = requireCompanyId(null);
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.response.status, 400);

    const invalid = requireCompanyId("zzz");
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.response.status, 400);
  });
});
