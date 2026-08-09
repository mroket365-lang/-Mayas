import OpenAI from 'openai';
import { AIProvider, AIProviderParams } from './AIProvider';
import { ProviderResponse, ToolCallRequest } from '../types';

export const openAIToolDeclarations: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_item',
      description: 'Create a new appointment, task, reminder, alarm, habit, goal, idea, note, or follow-up item.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Item type: task, appointment, reminder, alarm, habit, goal, idea, note, followup, memory' },
          title: { type: 'string', description: 'Concise title for the item.' },
          description: { type: 'string', description: 'Optional context or note.' },
          dueDate: { type: 'string', description: 'Due date as YYYY-MM-DD.' },
          dueTime: { type: 'string', description: 'Due time as HH:mm.' },
          location: { type: 'string', description: 'Location if applicable.' },
          person: { type: 'string', description: 'Person involved.' },
          priority: { type: 'string', description: 'Priority: low, medium, or high.' },
          repeatRule: { type: 'string', description: 'Repetition: none, daily, weekly, or monthly.' },
        },
        required: ['type', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_item_status',
      description: 'Mark a task or appointment as completed, cancelled, missed, or pending.',
      parameters: {
        type: 'object',
        properties: {
          itemSearchTitle: { type: 'string', description: 'Title keyword identifying the item.' },
          status: { type: 'string', description: 'Target status: completed, completed_late, missed, snoozed, cancelled, pending' },
        },
        required: ['itemSearchTitle', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reschedule_item',
      description: 'Move an appointment, task, or reminder to a new date and time.',
      parameters: {
        type: 'object',
        properties: {
          itemSearchTitle: { type: 'string', description: 'Title or keyword.' },
          newDueDate: { type: 'string', description: 'New date as YYYY-MM-DD.' },
          newDueTime: { type: 'string', description: 'New time as HH:mm.' },
        },
        required: ['itemSearchTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_personal_memory',
      description: 'Save a key personal detail, preference, relationship, or secret told by the user.',
      parameters: {
        type: 'object',
        properties: {
          fact: { type: 'string', description: 'Fact or preference to remember.' },
          category: { type: 'string', description: 'Category: preference, relationship, life_goal, habit, general' },
        },
        required: ['fact'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_user_profile_preference',
      description: 'Update user preference such as address term, personality tone, or emoji usage.',
      parameters: {
        type: 'object',
        properties: {
          addressAs: { type: 'string', description: 'Preferred term or name to call user.' },
          personality: { type: 'string', description: 'Personality archetype.' },
          useEmojis: { type: 'boolean', description: 'Whether to use emojis.' },
        },
      },
    },
  },
];

export class OpenAIProvider extends AIProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o-mini';

  private getClient(): OpenAI | null {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.trim().length === 0 || key === 'MY_OPENAI_API_KEY') {
      return null;
    }
    return new OpenAI({ apiKey: key });
  }

  isAvailable(): boolean {
    return this.getClient() !== null;
  }

  private convertMessages(params: AIProviderParams): OpenAI.ChatCompletionMessageParam[] {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }

    for (const item of params.contents) {
      const role = item.role === 'model' ? 'assistant' : 'user';
      let contentText = '';
      const parts: any[] = [];

      for (const p of item.parts) {
        if (p.text) {
          contentText += p.text + '\n';
        }
        if (p.inlineData) {
          parts.push({
            type: 'image_url',
            image_url: {
              url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
            },
          });
        }
      }

      if (parts.length > 0) {
        if (contentText.trim()) {
          parts.unshift({ type: 'text', text: contentText.trim() });
        }
        messages.push({ role: 'user', content: parts });
      } else {
        messages.push({ role, content: contentText.trim() });
      }
    }

    return messages;
  }

  async generateResponse(params: AIProviderParams): Promise<ProviderResponse> {
    const client = this.getClient();
    if (!client) {
      throw new Error('OpenAI API key not provided or unavailable');
    }

    const messages = this.convertMessages(params);
    const completion = await client.chat.completions.create({
      model: this.defaultModel,
      messages,
      tools: openAIToolDeclarations,
      temperature: params.temperature ?? 0.3,
    });

    const choice = completion.choices[0]?.message;
    const text = choice?.content || '';
    const functionCalls: ToolCallRequest[] = [];

    if (choice?.tool_calls) {
      for (const tc of choice.tool_calls) {
        if (tc.type === 'function') {
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || '{}');
          } catch (_) {}
          functionCalls.push({
            name: tc.function.name,
            args: parsedArgs,
          });
        }
      }
    }

    return {
      text,
      functionCalls,
      providerName: this.name,
      modelUsed: completion.model || this.defaultModel,
    };
  }

  async generateResponseStream(
    params: AIProviderParams,
    onChunk: (text: string) => void
  ): Promise<ProviderResponse> {
    const client = this.getClient();
    if (!client) {
      throw new Error('OpenAI API key not provided or unavailable');
    }

    const messages = this.convertMessages(params);
    const stream = await client.chat.completions.create({
      model: this.defaultModel,
      messages,
      tools: openAIToolDeclarations,
      temperature: params.temperature ?? 0.3,
      stream: true,
    });

    let fullText = '';
    const toolCallAccMap: Record<number, { name: string; argumentsStr: string }> = {};

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullText += delta.content;
        onChunk(delta.content);
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index;
          if (!toolCallAccMap[index]) {
            toolCallAccMap[index] = { name: '', argumentsStr: '' };
          }
          if (tc.function?.name) {
            toolCallAccMap[index].name = tc.function.name;
          }
          if (tc.function?.arguments) {
            toolCallAccMap[index].argumentsStr += tc.function.arguments;
          }
        }
      }
    }

    const functionCalls: ToolCallRequest[] = [];
    for (const idx in toolCallAccMap) {
      const item = toolCallAccMap[idx];
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(item.argumentsStr || '{}');
      } catch (_) {}
      if (item.name) {
        functionCalls.push({
          name: item.name,
          args: parsedArgs,
        });
      }
    }

    return {
      text: fullText,
      functionCalls,
      providerName: this.name,
      modelUsed: this.defaultModel,
    };
  }
}
