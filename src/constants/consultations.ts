import { ConsultationType, ConsultationConfig } from '../types';

export const CONSULTATION_MODES: Record<ConsultationType, ConsultationConfig | null> = {
  none: null,
  financial: {
    id: 'financial',
    featureId: 'consultation_financial',
    nameAr: 'استشارات اقتصادية ومالية واستثمار',
    nameEn: 'Financial & Economic Advisory',
    categoryNameAr: 'المال والأعمال',
    categoryNameEn: 'Finance & Business',
    descAr: 'تحليل الميزانيات، التخطيط المالي، دراسة جدوى المشاريع، وإدارة المصاريف والاستثمارات.',
    descEn: 'Budget analysis, personal finance, business feasibility, and investment planning.',
    iconName: 'TrendingUp',
    colorClass: 'emerald',
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    badgeText: 'استشارة اقتصادية ومالية',
    glowColor: 'emerald',
    ageRestricted: false,
    systemPromptDirectiveAr: `
- CONSULTATION MODE ACTIVE: "استشارات اقتصادية ومالية واستثمارية" (Financial & Economic Advisory).
- Directive: Act as an elite financial advisor, economic analyst, and business strategist.
- Provide structured financial guidance: budget optimization, cash flow planning, smart investing principles, cost reduction, and pragmatic risk analysis.
- Use clear numbers, actionable milestones, and analytical thinking.`,
    systemPromptDirectiveEn: `
- CONSULTATION MODE ACTIVE: "Financial & Economic Advisory".
- Directive: Act as an elite financial advisor and economic analyst. Provide clear budget strategies, risk assessments, and actionable financial planning.`,
  },
  family: {
    id: 'family',
    featureId: 'consultation_family',
    nameAr: 'استشارات أسرية وتربوية واجتماعية',
    nameEn: 'Family & Parenting Counseling',
    categoryNameAr: 'الأسرة والمجتمع',
    categoryNameEn: 'Family & Social',
    descAr: 'حلول تربوية للأبناء، تعزيز التفاهم الأسري، إدارة الخلافات العائلية، وتوطيد العلاقات.',
    descEn: 'Parenting strategies, resolving family conflicts, youth guidance, and relationship bonding.',
    iconName: 'Users',
    colorClass: 'amber',
    badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
    badgeText: 'استشارة أسرية وتربوية',
    glowColor: 'amber',
    ageRestricted: false,
    systemPromptDirectiveAr: `
- CONSULTATION MODE ACTIVE: "استشارات أسرية وتربوية واجتماعية" (Family & Parenting Counseling).
- Directive: Act as a wise, empathetic, and professional family counselor and child development mentor.
- Help solve family communication friction, parenting challenges, generational gaps, and conflict de-escalation with warmth and practical psychology.`,
    systemPromptDirectiveEn: `
- CONSULTATION MODE ACTIVE: "Family & Parenting Counseling".
- Directive: Provide compassionate, practical guidance on parenting, family communication, and conflict resolution.`,
  },
  religious: {
    id: 'religious',
    featureId: 'consultation_religious',
    nameAr: 'استشارات فقهية ودينية وروحية',
    nameEn: 'Religious & Spiritual Guidance',
    categoryNameAr: 'الدين والتزكية',
    categoryNameEn: 'Spiritual & Religious',
    descAr: 'إرشادات فقهية معتدلة، تزكية النفس، وردود دينية موثقة تعزز الطمأنينة والأخلاق.',
    descEn: 'Moderate Islamic guidance, spiritual well-being, ethics, and thoughtful religious context.',
    iconName: 'BookOpen',
    colorClass: 'cyan',
    badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
    badgeText: 'استشارة فقهية وروحية',
    glowColor: 'cyan',
    ageRestricted: false,
    systemPromptDirectiveAr: `
- CONSULTATION MODE ACTIVE: "استشارات فقهية ودينية وتزكية نفسية" (Religious & Spiritual Guidance).
- Directive: Act as a knowledgeable, moderate, balanced Islamic and spiritual mentor.
- Provide comforting, ethical, and evidence-informed guidance adhering to moderate Islamic jurisprudence (الوسطية والاعتدال), fostering spiritual peace, morals, and uplifting hope.`,
    systemPromptDirectiveEn: `
- CONSULTATION MODE ACTIVE: "Religious & Spiritual Guidance".
- Directive: Act as a moderate, knowledgeable spiritual counselor providing balanced, ethical, and uplifting religious context.`,
  },
  political: {
    id: 'political',
    featureId: 'consultation_political',
    nameAr: 'تحليلات واستشارات سياسية واستراتيجية',
    nameEn: 'Political & Strategic Analysis',
    categoryNameAr: 'السياسة والاستراتيجية',
    categoryNameEn: 'Politics & Strategy',
    descAr: 'قراءة الأحداث السياسية، فهم العلاقات الدولية، والتحليل الاستراتيجي المحايد والموضوعي.',
    descEn: 'Objective geopolitical analysis, policy understanding, and strategic international relations.',
    iconName: 'Compass',
    colorClass: 'purple',
    badgeBg: 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400',
    badgeText: 'تحليل واستشارة سياسية',
    glowColor: 'purple',
    ageRestricted: false,
    systemPromptDirectiveAr: `
- CONSULTATION MODE ACTIVE: "تحليلات واستشارات سياسية واستراتيجية" (Political & Strategic Analysis).
- Directive: Act as an objective, highly informed geopolitical analyst and policy consultant.
- Provide balanced, multi-perspective strategic assessments of international developments, governance, and history with neutral scholarly rigor.`,
    systemPromptDirectiveEn: `
- CONSULTATION MODE ACTIVE: "Political & Strategic Analysis".
- Directive: Act as an objective geopolitical analyst providing balanced, structured political and strategic insights.`,
  },
  psychological: {
    id: 'psychological',
    featureId: 'consultation_psychological',
    nameAr: 'استشارات نفسية وتطوير الذات وتوجيه مهني',
    nameEn: 'Psychological & Life Coaching',
    categoryNameAr: 'تطوير الذات والنفس',
    categoryNameEn: 'Psychology & Wellness',
    descAr: 'التغلب على التوتر والقلق، بناء العادات الإيجابية، تنظيم الوقت، وتطوير المسار المهني.',
    descEn: 'Stress management, emotional resilience, career coaching, and habit formation.',
    iconName: 'Sparkles',
    colorClass: 'indigo',
    badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
    badgeText: 'استشارة نفسية وتطوير ذات',
    glowColor: 'indigo',
    ageRestricted: false,
    systemPromptDirectiveAr: `
- CONSULTATION MODE ACTIVE: "استشارات نفسية وتطوير الذات والمهنة" (Psychological & Life Coaching).
- Directive: Act as a certified, supportive life coach and wellness mentor (utilizing positive psychology and CBT principles).
- Help the user navigate burnout, procrastination, stress, motivation blocks, and career planning with actionable, gentle, and practical steps.`,
    systemPromptDirectiveEn: `
- CONSULTATION MODE ACTIVE: "Psychological & Life Coaching".
- Directive: Act as an encouraging life coach providing evidence-based techniques for mental resilience, stress management, and self-improvement.`,
  },
  marital: {
    id: 'marital',
    featureId: 'consultation_marital',
    nameAr: 'استشارات ودعم العلاقة الزوجية الخاصة (18+)',
    nameEn: 'Marital & Intimacy Support (18+)',
    categoryNameAr: 'العلاقات الزوجية (18+)',
    categoryNameEn: 'Marital Intimacy (18+)',
    descAr: 'مخصصة للتغلب على صعوبات العلاقة الزوجية الحميمة والتواصل الخاص عبر تعهد السن القانوني (18+).',
    descEn: 'Specialized counseling to overcome marital intimacy challenges with age verification (18+).',
    iconName: 'HeartHandshake',
    colorClass: 'rose',
    badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
    badgeText: 'استشارة زوجية خاصة (18+)',
    glowColor: 'rose',
    ageRestricted: true,
    systemPromptDirectiveAr: `
- CONSULTATION MODE ACTIVE: "جلسة الدعم والاستشارة الزوجية الحميمة (18+)" (Marital Intimacy Support).
- Directive: Act as a deeply respectful, knowledgeable, and objective marital intimacy and relationship counselor.
- Analyze marital intimacy concerns with frankness, scientific accuracy, and psychological safety.
- Provide clear, direct, practical, behavioral solutions and open communication techniques for married couples.`,
    systemPromptDirectiveEn: `
- CONSULTATION MODE ACTIVE: "Marital Intimacy Support (18+)".
- Directive: Act as an empathetic, scientific marital counselor providing clear and respectful guidance for married couples.`,
  },
};

export const ALL_CONSULTATION_TYPES: ConsultationType[] = [
  'financial',
  'family',
  'religious',
  'political',
  'psychological',
  'marital',
];
