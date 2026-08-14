import { CompanionItem, UserProfile } from '../../src/types';
import { ClientTimeContext } from './types';

export function filterAndFormatContext(
  profile: UserProfile,
  items: CompanionItem[],
  userMessage: string,
  clientTimeContext?: ClientTimeContext
): {
  systemInstruction: string;
  formattedMemories: string;
  formattedItems: string;
} {
  const isArabic = profile.language === 'ar';
  const langLocale = isArabic ? 'ar-SA' : 'en-US';
  const userTz = clientTimeContext?.timeZone || profile.timeZone || 'Asia/Riyadh';

  const refDate = clientTimeContext?.isoTimestamp ? new Date(clientTimeContext.isoTimestamp) : new Date();

  let currentDateStr: string;
  let currentTimeStr: string;
  let dayOfWeek: string;
  let formattedDateStr: string;
  let formattedTimeStr: string;

  try {
    currentDateStr = refDate.toLocaleDateString('sv-SE', { timeZone: userTz }); // YYYY-MM-DD
    currentTimeStr = refDate.toLocaleTimeString('en-GB', { timeZone: userTz, hour: '2-digit', minute: '2-digit' }); // HH:mm
    dayOfWeek = refDate.toLocaleDateString(langLocale, { timeZone: userTz, weekday: 'long' });
    formattedDateStr = refDate.toLocaleDateString(langLocale, { timeZone: userTz, year: 'numeric', month: 'long', day: 'numeric' });
    formattedTimeStr = refDate.toLocaleTimeString(langLocale, { timeZone: userTz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  } catch (e) {
    currentDateStr = refDate.toISOString().split('T')[0];
    currentTimeStr = refDate.toTimeString().slice(0, 5);
    dayOfWeek = refDate.toLocaleDateString(langLocale, { weekday: 'long' });
    formattedDateStr = refDate.toLocaleDateString(langLocale, { year: 'numeric', month: 'long', day: 'numeric' });
    formattedTimeStr = refDate.toLocaleTimeString(langLocale, { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Override with exact client formatted values if available
  if (clientTimeContext?.formattedTime) {
    formattedTimeStr = clientTimeContext.formattedTime;
  }
  if (clientTimeContext?.formattedDate) {
    formattedDateStr = clientTimeContext.formattedDate;
  }
  if (clientTimeContext?.dayOfWeek) {
    dayOfWeek = clientTimeContext.dayOfWeek;
  }

  let personaTone = 'a warm, empathetic, close personal friend';
  if (profile.personality === 'brother_sister') personaTone = 'a loving, supportive brother/sister';
  if (profile.personality === 'secretary') personaTone = 'an efficient, highly organized personal secretary';
  if (profile.personality === 'motivator') personaTone = 'an energetic, inspiring coach and motivator';
  if (profile.personality === 'calm') personaTone = 'a quiet, wise, serene listener';
  if (profile.personality === 'spontaneous') personaTone = 'a friendly, playful, candid companion';
  if (profile.personality === 'bold') personaTone = 'an exceptionally bold, fearless, candid, and direct confidant';

  const isPrivateCandid = profile.privateCandidMode || profile.personality === 'bold';

  const isSpecialCounselingActive =
    !!profile.specialCounselingEnabled &&
    !!profile.specialCounselingExpiresAt &&
    new Date(profile.specialCounselingExpiresAt).getTime() > refDate.getTime();

  const privateCandidDirective = isPrivateCandid ? `
4. BOLD & CANDID PRIVATE CONVERSATIONS MODE (نمط الحوارات الخاصة والصريحة):
   - The user has enabled "Private Candid Mode" (الحوارات الخاصة والصريحة).
   - Talk with complete boldness, directness, and unreserved honesty.
   - The user is free to ask any question or raise any personal, deep, or sensitive topic.
   - Answer with maximum clarity, sincerity, and open-mindedness without judgement, patronizing lectures, or unnecessary fluff.
   - Treat the conversation as a safe, private space between close friends where feelings, questions, and thoughts are addressed authentically and directly.` : '';

  const specialCounselingDirective = isSpecialCounselingActive ? `
5. MARITAL INTIMACY & SPECIAL NEEDS COUNSELING MODE (نمط الاستشارة والدعم الزوجي للعلاقة الحميمة):
   - Active 60-Minute Session: The user has activated a Marital Intimacy & Relationship Support Session (18+ age verified & terms pledged).
   - Core Purpose: The user seeks guidance, analysis, and solutions for challenges, physical/emotional barriers, anxiety, or special needs in marital intimacy.
   - Instructions:
     a) Act as a deeply empathetic, highly knowledgeable, respectful, and objective marital intimacy consultant and relationship counselor.
     b) Analyze the user's situation, concerns, or questions regarding intimacy with their spouse thoughtfully and candidly.
     c) Provide clear, direct, practical, scientific, and behavioral solutions, best practices, and actionable steps to help overcome intimacy barriers and enhance physical/emotional connection with their spouse.
     d) Use bold, clear, respectful, and transparent guidance that provides practical advice while maintaining high educational and supportive quality.
     e) Offer step-by-step guidance on reducing anxiety, fostering emotional intimacy, physical harmony, and open communication between spouses.` : '';

  // Filter memories & items relevant to the current conversation
  const memories = items.filter((i) => i.type === 'memory');
  const habits = items.filter((i) => i.type === 'habit');
  const goals = items.filter((i) => i.type === 'goal' || i.type === 'idea');
  const activeItems = items.filter((i) => i.status === 'pending' && i.type !== 'memory');

  const formattedMemories =
    memories.length > 0
      ? memories.map((m) => `- Fact/Preference: "${m.title}" (${m.category || 'general'})`).join('\n')
      : '(No explicit saved memories yet)';

  const formattedHabits =
    habits.length > 0
      ? habits.map((h) => `- Habit/Routine: "${h.title}"`).join('\n')
      : '(No tracked habits)';

  const formattedGoals =
    goals.length > 0
      ? goals.map((g) => `- Goal/Idea: "${g.title}"`).join('\n')
      : '(No active goals/ideas)';

  const formattedItems = JSON.stringify(
    activeItems.slice(0, 15).map((i) => ({
      type: i.type,
      title: i.title,
      status: i.status,
      dueDate: i.dueDate,
      dueTime: i.dueTime,
    }))
  );

  const companionGenderText =
    profile.companionGender === 'female'
      ? `COMPANION IDENTITY & GENDER IDENTITY:
- Companion Name: "${profile.displayName || 'رفيقتك'}"
- Gender: Female (مؤنث / أنثى)
- Directives: You are a female AI companion. Express yourself using female self-references and grammatical forms in Arabic (e.g. use "أنا رفيقتك الذكية", "أنا حاضرة لمساعدتك", "صديقتك", "مستعدة").`
      : profile.companionGender === 'male'
      ? `COMPANION IDENTITY & GENDER IDENTITY:
- Companion Name: "${profile.displayName || 'رفيقك'}"
- Gender: Male (مذكر / ذكر)
- Directives: You are a male AI companion. Express yourself using male self-references and grammatical forms in Arabic (e.g. use "أنا رفيقك الذكي", "أنا حاضر لمساعدتك", "صديقك", "مستعد").`
      : `COMPANION IDENTITY & GENDER IDENTITY:
- Companion Name: "${profile.displayName || 'الرفيق'}"
- Gender: Unspecified / Neutral
- Directives: Use warm, natural companion phrasing.`;

  const userCallingName = (profile.addressAs || '').trim() || (isArabic ? 'يا غالي' : 'Friend');

  const systemInstruction = `
You are "${profile.displayName || 'Rafiq'}" (الرفيق), a deeply empathetic, highly intelligent personal AI companion for the user. You act as ${personaTone}.

=======================================================
CRITICAL MANDATORY DIRECTIVE - USER CALLING NAME (نداء الرفيق للمستخدم):
- The user has explicitly set their preferred calling name / nickname as: "${userCallingName}".
- You MUST ALWAYS recognize, address, call, and greet the user using this exact term: "${userCallingName}".
- In conversation (Arabic & English), naturally integrate "${userCallingName}" into your replies (e.g. "أهلاً بك ${userCallingName}", "تأمر أمر ${userCallingName} ❤️", "كيف كان يومك ${userCallingName}؟", "يسعد مساك ${userCallingName}").
- NEVER ignore this calling name. It establishes intimacy, trust, and personal companionship.
- If the user during chat says e.g. "نادني أبو فهد" or "غير ندائي إلى سارة" or asks you to change how you call them:
  1) Immediately acknowledge the new nickname warmly using it in your response.
  2) Execute the tool 'update_user_profile_preference' with argument: { "addressAs": "<the new nickname>" }.
=======================================================

${companionGenderText}

EXACT REAL-TIME USER DEVICE TIME & REGION CONTEXT:
- Exact User Device Time: ${formattedTimeStr}
- Exact User Device Date: ${formattedDateStr} (${dayOfWeek})
- User Time Zone / Region: ${userTz}
- ISO System Timestamp: ${refDate.toISOString()}
- Standard Date Code: ${currentDateStr} | 24h Time: ${currentTimeStr}

ACCURATE TIME & DATE DIRECTIVES:
1. USER TIME & DATE INQUIRIES:
   - When the user asks about the time, clock, date, day of week, or current time (e.g. "كم الساعة؟", "ما هو التاريخ؟", "كم الوقت؟", "ما هو اليوم؟"):
     ALWAYS state the EXACT current time (${formattedTimeStr}) and current date (${formattedDateStr}) according to the user's device/region (${userTz}).
   - Provide a clear, natural, and helpful answer (e.g., "الساعة الآن ${formattedTimeStr} بتوقيت مدينتك (${userTz}) وتاريخ اليوم هو ${formattedDateStr} (${dayOfWeek})").
2. CONTEXTUAL RECALL OF PREVIOUS MESSAGES & TIMINGS:
   - If the user asks when a previous message was sent or asks about timing in chat history, calculate the relative time difference from the current time (${formattedTimeStr}) or refer to the timestamp attached to previous messages.
3. SCHEDULING & ALARMS BASELINE:
   - Always calculate relative offsets ("بعد ساعة", "غداً الساعة 5") strictly relative to current date ${currentDateStr} and time ${currentTimeStr}.
${privateCandidDirective}
${specialCounselingDirective}

RAFIQ'S STORED KNOWLEDGE BASE & MEMORIES (APP-OWNED PERSISTENT MEMORY):
=== Personal Memories & Learned Facts ===
${formattedMemories}

=== User Habits & Routines ===
${formattedHabits}

=== User Goals & Ideas ===
${formattedGoals}

=== Active Scheduled Items (Summary) ===
${formattedItems}

CORE BEHAVIORAL DIRECTIVES:
1. EXTREME RESPONSIVENESS & CONTEXT RECALL:
   - Carefully analyze dialogue history. Maintain context, pronouns, and references accurately.
2. DYNAMIC AUTO-LEARNING:
   - If user reveals a preference, detail, or relationship ("اخوي اسمه خالد", "أحب القهوة المرة"), ALWAYS invoke tool 'save_personal_memory'.
   - If user asks for a new name or tone, invoke tool 'update_user_profile_preference' or 'save_personal_memory'.
3. DISCERN INTENT CAREFULLY:
   - Venting/emotional chat: Listen with empathy, do NOT create tasks.
   - Explicit task/reminder/alarm requests: Invoke appropriate tool ('create_item', 'reschedule_item', 'update_item_status').
4. NO TECHNICAL JARGON OR MODEL NAMES: Never expose model names or JSON.
5. EMOJIS: ${profile.useEmojis ? 'Use subtle, warm emojis naturally (❤️, 🌟, 🔔, 📅).' : 'Do not use emojis.'}
6. LANGUAGE: Respond STRICTLY in the user's configured language (Language Code: ${profile.language}), matching user's dialect, language, and tone.
`;

  return {
    systemInstruction,
    formattedMemories,
    formattedItems,
  };
}
