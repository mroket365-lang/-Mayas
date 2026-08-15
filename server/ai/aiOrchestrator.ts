import { CompanionItem, UserProfile, ActionSummary } from '../../src/types';
import { OrchestrationRequest, OrchestrationResponse } from './types';
import { analyzeIntentAndComplexity } from './intentEngine';
import { filterAndFormatContext } from './memoryManager';
import { ModelRouter } from './modelRouter';
import { validateAndExecuteActions } from './actionManager';
import { synthesizeResponses } from './evaluator';
import { SubscriptionService } from '../services/subscriptionService.js';
import { db } from '../db/database.js';

const router = new ModelRouter();

function generateSmartFallbackReply(
  message: string,
  profile: UserProfile,
  items: CompanionItem[],
  currentDateStr: string
): { replyText: string; createdOrUpdatedItems: CompanionItem[]; actions: ActionSummary[] } {
  const isArabic = profile.language === 'ar';
  const addressAs = profile.addressAs || (isArabic ? 'يا غالي' : 'friend');
  const cleanMsg = (message || '').trim().toLowerCase();

  const createdOrUpdatedItems: CompanionItem[] = [];
  const actions: ActionSummary[] = [];

  // Greetings
  if (/^(مرحبا|أهلا|اهلا|هلا|السلام عليكم|سلام|صباح الخير|مساء الخير|هاي|hello|hi|hey)/i.test(cleanMsg)) {
    const replyText = isArabic
      ? `أهلاً وسهلاً بك ${addressAs} ❤️ أنا معك ومستعد لمساعدتك في تنظيم يومك ومواعيدك ومهامك. كيف أقدر أخدمك اليوم؟ ✨`
      : `Hello ${addressAs}! I am here with you, ready to help you manage your day and tasks. How can I assist you today? ✨`;
    return { replyText, createdOrUpdatedItems, actions };
  }

  // Schedule & Tasks inquiry
  if (/(مهامي|مواعيدي|جدولي|وش عندي|ماذا لدي|today|tasks|schedule)/i.test(cleanMsg)) {
    const todayItems = items.filter((i) => !i.dueDate || i.dueDate === currentDateStr);
    const pendingCount = todayItems.filter((i) => i.status === 'pending').length;
    let replyText = '';

    if (isArabic) {
      if (todayItems.length === 0) {
        replyText = `جدولك اليوم هادئ ومرتب ${addressAs}، ما عندك أي مهام مسجلة لليوم. تحب نضيف أي مهمة أو تذكير جديد؟ ✨`;
      } else {
        const itemTitles = todayItems.slice(0, 5).map((i) => `• ${i.title} (${i.status === 'completed' ? 'منجز' : 'قيد الانتظار'})`).join('\n');
        replyText = `إليك نظرة سريعة على جدولك اليوم ${addressAs} (لديك ${pendingCount} مهام متبقية):\n${itemTitles}\n\nأنا معك دائماً للمساعدة في إنجازها خطوة بخطوة! 💪`;
      }
    } else {
      replyText = `You have ${pendingCount} pending items for today, ${addressAs}. Let me know if you need to adjust or add anything!`;
    }
    return { replyText, createdOrUpdatedItems, actions };
  }

  // Quick Task / Reminder creation fallback
  const reminderMatch = cleanMsg.match(/(?:ذكرني|سجل|أضف|اضف|مهمة جديدة|موعد|remind me to|add task)\s+(.+)/i);
  if (reminderMatch && reminderMatch[1]) {
    const title = reminderMatch[1].trim();
    const isAppointment = cleanMsg.includes('موعد') || cleanMsg.includes('appointment');
    const newItem: CompanionItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: profile.id || 'user_default_01',
      type: isAppointment ? 'appointment' : 'task',
      title: title.length > 50 ? title.substring(0, 50) + '...' : title,
      description: `تم إنشاؤها عبر الرفيق: "${title}"`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: currentDateStr,
      priority: 'medium',
      repeatRule: 'none',
      progressPercent: 0,
    };
    createdOrUpdatedItems.push(newItem);
    actions.push({
      type: 'created',
      itemType: newItem.type,
      title: newItem.title,
      details: isArabic ? `تمت إضافة ${isAppointment ? 'الموعد' : 'المهمة'}: "${newItem.title}"` : `Added ${newItem.title}`,
      itemId: newItem.id,
    });

    const replyText = isArabic
      ? `أبشر ${addressAs}! تم تسجيل ${isAppointment ? 'الموعد' : 'المهمة'} "${newItem.title}" بنجاح في جدولك لليوم ❤️`
      : `Done, ${addressAs}! I added "${newItem.title}" to your schedule for today ❤️`;

    return { replyText, createdOrUpdatedItems, actions };
  }

  // General warm companion fallback
  const replyText = isArabic
    ? `أنا معك وأسمعك بكل اهتمام ${addressAs} ❤️ تواصل معي بأي وقت وسأساعدك في تنظيم أفكارك ومواعيدك ومهامك بكل سرور ✨`
    : `I am right here with you, ${addressAs}! Let me know whenever you need help organizing your tasks or reminders.`;

  return { replyText, createdOrUpdatedItems, actions };
}

export async function processOrchestratedChatStream(
  request: OrchestrationRequest,
  onChunk: (chunkText: string) => void
): Promise<OrchestrationResponse> {
  const { message, history, profile, items, mediaBase64, mediaMimeType, clientTimeContext } = request;
  const isArabic = profile.language === 'ar';
  const refDate = clientTimeContext?.isoTimestamp ? new Date(clientTimeContext.isoTimestamp) : new Date();
  const currentDateStr = refDate.toISOString().split('T')[0];
  const userId = profile.id || 'user_default_01';

  // --- SERVER-SIDE SUBSCRIPTION & USAGE ENFORCEMENT ---
  const entitlement = SubscriptionService.checkEntitlement(userId, 'ai_messages');
  if (!entitlement.allowed) {
    const limitMessage = isArabic
      ? `عذراً يا غالي ❤️ لقد وصلت إلى حد الاستخدام الشهرية للخطة الحالية (${entitlement.currentUsage}/${entitlement.maxLimit} رسالة).\nيمكنك الترقية إلى الخطة المتقدمة (Premium) للتمتع بمحادثات غير محدودة وميزات الذكاء الاصطناعي المتقدمة! ✨`
      : `Sorry! You have reached your monthly message limit for the current plan (${entitlement.currentUsage}/${entitlement.maxLimit} messages).\nUpgrade to Premium to enjoy unlimited AI conversations and advanced features! ✨`;

    onChunk(limitMessage);
    return {
      replyText: limitMessage,
      actions: [],
      createdOrUpdatedItems: [],
      providerUsed: 'limit_reached',
      isMultiModelSynthesized: false,
    };
  }

  // 1. Analyze Intent & Complexity
  const intent = analyzeIntentAndComplexity(message, history);

  // 2. Memory & Context Filtering
  const { systemInstruction } = filterAndFormatContext(profile, items, message, clientTimeContext);

  // 3. Prepare Prompt Contents
  const formattedContents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> =
    history.slice(-16).map((h) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

  const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: message }];

  if (mediaBase64 && mediaMimeType) {
    const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, '');
    userParts.unshift({
      inlineData: {
        mimeType: mediaMimeType,
        data: cleanBase64,
      },
    });
  }

  formattedContents.push({
    role: 'user',
    parts: userParts,
  });

  const aiParams = {
    systemInstruction,
    contents: formattedContents,
    temperature: 0.3,
  };

  try {
    // 4. Stream response from selected AI Provider via Router
    const { response, providerUsed } = await router.routeAndExecuteStream(intent, aiParams, onChunk);

    // Record Usage & Cost
    SubscriptionService.recordUsage(userId, 'ai_messages', 1);
    db.addAIUsageLog({
      userId,
      provider: providerUsed,
      model: response.modelUsed || (providerUsed === 'gemini' ? 'gemini-3.7-flash' : 'gpt-4o-mini'),
      tokensInput: message.length * 2,
      tokensOutput: response.text.length * 2,
      estimatedCost: 0.0001,
      success: true,
      feature: 'ai_messages',
    });

    // 5. Action Execution & Validation
    const { actions, createdOrUpdatedItems, updatedProfile } = validateAndExecuteActions(
      response.functionCalls || [],
      items,
      currentDateStr
    );

    const finalReplyText =
      response.text.trim() ||
      (isArabic ? 'تم يا غالي ❤️ أسمعك بكل اهتمام' : 'Done! I am right here listening.');

    return {
      replyText: finalReplyText,
      actions,
      createdOrUpdatedItems,
      updatedProfile,
      providerUsed,
      isMultiModelSynthesized: false,
    };
  } catch (error) {
    console.error('[AI Orchestrator] Streaming error:', error);
    const fallback = generateSmartFallbackReply(message, profile, items, currentDateStr);
    onChunk(fallback.replyText);
    return {
      replyText: fallback.replyText,
      actions: fallback.actions,
      createdOrUpdatedItems: fallback.createdOrUpdatedItems,
      providerUsed: 'fallback',
      isMultiModelSynthesized: false,
    };
  }
}

export async function processOrchestratedChat(
  request: OrchestrationRequest
): Promise<OrchestrationResponse> {
  const { message, history, profile, items, mediaBase64, mediaMimeType, clientTimeContext } = request;
  const isArabic = profile.language === 'ar';
  const refDate = clientTimeContext?.isoTimestamp ? new Date(clientTimeContext.isoTimestamp) : new Date();
  const currentDateStr = refDate.toISOString().split('T')[0];
  const userId = profile.id || 'user_default_01';

  // --- SERVER-SIDE SUBSCRIPTION & USAGE ENFORCEMENT ---
  const entitlement = SubscriptionService.checkEntitlement(userId, 'ai_messages');
  if (!entitlement.allowed) {
    const limitMessage = isArabic
      ? `عذراً يا غالي ❤️ لقد وصلت إلى حد الاستخدام الشهرية للخطة الحالية (${entitlement.currentUsage}/${entitlement.maxLimit} رسالة).\nيمكنك الترقية إلى الخطة المتقدمة (Premium) للتمتع بمحادثات غير محدودة وميزات الذكاء الاصطناعي المتقدمة! ✨`
      : `Sorry! You have reached your monthly message limit for the current plan (${entitlement.currentUsage}/${entitlement.maxLimit} messages).\nUpgrade to Premium to enjoy unlimited AI conversations and advanced features! ✨`;

    return {
      replyText: limitMessage,
      actions: [],
      createdOrUpdatedItems: [],
      providerUsed: 'limit_reached',
      isMultiModelSynthesized: false,
    };
  }

  // 1. Analyze Intent & Complexity
  const intent = analyzeIntentAndComplexity(message, history);

  // 2. Memory & Context Filtering
  const { systemInstruction } = filterAndFormatContext(profile, items, message, clientTimeContext);

  // 3. Prepare Prompt Contents
  const formattedContents: Array<{ role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> =
    history.slice(-16).map((h) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

  const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [{ text: message }];

  if (mediaBase64 && mediaMimeType) {
    const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, '');
    userParts.unshift({
      inlineData: {
        mimeType: mediaMimeType,
        data: cleanBase64,
      },
    });
  }

  formattedContents.push({
    role: 'user',
    parts: userParts,
  });

  const aiParams = {
    systemInstruction,
    contents: formattedContents,
    temperature: 0.3,
  };

  try {
    // 4. Route and execute through AI Provider(s)
    const { responses, primaryProviderUsed, isMultiModel } = await router.routeAndExecute(intent, aiParams);

    // Record Usage & Cost
    SubscriptionService.recordUsage(userId, 'ai_messages', 1);
    if (isMultiModel) {
      SubscriptionService.recordUsage(userId, 'multi_ai', 1);
    }

    db.addAIUsageLog({
      userId,
      provider: primaryProviderUsed,
      model: responses[0]?.modelUsed || (primaryProviderUsed === 'gemini' ? 'gemini-3.7-flash' : 'gpt-4o-mini'),
      tokensInput: message.length * 2,
      tokensOutput: (responses[0]?.text || '').length * 2,
      estimatedCost: isMultiModel ? 0.0003 : 0.0001,
      success: true,
      feature: isMultiModel ? 'multi_ai' : 'ai_messages',
    });

    // 5. Aggregate function tool calls across responses
    const allToolCalls = responses.flatMap((r) => r.functionCalls || []);

    // 6. Action Execution & Validation Layer
    const { actions, createdOrUpdatedItems, updatedProfile } = validateAndExecuteActions(
      allToolCalls,
      items,
      currentDateStr
    );

    // 7. Multi-Model Synthesis / Evaluator
    const replyText = synthesizeResponses(responses, profile);

    return {
      replyText,
      actions,
      createdOrUpdatedItems,
      updatedProfile,
      providerUsed: primaryProviderUsed,
      isMultiModelSynthesized: isMultiModel,
    };
  } catch (error) {
    console.error('[AI Orchestrator] Execution error:', error);
    const fallback = generateSmartFallbackReply(message, profile, items, currentDateStr);
    return {
      replyText: fallback.replyText,
      actions: fallback.actions,
      createdOrUpdatedItems: fallback.createdOrUpdatedItems,
      providerUsed: 'fallback',
      isMultiModelSynthesized: false,
    };
  }
}

export async function generateOrchestratedDailyReview(
  profile: UserProfile,
  todayItems: CompanionItem[]
): Promise<string> {
  const isArabic = profile.language === 'ar';
  const completed = todayItems.filter((i) => i.status === 'completed' || i.status === 'completed_late').length;
  const missed = todayItems.filter(
    (i) => i.status === 'missed' || (i.status === 'pending' && i.dueDate && new Date(i.dueDate) < new Date())
  ).length;
  const total = todayItems.length;

  const prompt = `
Generate a warm, supportive end-of-day review message from Rafiq to "${profile.addressAs}".
Today's stats:
- Total items: ${total}
- Completed: ${completed}
- Missed or pending: ${missed}
Language: ${isArabic ? 'Arabic' : 'English'}
Keep it under 3 short sentences. Be encouraging and friendly, never shameful!
`;

  const aiParams = {
    systemInstruction: 'You are Rafiq, a supportive AI companion.',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  };

  try {
    const { responses } = await router.routeAndExecute({ complexity: 'low', category: 'daily_review', confidence: 1, isActionRequired: false, suggestedMultiModel: false }, aiParams);
    return responses[0]?.text || (isArabic ? 'أداء رائع اليوم! أهم شيء أنك تحاول دائماً واليوم كان ملئ بالإنجازات.' : 'Great effort today! The important thing is that you keep moving forward.');
  } catch (e) {
    console.error('[AI Orchestrator] Daily review generation error:', e);
    return isArabic
      ? 'أتمنى لك ليلة هادئة ومريحة، وبكرة نبدأ يوم جديد سوا ❤️'
      : 'Wishing you a peaceful night, let us conquer tomorrow together!';
  }
}
