import { AIProvider, AIProviderParams } from './providers/AIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { IntentAnalysis, ProviderResponse, ProviderConfig } from './types';

export class ModelRouter {
  private providers: Map<string, AIProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  constructor() {
    const gemini = new GeminiProvider();
    const openai = new OpenAIProvider();

    this.providers.set(gemini.name, gemini);
    this.providers.set(openai.name, openai);

    this.configs.set('gemini', {
      name: 'gemini',
      enabled: true,
      model: 'gemini-3.6-flash',
      priority: 1,
      speedLevel: 'fast',
      qualityLevel: 'high',
      costLevel: 'low',
      timeoutMs: 12000,
      maxRetries: 2,
    });

    this.configs.set('openai', {
      name: 'openai',
      enabled: true,
      model: 'gpt-4o-mini',
      priority: 2,
      speedLevel: 'fast',
      qualityLevel: 'high',
      costLevel: 'low',
      timeoutMs: 12000,
      maxRetries: 2,
    });
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const available: AIProvider[] = [];
    for (const [name, provider] of this.providers.entries()) {
      const config = this.configs.get(name);
      if (config && config.enabled) {
        const isAvail = await provider.isAvailable();
        if (isAvail) {
          available.push(provider);
        }
      }
    }
    return available;
  }

  async routeAndExecute(
    intent: IntentAnalysis,
    params: AIProviderParams
  ): Promise<{ responses: ProviderResponse[]; primaryProviderUsed: string; isMultiModel: boolean }> {
    const available = await this.getAvailableProviders();

    if (available.length === 0) {
      throw new Error('No AI Providers are currently available.');
    }

    // High complexity & multi-model enabled -> try invoking parallel providers if 2+ are available
    if (intent.complexity === 'high' && available.length > 1) {
      try {
        const results = await Promise.allSettled(
          available.map((p) =>
            this.executeWithTimeout(p, params, this.configs.get(p.name)?.timeoutMs || 10000)
          )
        );

        const successfulResponses: ProviderResponse[] = [];
        for (const res of results) {
          if (res.status === 'fulfilled' && res.value) {
            successfulResponses.push(res.value);
          }
        }

        if (successfulResponses.length > 0) {
          return {
            responses: successfulResponses,
            primaryProviderUsed: successfulResponses[0].providerName,
            isMultiModel: successfulResponses.length > 1,
          };
        }
      } catch (err) {
        console.warn('[ModelRouter] Parallel multi-model execution failed, falling back to primary provider:', err);
      }
    }

    // Standard routing: Primary provider with automatic failover
    let lastErr: unknown = null;
    for (const provider of available) {
      try {
        const config = this.configs.get(provider.name);
        const timeout = config?.timeoutMs || 12000;
        const resp = await this.executeWithTimeout(provider, params, timeout);
        return {
          responses: [resp],
          primaryProviderUsed: provider.name,
          isMultiModel: false,
        };
      } catch (err) {
        console.error(`[ModelRouter] Provider ${provider.name} failed:`, err);
        lastErr = err;
      }
    }

    throw lastErr || new Error('All routed AI providers failed.');
  }

  async routeAndExecuteStream(
    intent: IntentAnalysis,
    params: AIProviderParams,
    onChunk: (text: string) => void
  ): Promise<{ response: ProviderResponse; providerUsed: string }> {
    const available = await this.getAvailableProviders();

    if (available.length === 0) {
      throw new Error('No AI Providers available for streaming.');
    }

    let lastErr: unknown = null;
    for (const provider of available) {
      try {
        const resp = await provider.generateResponseStream(params, onChunk);
        return {
          response: resp,
          providerUsed: provider.name,
        };
      } catch (err) {
        console.error(`[ModelRouter] Streaming with provider ${provider.name} failed:`, err);
        lastErr = err;
      }
    }

    throw lastErr || new Error('All streaming AI providers failed.');
  }

  private async executeWithTimeout(
    provider: AIProvider,
    params: AIProviderParams,
    timeoutMs: number
  ): Promise<ProviderResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Provider ${provider.name} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      provider
        .generateResponse(params)
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
