import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readListPage, readYmdParam } from "./list-page";
import { normalizePaymentRecordStatus } from "./payment-status";

describe("list page", () => {
  it("keeps an omitted page as the full list", () => {
    const parsed = readListPage(new URLSearchParams("companyId=aha"));
    assert.deepEqual(parsed, { ok: true, page: null });
  });

  it("reads a 1-based page and caps pageSize at 100", () => {
    const parsed = readListPage(new URLSearchParams("page=2&pageSize=500"));
    assert.deepEqual(parsed, { ok: true, page: { page: 2, pageSize: 100 } });
  });

  it("rejects a zero page", () => {
    const parsed = readListPage(new URLSearchParams("page=0"));
    assert.equal(parsed.ok, false);
  });

  it("accepts only calendar dates", () => {
    assert.equal(readYmdParam(null), null);
    assert.equal(readYmdParam("2026-10-26"), "2026-10-26");
    assert.equal(readYmdParam("26-10-2026"), "invalid");
  });
});

describe("payment status groups", () => {
  it("groups legacy values the same way as the payments panel", () => {
    assert.equal(normalizePaymentRecordStatus("paid"), "completed");
    assert.equal(normalizePaymentRecordStatus("succeeded"), "completed");
    assert.equal(normalizePaymentRecordStatus("refunded"), "cancelled");
    assert.equal(normalizePaymentRecordStatus("mystery"), "pending");
    assert.equal(normalizePaymentRecordStatus(null), "pending");
  });
});
