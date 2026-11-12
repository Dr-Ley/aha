import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hostnameFromHeader,
  portfolioHostsFromEnv,
  rewritePathForSite,
  siteIdForHostname,
} from "./site-hosts";

describe("site host map", () => {
  it("strips the port and normalizes case", () => {
    assert.equal(hostnameFromHeader("LocalHost:3000"), "localhost");
  });

  it("keeps the safari site on its production hosts", () => {
    assert.equal(siteIdForHostname("www.africanhomeadventure.com", ["portfolio.example.com"]), "aha");
    assert.equal(siteIdForHostname("africanhomeadventure.com", []), "aha");
  });

  it("does not let a portfolio host replace the safari domain", () => {
    assert.equal(
      siteIdForHostname("www.africanhomeadventure.com", ["www.africanhomeadventure.com"]),
      "aha"
    );
    assert.deepEqual(portfolioHostsFromEnv("www.africanhomeadventure.com, portfolio.example.com"), [
      "portfolio.example.com",
    ]);
  });

  it("sends only listed portfolio hosts to the portfolio site", () => {
    assert.equal(siteIdForHostname("portfolio.example.com", ["portfolio.example.com"]), "portfolio");
    assert.equal(siteIdForHostname("localhost", ["portfolio.example.com"]), "aha");
  });

  it("rewrites a portfolio host onto /portfolio without moving staff URLs", () => {
    assert.equal(rewritePathForSite("aha", "/"), null);
    assert.equal(rewritePathForSite("aha", "/tours"), null);
    assert.equal(rewritePathForSite("portfolio", "/"), "/portfolio");
    assert.equal(rewritePathForSite("portfolio", "/tours"), "/portfolio");
    assert.equal(rewritePathForSite("portfolio", "/portfolio"), null);
    assert.equal(rewritePathForSite("portfolio", "/dashboard"), null);
    assert.equal(rewritePathForSite("portfolio", "/dashboard/bookings"), null);
    assert.equal(rewritePathForSite("portfolio", "/login"), null);
    assert.equal(rewritePathForSite("portfolio", "/print/invoice/1"), null);
    assert.equal(rewritePathForSite("portfolio", "/api/contact"), null);
    assert.equal(rewritePathForSite("portfolio", "/shop"), null);
    assert.equal(rewritePathForSite("portfolio", "/shop/manage"), null);
  });
});
