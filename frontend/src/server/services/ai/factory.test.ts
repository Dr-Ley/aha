import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAIItineraryProvider, resolveAIItineraryProviderName } from "./factory";

describe("AI provider factory", () => {
  it("defaults to gemini when GEMINI_API_KEY is set", () => {
    assert.equal(resolveAIItineraryProviderName({ GEMINI_API_KEY: "test-key" }), "gemini");
  });

  it("prefers gemini over openai when both keys exist", () => {
    assert.equal(
      resolveAIItineraryProviderName({
        GEMINI_API_KEY: "g",
        OPENAI_API_KEY: "o",
      }),
      "gemini"
    );
  });

  it("honours an explicit AI_ITINERARY_PROVIDER override", () => {
    assert.equal(
      resolveAIItineraryProviderName({
        AI_ITINERARY_PROVIDER: "openai",
        GEMINI_API_KEY: "g",
      }),
      "openai"
    );
  });

  it("falls back to heuristic when no LLM key is set", () => {
    assert.equal(resolveAIItineraryProviderName({}), "heuristic");
  });

  it("creates a Gemini provider instance", () => {
    const provider = createAIItineraryProvider("gemini");
    assert.equal(provider.name, "gemini");
  });
});
