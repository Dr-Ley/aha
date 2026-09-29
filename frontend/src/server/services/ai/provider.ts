export type AIStructuredRequest = {
  systemInstruction: string;
  userPayload: unknown;
};

export type AIStructuredResult = {
  rawText: string;
  parsed: unknown;
  provider: string;
  model: string;
  estimatedCostUsd?: number | null;
};

/**
 * Vendor-agnostic structured generation. Itinerary logic must depend on this
 * interface, never on a specific LLM SDK.
 */
export interface AIProvider {
  readonly name: string;
  generateStructured(request: AIStructuredRequest): Promise<AIStructuredResult>;
}

export class AIProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} is not configured`);
    this.name = "AIProviderNotConfiguredError";
  }
}

export class AIProviderNotImplementedError extends Error {
  constructor(provider: string) {
    super(`${provider} provider is not implemented yet`);
    this.name = "AIProviderNotImplementedError";
  }
}
