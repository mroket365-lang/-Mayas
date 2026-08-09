import { IntentAnalysis, IntentComplexity, IntentCategory } from './types';

export function analyzeIntentAndComplexity(
  userMessage: string,
  history: { sender: 'user' | 'ai'; text: string }[]
): IntentAnalysis {
  const msg = userMessage.trim().toLowerCase();

  // High complexity triggers (deep advice, decision making, multi-perspective topics)
  const highComplexityKeywords = [
    'أفكر أترك', 'أترك عملي', 'أترك وظيفتي', 'أبدأ مشروع', 'مشروع جديد', 'استشارة',
    'وش تنصحني', 'نصيحة عميقة', 'قرار صعب', 'مستقبلي', 'خطط جديدة', 'حل مشكلة معقدة',
    'should i quit', 'start a business', 'career choice', 'difficult decision', 'deep advice'
  ];

  const isHighComplexity = highComplexityKeywords.some((kw) => msg.includes(kw));

  // Category detection
  let category: IntentCategory = 'conversation';
  let isActionRequired = false;

  if (msg.includes('صحيني') || msg.includes('منبه') || msg.includes('alarm')) {
    category = 'alarm';
    isActionRequired = true;
  } else if (msg.includes('ذكرني') || msg.includes('تذكير') || msg.includes('remind me') || msg.includes('reminder')) {
    category = 'reminder';
    isActionRequired = true;
  } else if (msg.includes('مهمة') || msg.includes('task') || msg.includes('جدول') || msg.includes('سوي لي')) {
    category = 'task';
    isActionRequired = true;
  } else if (msg.includes('موعد') || msg.includes('مقابلة') || msg.includes('appointment') || msg.includes('meeting')) {
    category = 'appointment';
    isActionRequired = true;
  } else if (msg.includes('وش عندي') || msg.includes('جدول اليوم') || msg.includes('ماذا لدي') || msg.includes("what's on my schedule")) {
    category = 'schedule_query';
  } else if (msg.includes('عادة') || msg.includes('كل يوم') || msg.includes('habit')) {
    category = 'habit';
    isActionRequired = true;
  } else if (msg.includes('تعبان') || msg.includes('مضغوط') || msg.includes('متوتر') || msg.includes('احس بضيق') || msg.includes('feeling down')) {
    category = 'venting';
  } else if (isHighComplexity) {
    category = 'advice';
  }

  let complexity: IntentComplexity = 'medium';
  if (isHighComplexity) {
    complexity = 'high';
  } else if (category === 'alarm' || category === 'schedule_query' || msg.length < 20) {
    complexity = 'low';
  }

  return {
    complexity,
    category,
    confidence: isActionRequired ? 0.95 : 0.85,
    isActionRequired,
    suggestedMultiModel: complexity === 'high',
  };
}
