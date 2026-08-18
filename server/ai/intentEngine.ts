import { IntentAnalysis, IntentComplexity, IntentCategory } from './types';

export function analyzeIntentAndComplexity(
  userMessage: string,
  history: { sender: 'user' | 'ai'; text: string }[]
): IntentAnalysis {
  const msg = userMessage.trim().toLowerCase();

  // High complexity triggers (deep consultations, financial analysis, marital coaching, strategic decisions, in-depth psychological/career advice)
  const highComplexityKeywords = [
    'أفكر أترك', 'أترك عملي', 'أترك وظيفتي', 'أبدأ مشروع', 'مشروع جديد', 'استشارة',
    'وش تنصحني', 'نصيحة عميقة', 'قرار صعب', 'مستقبلي', 'خطط جديدة', 'حل مشكلة معقدة',
    'استشارة زوجية', 'استشارة مالية', 'استشارة أسرية', 'استشارة دينية', 'استشارة سياسية',
    'تحليل استراتيجي', 'استثمار', 'دراسة جدوى', 'علاقة زوجية', 'مشكلة أسرية', 'تربية الأبناء',
    'فقه', 'فتوى', 'حكم شرعي', 'نفسيتي', 'اكتئاب', 'قلق شديد', 'تطوير الذات',
    'should i quit', 'start a business', 'career choice', 'difficult decision', 'deep advice',
    'financial consultation', 'marriage advice', 'strategic analysis', 'psychological counseling'
  ];

  const isHighComplexity = highComplexityKeywords.some((kw) => msg.includes(kw)) || msg.length > 250;

  // Category detection
  let category: IntentCategory = 'conversation';
  let isActionRequired = false;

  // Time and Date Query Detection
  const timeKeywords = [
    'كم الساعة', 'الساعة كم', 'كم الوقت', 'الوقت الان', 'ساعة كم', 'الوقت الآن',
    'ما التاريخ', 'تاريخ اليوم', 'اي يوم', 'ما هو اليوم', 'أي يوم', 'كم التاريخ',
    'what time', 'current time', 'what is the date', "what's the time", 'today date', 'what day is it'
  ];

  // Greetings & Simple Queries
  const greetingKeywords = [
    'مرحبا', 'أهلا', 'اهلا', 'هلا', 'سلام', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'هاي',
    'hello', 'hi', 'hey', 'good morning', 'good evening', 'thanks', 'شكرا', 'يسلمو', 'يعطيك العافية'
  ];

  // Schedule & Agenda Queries
  const todayScheduleKeywords = [
    'ايش معانا اليوم', 'وش معانا اليوم', 'ايش عندنا اليوم', 'وش عندنا اليوم', 'ايش عندي اليوم', 'وش عندي اليوم',
    'ماذا لدينا اليوم', 'جدول اليوم', 'مهام اليوم', 'ايش مهامي اليوم', 'وش مهامي اليوم', 'برنامجي اليوم',
    'خطة اليوم', 'خطتي اليوم', 'مواعيدي اليوم', 'اجندة اليوم', 'أجندة اليوم', 'كل المهام', 'ايش عندي', 'وش عندي',
    'what do we have today', "what's on my schedule today", 'today schedule', 'today tasks', 'my agenda today'
  ];

  const remainingKeywords = [
    'ايش باقي', 'وش باقي', 'ما المتبقي', 'ايش تبقى', 'وش تبقى', 'ماذا بقي', 'ايش باقي لي', 'وش باقي لي',
    'ايش باقي من المهام', 'وش باقي من المهام', 'المهام المتبقية', 'كم باقي', 'ما خلصت', 'what is remaining',
    'what is left', "what's remaining", "what's left"
  ];

  const notesKeywords = [
    'المذكرات', 'مذكراتي', 'الملاحظات', 'ملاحظاتي', 'المقتطفات', 'النصوص المحفوظة', 'ايش حفظت', 'وش حفظت',
    'notes', 'my notes', 'saved notes', 'snippets', 'memos'
  ];

  const routineKeywords = [
    'الروتين', 'روتيني', 'الروتين اليومي', 'العادات', 'عاداتي', 'عادات اليوم', 'my routine', 'daily routine', 'my habits'
  ];

  const goalsKeywords = [
    'أهدافي', 'اهدافي', 'الاهداف', 'الأهداف', 'خططي', 'المراحل', 'أهداف السنة', 'my goals', 'active goals'
  ];

  if (msg.includes('صحيني') || msg.includes('منبه') || msg.includes('alarm')) {
    category = 'alarm';
    isActionRequired = true;
  } else if (remainingKeywords.some((kw) => msg.includes(kw))) {
    category = 'schedule_remaining_query';
  } else if (todayScheduleKeywords.some((kw) => msg.includes(kw))) {
    category = 'schedule_today_query';
  } else if (notesKeywords.some((kw) => msg.includes(kw))) {
    category = 'notes_query';
  } else if (routineKeywords.some((kw) => msg.includes(kw))) {
    category = 'routine_query';
  } else if (goalsKeywords.some((kw) => msg.includes(kw))) {
    category = 'goals_query';
  } else if (msg.includes('ذكرني') || msg.includes('تذكير') || msg.includes('remind me') || msg.includes('reminder')) {
    category = 'reminder';
    isActionRequired = true;
  } else if (timeKeywords.some((kw) => msg.includes(kw))) {
    category = 'time_query';
  } else if (msg.includes('مهمة') || msg.includes('task') || msg.includes('سوي لي')) {
    category = 'task';
    isActionRequired = true;
  } else if (msg.includes('موعد') || msg.includes('مقابلة') || msg.includes('appointment') || msg.includes('meeting')) {
    category = 'appointment';
    isActionRequired = true;
  } else if (msg.includes('عادة') || msg.includes('كل يوم') || msg.includes('habit')) {
    category = 'habit';
    isActionRequired = true;
  } else if (msg.includes('هدف') || msg.includes('خطة') || msg.includes('goal') || msg.includes('plan')) {
    category = 'goal';
    isActionRequired = true;
  } else if (msg.includes('تعبان') || msg.includes('مضغوط') || msg.includes('متوتر') || msg.includes('احس بضيق') || msg.includes('feeling down')) {
    category = 'venting';
  } else if (isHighComplexity) {
    category = 'advice';
  }

  let complexity: IntentComplexity = 'medium';
  let preferredModel = 'gemini-2.5-flash';

  if (isHighComplexity) {
    complexity = 'high';
    preferredModel = 'gemini-3.7-flash'; // High depth of analysis and reasoning for complex inquiries
  } else if (
    category === 'alarm' ||
    category === 'time_query' ||
    category === 'schedule_today_query' ||
    category === 'schedule_remaining_query' ||
    category === 'notes_query' ||
    category === 'routine_query' ||
    category === 'goals_query' ||
    greetingKeywords.some((g) => msg === g || msg.startsWith(g)) ||
    msg.length < 30
  ) {
    complexity = 'low';
    preferredModel = 'gemini-2.5-flash'; // Ultra-low latency, token-efficient, instant streaming
  } else {
    complexity = 'medium';
    preferredModel = 'gemini-2.5-flash';
  }

  return {
    complexity,
    category,
    confidence: isActionRequired ? 0.95 : 0.85,
    isActionRequired,
    suggestedMultiModel: complexity === 'high',
    preferredModel,
  };
}
