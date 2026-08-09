import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import { AIProvider, AIProviderParams } from './AIProvider';
import { ProviderResponse, ToolCallRequest } from '../types';

const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const geminiToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'create_item',
    description: 'Create a new appointment, task, reminder, alarm, habit, goal, idea, note, or follow-up item.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: 'The item type: task, appointment, reminder, alarm, habit, goal, idea, note, followup, memory',
        },
        title: {
          type: Type.STRING,
          description: 'A concise title for the item.',
        },
        description: {
          type: Type.STRING,
          description: 'Optional additional context or note.',
        },
        dueDate: {
          type: Type.STRING,
          description: 'Due date formatted as YYYY-MM-DD if specified or relative to current date.',
        },
        dueTime: {
          type: Type.STRING,
          description: 'Due time formatted as HH:mm in 24-hour format if specified.',
        },
        location: {
          type: Type.STRING,
          description: 'Location if applicable.',
        },
        person: {
          type: Type.STRING,
          description: 'Person involved or related to the item.',
        },
        priority: {
          type: Type.STRING,
          description: 'Priority level: low, medium, or high.',
        },
        repeatRule: {
          type: Type.STRING,
          description: 'Repetition rule: none, daily, weekly, or monthly.',
        },
      },
      required: ['type', 'title'],
    },
  },
  {
    name: 'update_item_status',
    description: 'Mark a task or appointment as completed, cancelled, missed, or pending.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemSearchTitle: {
          type: Type.STRING,
          description: 'Title or phrase identifying the target item.',
        },
        status: {
          type: Type.STRING,
          description: 'Target status: completed, completed_late, missed, snoozed, cancelled, pending',
        },
      },
      required: ['itemSearchTitle', 'status'],
    },
  },
  {
    name: 'reschedule_item',
    description: 'Move an appointment, task, or reminder to a new date and time.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemSearchTitle: {
          type: Type.STRING,
          description: 'Title or keyword identifying the target item.',
        },
        newDueDate: {
          type: Type.STRING,
          description: 'New date formatted as YYYY-MM-DD.',
        },
        newDueTime: {
          type: Type.STRING,
          description: 'New time formatted as HH:mm.',
        },
      },
      required: ['itemSearchTitle'],
    },
  },
  {
    name: 'save_personal_memory',
    description: 'Save a key personal detail, preference, relationship, or secret told by the user for long-term memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fact: {
          type: Type.STRING,
          description: 'The personal fact or preference to remember.',
        },
        category: {
          type: Type.STRING,
          description: 'Category: preference, relationship, life_goal, habit, general',
        },
      },
      required: ['fact'],
    },
  },
  {
    name: 'update_user_profile_preference',
    description: 'Update user preference such as address term, personality tone, or emoji usage if explicitly asked or implied.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        addressAs: {
          type: Type.STRING,
          description: 'Preferred term or name to call the user (e.g., "أبو أحمد", "غالي", "صديقي")',
        },
        personality: {
          type: Type.STRING,
          description: 'Personality archetype: close_friend, brother_sister, secretary, motivator, calm, spontaneous',
        },
        useEmojis: {
          type: Type.BOOLEAN,
          description: 'Whether to use emojis',
        },
      },
    },
  },
];

export class GeminiProvider extends AIProvider {
  readonly name = 'gemini';
  readonly defaultModel = 'gemini-3.6-flash';

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
  }

  async generateResponse(params: AIProviderParams): Promise<ProviderResponse> {
    const modelsToTry = [this.defaultModel, 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: unknown = null;

    for (const modelName of Array.from(new Set(modelsToTry))) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await geminiClient.models.generateContent({
            model: modelName,
            contents: params.contents as any,
            config: {
              systemInstruction: params.systemInstruction,
              temperature: params.temperature ?? 0.3,
              tools: params.tools || [{ functionDeclarations: geminiToolDeclarations }],
            },
          });

          const functionCalls: ToolCallRequest[] = (res.functionCalls || []).map((fc) => ({
            name: fc.name,
            args: (fc.args || {}) as Record<string, any>,
          }));

          return {
            text: res.text || '',
            functionCalls,
            providerName: this.name,
            modelUsed: modelName,
          };
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err);
          if (attempt === 0 && (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED'))) {
            const match = errStr.match(/retry in (\d+(\.\d+)?)s/i);
            const delaySec = match ? parseFloat(match[1]) : 2;
            if (delaySec <= 3) {
              await new Promise((resolve) => setTimeout(resolve, Math.ceil(delaySec * 1000) + 100));
              continue;
            }
          }
          if (attempt === 0 && (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('500'))) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            continue;
          }
          break;
        }
      }
    }

    throw lastError || new Error('GeminiProvider failed to generate response');
  }

  async generateResponseStream(
    params: AIProviderParams,
    onChunk: (text: string) => void
  ): Promise<ProviderResponse> {
    const modelsToTry = [this.defaultModel, 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: unknown = null;

    for (const modelName of Array.from(new Set(modelsToTry))) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const stream = await geminiClient.models.generateContentStream({
            model: modelName,
            contents: params.contents as any,
            config: {
              systemInstruction: params.systemInstruction,
              temperature: params.temperature ?? 0.3,
              tools: params.tools || [{ functionDeclarations: geminiToolDeclarations }],
            },
          });

          let fullText = '';
          const accumulatedCalls: ToolCallRequest[] = [];

          for await (const chunk of stream) {
            if (chunk.text) {
              fullText += chunk.text;
              onChunk(chunk.text);
            }
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              for (const fc of chunk.functionCalls) {
                accumulatedCalls.push({
                  name: fc.name,
                  args: (fc.args || {}) as Record<string, any>,
                });
              }
            }
          }

          return {
            text: fullText,
            functionCalls: accumulatedCalls,
            providerName: this.name,
            modelUsed: modelName,
          };
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err);
          if (attempt === 0 && (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('500'))) {
            await new Promise((resolve) => setTimeout(resolve, 150));
            continue;
          }
          break;
        }
      }
    }

    throw lastError || new Error('GeminiProvider streaming failed');
  }
}
