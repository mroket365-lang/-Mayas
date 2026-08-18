import { ProviderResponse, ToolCallRequest } from '../types';

export interface AIProviderParams {
  systemInstruction: string;
  contents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }>;
  tools?: any[];
  temperature?: number;
  preferredModel?: string;
}

export abstract class AIProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  abstract isAvailable(): Promise<boolean> | boolean;

  abstract generateResponse(params: AIProviderParams): Promise<ProviderResponse>;

  abstract generateResponseStream(
    params: AIProviderParams,
    onChunk: (text: string) => void
  ): Promise<ProviderResponse>;
}
