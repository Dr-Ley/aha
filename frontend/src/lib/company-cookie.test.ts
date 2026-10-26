import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { companyCookieAssignment, resolveCompanySelection } from "./company-cookie";

describe("company cookie selection", () => {
  it("writes the cookie when the user selects another company", () => {
    const next = resolveCompanySelection({
      requestedId: "ewc",
      currentCookie: "aha",
      allowedIds: ["aha", "ewc", "bth"],
    });
    assert.equal(next.id, "ewc");
    assert.equal(next.changed, true);
    assert.equal(next.cookie, "enzi_company=ewc; path=/; samesite=lax");
    assert.equal(companyCookieAssignment("bth"), "enzi_company=bth; path=/; samesite=lax");
  });

  it("falls back to the first allowed company and rewrites the cookie", () => {
    const next = resolveCompanySelection({
      requestedId: "bth",
      currentCookie: "bth",
      allowedIds: ["aha"],
    });
    assert.equal(next.id, "aha");
    assert.equal(next.changed, true);
    assert.equal(next.cookie, "enzi_company=aha; path=/; samesite=lax");
  });

  it("leaves the cookie unchanged when the selection is already active", () => {
    const next = resolveCompanySelection({
      requestedId: "aha",
      currentCookie: "aha",
      allowedIds: ["aha", "ewc"],
    });
    assert.equal(next.id, "aha");
    assert.equal(next.changed, false);
  });
});
