import { GoogleGenAI, Type } from '@google/genai';
import { CompanionItem, UserProfile, ActionSummary } from '../src/types';
import { ClientTimeContext } from './ai/types.js';
import {
  processOrchestratedChatStream,
  processOrchestratedChat,
  generateOrchestratedDailyReview,
} from './ai/aiOrchestrator.js';

export async function decomposeTaskWithAI(
  taskTitle: string,
  description?: string,
  language: string = 'ar'
): Promise<string[]> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const isArabic = language === 'ar';
    const prompt = isArabic
      ? `قم بتفكيك المهمة التالية إلى 3 إلى 6 خطوات/أجزاء فرعية عمل متسلسلة ومنطقية وشديدة الوضوح:
عنوان المهمة: "${taskTitle}"
${description ? `تفاصيل إضافية: "${description}"` : ''}

أرجع القائمة كـ Array من النصوص المباشرة المكونة من خطوة إلى خطوة.`
      : `Break down the following task into 3 to 6 logical, clear sequential subtasks/steps:
Task title: "${taskTitle}"
${description ? `Description: "${description}"` : ''}`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of subtask titles',
        },
      },
    });

    if (res.text) {
      const parsed = JSON.parse(res.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any) => String(s).trim()).filter(Boolean);
      }
    }
  } catch (err) {
    console.error('Error decomposing task with AI:', err);
  }

  return language === 'ar'
    ? ['التخطيط والإعداد الأول', 'التنفيذ والمتابعة', 'المراجعة النهائية']
    : ['Planning & Setup', 'Execution', 'Final Review'];
}

export async function processCompanionChatStream(
  userMessage: string,
  history: { sender: 'user' | 'ai'; text: string; timestamp?: string }[],
  profile: UserProfile,
  currentItems: CompanionItem[],
  onChunk: (chunkText: string) => void,
  mediaBase64?: string,
  mediaMimeType?: string,
  clientTimeContext?: ClientTimeContext
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
      clientTimeContext,
    },
    onChunk
  );
}

export async function processCompanionChat(
  userMessage: string,
  history: { sender: 'user' | 'ai'; text: string; timestamp?: string }[],
  profile: UserProfile,
  currentItems: CompanionItem[],
  mediaBase64?: string,
  mediaMimeType?: string,
  clientTimeContext?: ClientTimeContext
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
    clientTimeContext,
  });
}

export async function generateDailyReview(
  profile: UserProfile,
  todayItems: CompanionItem[]
): Promise<string> {
  return generateOrchestratedDailyReview(profile, todayItems);
}
