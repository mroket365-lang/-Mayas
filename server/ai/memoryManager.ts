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

  const isPrivateCandid = Boolean(profile.privateCandidMode);

  const activeConsultationType = profile.activeConsultationType || (profile.specialCounselingEnabled ? 'marital' : 'none');
  const consultationExpiresAt = profile.activeConsultationExpiresAt || profile.specialCounselingExpiresAt;
  const isConsultationActive =
    activeConsultationType !== 'none' &&
    (!consultationExpiresAt || new Date(consultationExpiresAt).getTime() > refDate.getTime());

  let consultationDirective = '';
  if (isConsultationActive) {
    if (activeConsultationType === 'financial') {
      consultationDirective = `
5. SPECIALIZED CONSULTATION ACTIVE - FINANCIAL & ECONOMIC ADVISORY (استشارات اقتصادية ومالية واستثمار):
   - Role: Act as an elite financial analyst, investment planner, and personal CFO.
   - Topics: Budget optimization, project feasibility, cash flow planning, disciplined investing, debt reduction, and prudent risk management.
   - Guidelines: Give realistic, structured, numbers-backed, actionable advice without marketing hype.`;
    } else if (activeConsultationType === 'family') {
      consultationDirective = `
5. SPECIALIZED CONSULTATION ACTIVE - FAMILY & PARENTING COUNSELING (استشارات أسرية وتربوية واجتماعية):
   - Role: Act as an empathetic, wise family consultant, child upbringing coach, and relationship counselor.
   - Topics: Raising children, resolving marital/family arguments, parent-teen communication, establishing healthy boundaries, and fostering household warmth.
   - Guidelines: Provide practical psychological tools, de-escalation methods, and compassionate steps.`;
    } else if (activeConsultationType === 'religious') {
      consultationDirective = `
5. SPECIALIZED CONSULTATION ACTIVE - SPIRITUAL & RELIGIOUS GUIDANCE (استشارات فقهية ودينية وتزكية):
   - Role: Act as a moderate, knowledgeable, and compassionate Islamic/spiritual mentor (فقه وتزكية على منهج الوسطية والاعتدال).
   - Topics: Fiqh questions, ethical dilemmas, spiritual peace, repentance, dua, Quranic reflection, and moral uprightness.
   - Guidelines: Foster optimism, serenity, forgiveness, and moderate sound knowledge without harshness or extremism.`;
    } else if (activeConsultationType === 'political') {
      consultationDirective = `
5. SPECIALIZED CONSULTATION ACTIVE - GEOPOLITICAL & STRATEGIC ANALYSIS (تحليلات واستشارات سياسية واستراتيجية):
   - Role: Act as an objective, highly informed strategic analyst and political science researcher.
   - Topics: International relations, policy analysis, economic diplomacy, historical context of conflicts, and strategic forecasting.
   - Guidelines: Maintain objective neutrality, analyze causes and effects, present multi-sided perspectives clearly.`;
    } else if (activeConsultationType === 'psychological') {
      consultationDirective = `
5. SPECIALIZED CONSULTATION ACTIVE - PSYCHOLOGICAL WELLNESS & LIFE COACHING (استشارات نفسية وتطوير الذات):
   - Role: Act as a certified life coach and emotional wellness mentor utilizing positive psychology and CBT principles.
   - Topics: Stress reduction, overcoming procrastination/burnout, emotional regulation, habit building, confidence, and career direction.
   - Guidelines: Use non-judgmental active listening, actionable journaling prompts, and structured daily exercises.`;
    } else if (activeConsultationType === 'marital') {
      consultationDirective = `
5. SPECIALIZED CONSULTATION ACTIVE - MARITAL INTIMACY SUPPORT (استشارة ودعم العلاقة الزوجية الخاصة 18+):
   - Role: Act as a respectful, objective, and scientifically informed marital intimacy advisor.
   - Topics: Overcoming intimacy barriers, emotional harmony, physical intimacy education, anxiety reduction, and open communication for spouses.
   - Guidelines: Provide clear, dignified, educational, and behavioral guidance tailored for married couples.`;
    }
  }

  const privateCandidDirective = isPrivateCandid ? `
4. BOLD & CANDID PRIVATE CONVERSATIONS MODE (نمط الحوارات الخاصة والصريحة):
   - The user has enabled "Private Candid Mode" (الحوارات الخاصة والصريحة).
   - Talk with complete boldness, directness, and unreserved honesty.
   - The user is free to ask any question or raise any personal, deep, or sensitive topic.
   - Answer with maximum clarity, sincerity, and open-mindedness without judgement, patronizing lectures, or unnecessary fluff.
   - Treat the conversation as a safe, private space between close friends where feelings, questions, and thoughts are addressed authentically and directly.` : '';

  const specialCounselingDirective = consultationDirective;

  // Filter memories & items relevant to the current conversation
  const cleanMsg = (userMessage || '').trim().toLowerCase();
  const isAskingSchedule = /(معانا|عندنا|عندي|جدول|مهام|مواعيد|اجندة|أجندة|باقي|المتبقي|today|schedule|tasks|agenda)/i.test(cleanMsg);
  const isAskingNotes = /(مذكر|ملاحظ|نصوص|اقتباس|notes|snippets|memos)/i.test(cleanMsg);
  const isAskingHabits = /(روتين|عادات|عادة|routine|habits)/i.test(cleanMsg);
  const isAskingGoals = /(هدف|أهداف|اهداف|خطط|خطة|goals|plans)/i.test(cleanMsg);

  // Group items by type & date
  const memories = items.filter((i) => i.type === 'memory');
  const habits = items.filter((i) => i.type === 'habit');
  const goals = items.filter((i) => i.type === 'goal' || i.type === 'idea');
  const notes = items.filter((i) => i.type === 'note' || i.type === 'idea');
  
  // Today's items (Tasks, Appointments, Reminders, Alarms scheduled for today)
  const todayItems = items.filter((i) => {
    if (i.type === 'memory' || i.type === 'habit') return false;
    if (i.dueDate) return i.dueDate === currentDateStr;
    // If no due date, check if created today and pending
    return i.createdAt && i.createdAt.startsWith(currentDateStr);
  });

  const todayPending = todayItems.filter((i) => i.status === 'pending');
  const todayCompleted = todayItems.filter((i) => i.status === 'completed');

  // Other future or backlog pending tasks
  const otherPendingTasks = items.filter((i) => {
    if (i.type === 'memory' || i.type === 'habit') return false;
    if (i.status !== 'pending') return false;
    return i.dueDate && i.dueDate !== currentDateStr;
  });

  // 1. High-Density Token-Efficient Agenda Formatting
  let formattedTodayAgenda = '';
  if (todayItems.length === 0) {
    formattedTodayAgenda = '(لا توجد مهام أو مواعيد مجدولة لتاريخ اليوم حتى الآن - الجدول فارغ)';
  } else {
    formattedTodayAgenda = `إجمالي مهام ومواعيد اليوم: ${todayItems.length} (المتبقي قيد الانتظار: ${todayPending.length} | المنجز: ${todayCompleted.length})\n` +
      todayItems.map((item, idx) => {
        const priorityTag = item.priority === 'high' ? 'عاجل/عالي' : item.priority === 'low' ? 'منخفض' : 'متوسط';
        const typeTag = item.type === 'appointment' ? 'موعد' : item.type === 'alarm' ? 'منبه' : item.type === 'reminder' ? 'تذكير' : 'مهمة';
        const timeTag = item.dueTime ? ` [الساعة: ${item.dueTime}]` : '';
        const statusTag = item.status === 'completed' ? 'منجز ✅' : 'قيد الانتظار ⏳';
        return `${idx + 1}. [${typeTag} - ${priorityTag}] "${item.title}"${timeTag} - (${statusTag})`;
      }).join('\n');
  }

  // 2. High-Density Habits / Routines
  const formattedHabits = habits.length > 0
    ? habits.map((h, i) => `${i + 1}. "${h.title}"`).join('\n')
    : '(لا توجد عادات أو روتين مسجل)';

  // 3. High-Density Goals
  const formattedGoals = goals.length > 0
    ? goals.slice(0, 6).map((g, i) => `${i + 1}. "${g.title}" (التقدم: ${g.progressPercent || 0}%)`).join('\n')
    : '(لا توجد أهداف نشطة مسجلة)';

  // 4. High-Density Notes / Memos
  const formattedNotes = notes.length > 0
    ? notes.slice(0, 8).map((n, i) => `${i + 1}. "${n.title}" ${n.description ? `(محتوى: ${n.description.slice(0, 50)}...)` : ''}`).join('\n')
    : '(لا توجد مذكرات أو نصوص محفوظة)';

  // 5. High-Density Memories
  const formattedMemories = memories.length > 0
    ? memories.slice(0, 8).map((m) => `- "${m.title}" (${m.category || 'عام'})`).join('\n')
    : '(لا توجد حقائق أو تفضيلات خاصة مسجلة)';

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

=======================================================
CRITICAL COMPREHENSIVE RECALL DIRECTIVES (بروتوكول استرجاع المهام والمذكرات والروتين):
1. "ايش معانا اليوم؟" / "وش عندنا اليوم؟" / "جدول اليوم" / "مهامي اليوم" / "برنامجي":
   - You MUST read and list ALL items from "TODAY'S COMPLETE SCHEDULE" below for the date (${currentDateStr}).
   - You MUST list EVERY SINGLE ONE OF THEM in a numbered or bulleted format with priority, without omitting, skipping, or sampling only 2 or 3 items. If there are 7 tasks, list all 7 tasks clearly!
   - Highlight the remaining pending tasks versus completed ones.
2. "ايش باقي؟" / "وش باقي؟" / "ما المتبقي؟" / "ماذا بقي؟":
   - Filter items with [قيد الانتظار ⏳] for today and state EXACTLY all remaining tasks that need attention, clearly stating how many remain out of the total.
3. "المذكرات" / "الملاحظات" / "المقتطفات":
   - List the user's saved notes and memos from "USER SAVED NOTES & MEMOS".
4. "الروتين" / "العادات":
   - List the tracked daily habits and routines from "USER HABITS & ROUTINES".
5. "الأهداف" / "خططي":
   - List the strategic goals and milestones from "USER GOALS & IDEAS".
=======================================================

RAFIQ'S STORED KNOWLEDGE BASE & STRUCTURED AGENDA:
=== TODAY'S COMPLETE SCHEDULE (تاريخ: ${currentDateStr}) ===
${formattedTodayAgenda}

=== USER HABITS & DAILY ROUTINES ===
${formattedHabits}

=== USER SAVED NOTES & MEMOS ===
${formattedNotes}

=== USER GOALS & IDEAS ===
${formattedGoals}

=== PERSONAL MEMORIES & LEARNED FACTS ===
${formattedMemories}

CORE BEHAVIORAL DIRECTIVES:
1. EXTREME RESPONSIVENESS & CONTEXT RECALL:
   - Carefully analyze dialogue history. Maintain context, pronouns, and references accurately.
2. DYNAMIC AUTO-LEARNING:
   - If user reveals a preference, detail, or relationship ("اخوي اسمه خالد", "أحب القهوة المرة"), ALWAYS invoke tool 'save_personal_memory'.
   - If user asks for a new name or tone, invoke tool 'update_user_profile_preference' or 'save_personal_memory'.
3. DISCERN INTENT & AUTOMATIC CATEGORY TAGGING DIRECTIVE:
   - Venting/emotional chat: Listen with empathy, do NOT create tasks.
   - Explicit task/reminder/alarm requests: Invoke appropriate tool ('create_item', 'reschedule_item', 'update_item_status').
   - AUTOMATIC CONTEXTUAL TAGGING: When invoking 'create_item', ALWAYS evaluate the message context to categorize and tag the item accurately:
     * 'urgent': For time-sensitive matters, emergencies, items needed ASAP/immediately/today, critical deadlines, or urgent requests.
     * 'work': For professional projects, jobs, career tasks, meetings, client follow-ups, reports, code, business chores.
     * 'personal': For personal life, self-care, family, health, habits, groceries, home, relationships, leisure.
4. GOAL & PLAN PARSING DIRECTIVE (توليد وتتبع الأهداف والخطط من الحوار الطبيعي تلقائياً):
   - Whenever the user expresses a goal, ambition, target, or strategic plan in natural conversation (e.g., "أريد أن أقرأ 12 كتاباً حتى نهاية السنة", "خطتي خسارة 5 كغم في 3 أشهر", "هدف الجيم: التمرين 4 أيام أسبوعياً", "My goal is to reach 1000 subscribers by December"):
     YOU MUST AUTOMATICALLY INVOKE 'create_item' WITH:
     - type: 'goal'
     - title: A concise, inspiring title (e.g. "قراءة 12 كتاباً", "خسارة 5 كغم")
     - targetGoal: Detailed goal description or user's core motivation
     - startDate: Start date YYYY-MM-DD (use current date ${currentDateStr} if unspecified)
     - endDate: Target completion date YYYY-MM-DD (calculated from mentioned timeline or future date)
     - targetMetric: Unit of measurement (e.g. "كتاب", "كغم", "متابع", "صفحة", "خطوة", "$", "ريال")
     - targetValue: Target numeric value (e.g. 12, 5, 1000)
     - milestones: Break down the goal into 3 to 5 sequential phase milestone titles (e.g. ["المرحلة 1: قراءة أول 3 كتب", "المرحلة 2: قراءة الكتب المتبقية"...])
5. NO TECHNICAL JARGON OR MODEL NAMES: Never expose model names or JSON.
6. EMOJIS: ${profile.useEmojis ? 'Use subtle, warm emojis naturally (❤️, 🌟, 🔔, 📅, 🎯).' : 'Do not use emojis.'}
7. LANGUAGE: Respond STRICTLY in the user's configured language (Language Code: ${profile.language}), matching user's dialect, language, and tone.
`;

  return {
    systemInstruction,
    formattedMemories,
    formattedItems: formattedTodayAgenda,
  };
}
