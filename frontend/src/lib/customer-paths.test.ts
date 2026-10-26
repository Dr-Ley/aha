import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerDetailPath, customersListPath } from "./customer-paths";

describe("customer page paths", () => {
  it("keeps the active company on the list and the detail page", () => {
    assert.equal(customersListPath("ewc"), "/dashboard/customers?companyId=ewc");
    assert.equal(customerDetailPath(12, "bth"), "/dashboard/customers/12?companyId=bth");
  });
});
