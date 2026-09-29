import {
  AIProviderNotConfiguredError,
  type AIProvider,
  type AIStructuredRequest,
  type AIStructuredResult,
} from "@/server/services/ai/provider";

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AI response did not contain a JSON object");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}

/** OpenAI Chat Completions — server-side only. Never import this from client code. */
export class OpenAIItineraryProvider implements AIProvider {
  readonly name = "openai";
  readonly model: string;

  constructor(model = process.env.OPENAI_ITINERARY_MODEL?.trim() || "gpt-4o-mini") {
    this.model = model;
  }

  async generateStructured(request: AIStructuredRequest): Promise<AIStructuredResult> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new AIProviderNotConfiguredError("openai");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: request.systemInstruction },
          { role: "user", content: JSON.stringify(request.userPayload) },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const rawText = json.choices?.[0]?.message?.content ?? "";
    if (!rawText.trim()) throw new Error("OpenAI returned an empty itinerary");

    const promptTokens = json.usage?.prompt_tokens ?? 0;
    const completionTokens = json.usage?.completion_tokens ?? 0;
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
