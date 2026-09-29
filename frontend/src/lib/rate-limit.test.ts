import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-ok-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit({ key, limit: 3, windowMs: 60_000 });
      assert.equal(result.ok, true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit({ key, limit: 2, windowMs: 60_000 });
    checkRateLimit({ key, limit: 2, windowMs: 60_000 });
    const blocked = checkRateLimit({ key, limit: 2, windowMs: 60_000 });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.retryAfterSec >= 1, true);
    }
  });
});
