import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { composeEmailSchema, emailParagraphs, parseRecipientList } from "./compose-message";

describe("parseRecipientList", () => {
  it("splits, trims, and drops duplicates", () => {
    assert.deepEqual(
      parseRecipientList(" Ada@Example.com, ada@example.com;\n guest@camp.test "),
      ["Ada@Example.com", "guest@camp.test"]
    );
  });
});

describe("emailParagraphs", () => {
  it("splits on blank lines and keeps single line breaks", () => {
    assert.deepEqual(emailParagraphs("Hello there\n\nSee you\ntomorrow"), ["Hello there", "See you\ntomorrow"]);
  });
});

describe("composeEmailSchema", () => {
  const valid = {
    companyId: "aha",
    to: "guest@example.com",
    subject: "Your safari",
    heading: "Booking received",
    body: "We have your dates.",
  };

  it("accepts a designed message", () => {
    assert.equal(composeEmailSchema.safeParse(valid).success, true);
  });

  it("allows an incomplete design when only previewing", () => {
    assert.equal(composeEmailSchema.safeParse({ companyId: "aha", preview: true }).success, true);
  });

  it("rejects a send with a bad address or a half-finished button", () => {
    const badAddress = composeEmailSchema.safeParse({ ...valid, to: "not-an-email" });
    assert.equal(badAddress.success, false);
    if (!badAddress.success) {
      assert.match(badAddress.error.issues[0]?.message ?? "", /not a valid email/);
    }
    const badButton = composeEmailSchema.safeParse({ ...valid, buttonLabel: "View trip", buttonUrl: "javascript:alert(1)" });
    assert.equal(badButton.success, false);
  });
});
