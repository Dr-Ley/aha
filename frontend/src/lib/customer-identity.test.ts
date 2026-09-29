import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAutoMatchCustomer,
  customerDraftFromGuest,
  customerDraftFromHotelGuest,
  mergeCustomerProfile,
  namesLikelySame,
  normalizeCustomerEmail,
  phoneMatchKey,
  phonesMatch,
  rankCustomerMatch,
  splitPersonName,
  usableCustomerEmail,
} from "./customer-identity";

describe("normalizeCustomerEmail", () => {
  it("lowercases and trims", () => {
    assert.equal(normalizeCustomerEmail("  Ada@AHA.com "), "ada@aha.com");
  });
});

describe("usableCustomerEmail", () => {
  it("rejects values that are not emails", () => {
    assert.equal(usableCustomerEmail("not-an-email"), null);
    assert.equal(usableCustomerEmail(""), null);
  });
});

describe("customerDraftFromGuest", () => {
  it("maps booking guest fields onto a company customer profile", () => {
    const draft = customerDraftFromGuest({
      firstName: "Ada",
      lastName: "Khan",
      email: "Ada@AHA.com",
      phone: "0700",
      country: "Kenya",
    });
    assert.deepEqual(draft, {
      firstName: "Ada",
      lastName: "Khan",
      email: "ada@aha.com",
      phone: "0700",
      nationality: "Kenya",
      country: "Kenya",
    });
  });

  it("keeps a walk-in draft when email is missing", () => {
    const draft = customerDraftFromGuest({ firstName: "John", lastName: "Kamau", phone: "+254712345678" });
    assert.equal(draft?.email, null);
    assert.equal(draft?.phone, "+254712345678");
    assert.equal(canAutoMatchCustomer(draft), false);
  });

  it("does not auto-match on a bad email", () => {
    const draft = customerDraftFromGuest({ firstName: "Ada", email: "not-an-email" });
    assert.equal(draft?.email, null);
    assert.equal(canAutoMatchCustomer(draft), false);
  });
});

describe("splitPersonName", () => {
  it("splits the first word from the rest", () => {
    assert.deepEqual(splitPersonName("Ada Khan"), { firstName: "Ada", lastName: "Khan" });
    assert.deepEqual(splitPersonName("  Mary Jane Watson "), {
      firstName: "Mary",
      lastName: "Jane Watson",
    });
  });

  it("uses Guest when the name is blank", () => {
    assert.deepEqual(splitPersonName("   "), { firstName: "Guest", lastName: null });
  });
});

describe("customerDraftFromHotelGuest", () => {
  it("maps a hotel full name onto a customer draft", () => {
    const draft = customerDraftFromHotelGuest({
      fullName: "Ada Khan",
      email: "Ada@BTH.com",
      phone: "0700",
      country: "Kenya",
    });
    assert.deepEqual(draft, {
      firstName: "Ada",
      lastName: "Khan",
      email: "ada@bth.com",
      phone: "0700",
      nationality: "Kenya",
      country: "Kenya",
    });
  });

  it("still drafts a walk-in without email", () => {
    const draft = customerDraftFromHotelGuest({ fullName: "John Kamau", email: "" });
    assert.equal(draft?.firstName, "John");
    assert.equal(draft?.email, null);
    assert.equal(canAutoMatchCustomer(draft), false);
  });
});

describe("phone matching", () => {
  it("treats Kenyan local and international forms as the same person", () => {
    assert.equal(phoneMatchKey("0712345678"), "712345678");
    assert.equal(phonesMatch("+254 712 345 678", "0712345678"), true);
    assert.equal(phonesMatch("0712345678", "0799999999"), false);
    assert.equal(phonesMatch("123", "123"), false);
  });
});

describe("rankCustomerMatch", () => {
  it("ranks email above phone and never auto-merges on name", () => {
    const guest = { fullName: "John Kamau", email: "john@bth.com", phone: "0712345678" };
    assert.equal(
      rankCustomerMatch(guest, {
        firstName: "Other",
        lastName: "Person",
        email: "john@bth.com",
        phone: "0700000000",
      }),
      "email"
    );
    assert.equal(
      rankCustomerMatch(
        { fullName: "John Kamau", email: "", phone: "0712345678" },
        { firstName: "John", lastName: "Kamau", email: null, phone: "+254712345678" }
      ),
      "phone"
    );
    assert.equal(
      rankCustomerMatch(
        { fullName: "John Kamau", email: "", phone: "" },
        { firstName: "John", lastName: "Kamau", email: null, phone: null }
      ),
      "name"
    );
    assert.equal(namesLikelySame("John Kamau", "Jane Kamau"), false);
  });
});

describe("mergeCustomerProfile", () => {
  it("does not overwrite existing name or phone", () => {
    const next = mergeCustomerProfile(
      {
        firstName: "Ada",
        lastName: "Khan",
        email: "ada@aha.com",
        phone: "0700",
        nationality: "Kenya",
        country: "Kenya",
      },
      {
        firstName: "Other",
        lastName: "Name",
        email: "ada@aha.com",
        phone: "0800",
        nationality: "Tanzania",
        country: "Tanzania",
      }
    );
    assert.equal(next.firstName, "Ada");
    assert.equal(next.phone, "0700");
    assert.equal(next.nationality, "Kenya");
  });

  it("fills a missing email from a later identification", () => {
    const next = mergeCustomerProfile(
      {
        firstName: "John",
        lastName: "Kamau",
        email: null,
        phone: "0712345678",
        nationality: null,
        country: null,
      },
      {
        firstName: "John",
        lastName: "Kamau",
        email: "john@bth.com",
        phone: "0712345678",
        nationality: null,
        country: null,
      }
    );
    assert.equal(next.email, "john@bth.com");
  });
});
