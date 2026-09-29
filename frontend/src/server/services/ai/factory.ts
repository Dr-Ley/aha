import { GeminiItineraryProvider } from "@/server/services/ai/gemini-provider";
import { HeuristicItineraryProvider } from "@/server/services/ai/heuristic-provider";
import { OpenAIItineraryProvider } from "@/server/services/ai/openai-provider";
import type { AIProvider } from "@/server/services/ai/provider";
import { UnimplementedAIProvider } from "@/server/services/ai/unimplemented-provider";

export type AIItineraryProviderName = "openai" | "anthropic" | "gemini" | "heuristic" | "local";

type EnvMap = Record<string, string | undefined>;

export function resolveAIItineraryProviderName(env: EnvMap = process.env): AIItineraryProviderName {
  const configured = env.AI_ITINERARY_PROVIDER?.trim().toLowerCase();
  if (
    configured === "openai" ||
    configured === "anthropic" ||
    configured === "gemini" ||
    configured === "heuristic" ||
    configured === "local"
  ) {
    return configured;
  }
  if (env.GEMINI_API_KEY?.trim()) return "gemini";
  if (env.OPENAI_API_KEY?.trim()) return "openai";
  return "heuristic";
}

/** Factory — swap providers via env without changing itinerary/pricing/booking code. */
export function createAIItineraryProvider(name = resolveAIItineraryProviderName()): AIProvider {
  switch (name) {
    case "gemini":
      return new GeminiItineraryProvider();
    case "openai":
      return new OpenAIItineraryProvider();
    case "heuristic":
    case "local":
      return new HeuristicItineraryProvider();
    case "anthropic":
      return new UnimplementedAIProvider("anthropic");
    default:
      return new HeuristicItineraryProvider();
  }
}
