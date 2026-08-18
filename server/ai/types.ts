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
  | 'schedule_today_query'
  | 'schedule_remaining_query'
  | 'notes_query'
  | 'routine_query'
  | 'goals_query'
  | 'time_query'
  | 'daily_review';

export interface ClientTimeContext {
  timeZone?: string;
  isoTimestamp?: string;
  dayOfWeek?: string;
  formattedDate?: string;
  formattedTime?: string;
  time24?: string;
}

export interface IntentAnalysis {
  complexity: IntentComplexity;
  category: IntentCategory;
  confidence: number;
  isActionRequired: boolean;
  suggestedMultiModel: boolean;
  preferredModel?: string;
}

export interface OrchestrationRequest {
  message: string;
  history: { sender: 'user' | 'ai'; text: string; timestamp?: string }[];
  profile: UserProfile;
  items: CompanionItem[];
  mediaBase64?: string;
  mediaMimeType?: string;
  clientTimeContext?: ClientTimeContext;
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
