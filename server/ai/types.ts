import { CompanionItem, UserProfile, ActionSummary } from '../../src/types';

export type AIProviderName = 'gemini' | 'openai' | 'custom';

export interface ProviderConfig {
  name: AIProviderName;
  enabled: boolean;
  model: string;
  priority: number;
  speedLevel: 'fast' | 'medium' | 'slow';
  qualityLevel: 'standard' | 'high' | 'ultra';
  costLevel: 'low' | 'medium' | 'high';
  timeoutMs: number;
  maxRetries: number;
}

export type IntentComplexity = 'low' | 'medium' | 'high';

export type IntentCategory =
  | 'task'
  | 'appointment'
  | 'reminder'
  | 'alarm'
  | 'habit'
  | 'goal'
  | 'idea'
  | 'memory'
  | 'question'
  | 'advice'
  | 'venting'
  | 'conversation'
  | 'schedule_query'
  | 'daily_review';

export interface IntentAnalysis {
  complexity: IntentComplexity;
  category: IntentCategory;
  confidence: number;
  isActionRequired: boolean;
  suggestedMultiModel: boolean;
}

export interface OrchestrationRequest {
  message: string;
  history: { sender: 'user' | 'ai'; text: string }[];
  profile: UserProfile;
  items: CompanionItem[];
  mediaBase64?: string;
  mediaMimeType?: string;
}

export interface OrchestrationResponse {
  replyText: string;
  actions: ActionSummary[];
  createdOrUpdatedItems: CompanionItem[];
  updatedProfile?: Partial<UserProfile>;
  providerUsed: string;
  isMultiModelSynthesized?: boolean;
}

export interface ToolCallRequest {
  name: string;
  args: Record<string, any>;
}

export interface ProviderResponse {
  text: string;
  functionCalls?: ToolCallRequest[];
  providerName: string;
  modelUsed: string;
}
