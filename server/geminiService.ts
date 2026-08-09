import { CompanionItem, UserProfile, ActionSummary } from '../src/types';
import {
  processOrchestratedChatStream,
  processOrchestratedChat,
  generateOrchestratedDailyReview,
} from './ai/aiOrchestrator.js';

export async function processCompanionChatStream(
  userMessage: string,
  history: { sender: 'user' | 'ai'; text: string }[],
  profile: UserProfile,
  currentItems: CompanionItem[],
  onChunk: (chunkText: string) => void,
  mediaBase64?: string,
  mediaMimeType?: string
): Promise<{
  replyText: string;
  actions: ActionSummary[];
  createdOrUpdatedItems: CompanionItem[];
  updatedProfile?: Partial<UserProfile>;
}> {
  return processOrchestratedChatStream(
    {
      message: userMessage,
      history,
      profile,
      items: currentItems,
      mediaBase64,
      mediaMimeType,
    },
    onChunk
  );
}

export async function processCompanionChat(
  userMessage: string,
  history: { sender: 'user' | 'ai'; text: string }[],
  profile: UserProfile,
  currentItems: CompanionItem[],
  mediaBase64?: string,
  mediaMimeType?: string
): Promise<{
  replyText: string;
  actions: ActionSummary[];
  createdOrUpdatedItems: CompanionItem[];
  updatedProfile?: Partial<UserProfile>;
}> {
  return processOrchestratedChat({
    message: userMessage,
    history,
    profile,
    items: currentItems,
    mediaBase64,
    mediaMimeType,
  });
}

export async function generateDailyReview(
  profile: UserProfile,
  todayItems: CompanionItem[]
): Promise<string> {
  return generateOrchestratedDailyReview(profile, todayItems);
}
