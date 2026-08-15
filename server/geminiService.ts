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
  const isArabic = language === 'ar';
  const prompt = isArabic
    ? `قم بتفكيك المهمة التالية إلى 3 إلى 6 خطوات/أجزاء فرعية عمل متسلسلة ومنطقية وشديدة الوضوح:
عنوان المهمة: "${taskTitle}"
${description ? `تفاصيل إضافية: "${description}"` : ''}

أرجع القائمة كـ Array من النصوص المباشرة المكونة من خطوة إلى خطوة.`
    : `Break down the following task into 3 to 6 logical, clear sequential subtasks/steps:
Task title: "${taskTitle}"
${description ? `Description: "${description}"` : ''}`;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];

  for (const modelName of modelsToTry) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const res = await ai.models.generateContent({
        model: modelName,
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
    } catch (mErr) {
      console.warn(`[decomposeTaskWithAI] Model ${modelName} encountered error, trying next fallback:`, mErr);
    }
  }

  return isArabic
    ? ['التخطيط والإعداد الأول', 'التنفيذ والمتابعة', 'المراجعة النهائية']
    : ['Planning & Setup', 'Execution', 'Final Review'];
}

export async function analyzeGoalWithAI(goalData: {
  title: string;
  targetGoal?: string;
  startDate?: string;
  endDate?: string;
  targetMetric?: string;
  targetValue?: number;
  currentValue?: number;
  milestones?: any[];
  language?: string;
}): Promise<{
  percentage: number;
  status: 'excellent' | 'good' | 'behind' | 'critical';
  summary: string;
  advice: string[];
  analyzedAt: string;
}> {
  const isArabic = goalData.language !== 'en';
  const targetVal = goalData.targetValue || 100;
  const currentVal = goalData.currentValue || 0;
  const percentage = Math.min(100, Math.round((currentVal / targetVal) * 100));

  const prompt = isArabic
    ? `حلل الهدف/الخطة التالية من حيث التقدم والنطاق الزمني واقترح نصائح عمليّة:
العنوان: "${goalData.title}"
استراتيجية الهدف: "${goalData.targetGoal || 'غير محدد'}"
تاريخ البداية: ${goalData.startDate || 'اليوم'}
تاريخ الانتهاء: ${goalData.endDate || 'بعد شهر'}
المستهدف العددي: ${currentVal} / ${targetVal} ${goalData.targetMetric || 'وحدة'} (${percentage}%)
عدد المراحل المكتملة: ${(goalData.milestones || []).filter((m: any) => m.completed).length} من أصل ${(goalData.milestones || []).length}

المطلوب إرجاع كائن JSON يحتوي على:
1. status: إما "excellent" أو "good" أو "behind" أو "critical" بناءً على التقدم
2. summary: ملخص مشجع ودقيق لتقييم الإنجاز في جملة واحدة (مثلاً: "تقدمك ممتاز ومتناسق مع جدول الخطة الزمني")
3. advice: قائمة من 2 إلى 4 نصائح عمليّة سريعة للوصول للهدف على الوقت المحدد`
    : `Analyze the following goal progress and timeline:
Title: "${goalData.title}"
Target: ${currentVal} / ${targetVal} ${goalData.targetMetric || 'units'} (${percentage}%)

Return JSON object:
1. status: "excellent" | "good" | "behind" | "critical"
2. summary: A short sentence summarizing progress
3. advice: 2 to 4 actionable advice points`;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];

  for (const modelName of modelsToTry) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const res = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING },
              summary: { type: Type.STRING },
              advice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['status', 'summary', 'advice'],
          },
        },
      });

      if (res.text) {
        const parsed = JSON.parse(res.text);
        let statusStr: 'excellent' | 'good' | 'behind' | 'critical' = 'good';
        if (['excellent', 'good', 'behind', 'critical'].includes(parsed.status?.toLowerCase())) {
          statusStr = parsed.status.toLowerCase() as any;
        } else if (percentage >= 80) statusStr = 'excellent';
        else if (percentage >= 40) statusStr = 'good';
        else if (percentage >= 15) statusStr = 'behind';
        else statusStr = 'critical';

        return {
          percentage,
          status: statusStr,
          summary: parsed.summary || (isArabic ? 'تقييم الإنجاز مكتمل' : 'Goal evaluated'),
          advice: Array.isArray(parsed.advice) ? parsed.advice : [],
          analyzedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn(`[analyzeGoalWithAI] Model ${modelName} fallback error:`, err);
    }
  }

  // Fallback if AI service is temporarily busy
  let fallbackStatus: 'excellent' | 'good' | 'behind' | 'critical' = 'good';
  if (percentage >= 80) fallbackStatus = 'excellent';
  else if (percentage >= 40) fallbackStatus = 'good';
  else fallbackStatus = 'behind';

  return {
    percentage,
    status: fallbackStatus,
    summary: isArabic
      ? `نسبة إنجازك الحالية هي ${percentage}% والعمل مستمر وفق الجدول.`
      : `Current progress is ${percentage}%. Keep going!`,
    advice: isArabic
      ? ['ركز على إنجاز المرحلة التالية', 'حافظ على الاستمرارية اليومية', 'راجع جدولك أسبوعياً']
      : ['Focus on the next milestone', 'Maintain daily rhythm', 'Review weekly'],
    analyzedAt: new Date().toISOString(),
  };
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
