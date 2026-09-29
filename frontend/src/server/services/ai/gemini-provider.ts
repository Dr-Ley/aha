import {
  AIProviderNotConfiguredError,
  type AIProvider,
  type AIStructuredRequest,
  type AIStructuredResult,
} from "@/server/services/ai/provider";

const DEFAULT_MODEL = "gemini-2.5-flash";
const GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** Gemini JSON schema for itinerary output. Enzi still validates IDs after generation. */
const ITINERARY_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    duration_days: { type: "INTEGER" },
    destination_ids: { type: "ARRAY", items: { type: "INTEGER" } },
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "INTEGER" },
          destination_id: { type: "INTEGER" },
          activity_ids: { type: "ARRAY", items: { type: "INTEGER" } },
          accommodation_id: { type: "INTEGER", nullable: true },
          transport_id: { type: "INTEGER", nullable: true },
          transfer_id: { type: "INTEGER", nullable: true },
          notes: { type: "STRING", nullable: true },
        },
        required: ["day", "destination_id"],
      },
    },
    notes: { type: "ARRAY", items: { type: "STRING" } },
    assumptions: { type: "ARRAY", items: { type: "STRING" } },
    recommendations: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "summary", "duration_days", "destination_ids", "days"],
} as const;

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AI response did not contain a JSON object");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: { message?: string; status?: string };
};

/** Google Gemini generateContent — server-side only. Never import this from client code. */
export class GeminiItineraryProvider implements AIProvider {
  readonly name = "gemini";
  readonly model: string;

  constructor(model = process.env.GEMINI_ITINERARY_MODEL?.trim() || DEFAULT_MODEL) {
    this.model = model;
  }

  async generateStructured(request: AIStructuredRequest): Promise<AIStructuredResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new AIProviderNotConfiguredError("gemini");

    const res = await fetch(`${GENERATE_URL}/${this.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(request.userPayload) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: ITINERARY_RESPONSE_SCHEMA,
        },
      }),
    });

    const json = (await res.json().catch(() => null)) as GeminiGenerateResponse | null;
    if (!res.ok) {
      const message = json?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Gemini request failed (${res.status}): ${message.slice(0, 300)}`);
    }
    if (!json) throw new Error("Gemini returned an empty response");

    const blockReason = json.promptFeedback?.blockReason;
    if (blockReason) {
      throw new Error(`Gemini blocked the itinerary request (${blockReason})`);
    }

    const candidate = json.candidates?.[0];
    const finishReason = candidate?.finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
      throw new Error(`Gemini did not complete itinerary generation (${finishReason})`);
    }

    const rawText = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    if (!rawText.trim()) throw new Error("Gemini returned an empty itinerary");

    const promptTokens = json.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = json.usageMetadata?.candidatesTokenCount ?? 0;
    const estimatedCostUsd = (promptTokens * 0.15 + completionTokens * 0.6) / 1_000_000;

    return {
      rawText,
      parsed: parseJsonObject(rawText),
      provider: this.name,
      model: this.model,
      estimatedCostUsd,
    };
  }
}
