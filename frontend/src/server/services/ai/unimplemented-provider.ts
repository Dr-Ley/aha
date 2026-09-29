import { AIProviderNotImplementedError, type AIProvider } from "@/server/services/ai/provider";

export class UnimplementedAIProvider implements AIProvider {
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  async generateStructured(): Promise<never> {
    throw new AIProviderNotImplementedError(this.name);
  }
}
