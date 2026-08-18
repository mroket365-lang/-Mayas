import fs from 'fs';
import path from 'path';

export interface UserEntity {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  passwordHash?: string;
  name: string;
  role: 'super_admin' | 'admin' | 'assistant' | 'user';
  status: 'active' | 'suspended' | 'banned';
  permissions?: string[];
  createdAt: string;
  lastActiveAt: string;
  timezone?: string;
  locale?: string;
  currency?: string;
  profileData?: any;
  messagesData?: any;
  itemsData?: any;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  locationStatus?: 'granted' | 'denied' | 'prompt' | 'unknown';
  locationUpdatedAt?: string;
}

export interface PlanFeatureItem {
  text: string;
  enabled: boolean;
  highlighted?: boolean;
  icon?: string;
}

export interface PlanEntity {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  active: boolean;
  features: string[];
  featuresList?: PlanFeatureItem[];
  icon?: string;
  badgeText?: string;
  highlightColor?: string;
  targetRegions?: string[]; // e.g. ['ALL'] or ['SA', 'AE', 'EG', 'US']
  unlockedFeatureIds?: string[];
  limits: {
    ai_messages_per_month: number;
    voice_minutes_per_month: number;
    multi_ai_requests_per_month: number;
    advanced_ai_requests_per_month: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceiptEntity {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId: string;
  paymentMethodTitle: string;
  transactionReference: string;
  receiptImage?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionEntity {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' | 'paused';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentProvider: 'web' | 'manual' | 'stripe' | 'google_play' | 'apple' | 'promo';
  externalSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistoryEntity {
  id: string;
  userId: string;
  subscriptionId: string;
  planId: string;
  action: string;
  status: string;
  timestamp: string;
  details?: string;
  performedBy?: string;
}

export interface UsageRecordEntity {
  id: string;
  userId: string;
  period: string; // YYYY-MM
  feature: string; // e.g. 'ai_messages', 'voice_minutes', 'multi_ai', 'advanced_ai'
  count: number;
  units: string;
  lastUsedAt: string;
}

export interface AdminAuditLogEntity {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
}

export interface AIUsageLogEntity {
  id: string;
  userId: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  estimatedCost: number; // in USD
  success: boolean;
  feature: string;
  timestamp: string;
}

export interface FeatureFlagConfig {
  mode: 'hidden' | 'everyone' | 'specific_user' | 'allowed_users_list' | 'region';
  allowedUserId?: string;
  allowedUsersList?: string;
  allowedRegion?: string;
}

export type FeatureCategory = 'tabs' | 'actions' | 'chat_tools' | 'saved_tools' | 'preferences' | 'ai_modules';
export type FeatureAudience = 'everyone' | 'authenticated_only' | 'specific_users' | 'disabled';
export type FeatureLockedBehavior = 'hide' | 'badge_lock' | 'maintenance' | 'coming_soon' | 'custom_popup';
export type FeatureDeviceTarget = 'all' | 'mobile_only' | 'desktop_only';
export type FeatureLanguageTarget = 'all' | 'ar_only' | 'en_only';
export type FeatureCustomBadge = 'none' | 'new' | 'beta' | 'maintenance' | 'coming_soon' | 'vip' | 'custom';

export interface ProgressiveDisclosureConfig {
  enabled: boolean;
  minAccountAgeDays: number;
  minMessagesSent: number;
  minCompletedTasks: number;
}

export interface FeatureTimeWindowConfig {
  enabled: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface FeatureRuleConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: FeatureCategory;
  icon: string;
  targetAudience: FeatureAudience;
  specificUsers: string[];
  allowedPlans: string[]; // ['all'], ['none'], ['free', 'premium', 'pro'], etc.
  deviceTarget?: FeatureDeviceTarget;
  languageTarget?: FeatureLanguageTarget;
  customBadge?: FeatureCustomBadge;
  customBadgeText?: string;
  progressiveDisclosure: ProgressiveDisclosureConfig;
  timeWindow: FeatureTimeWindowConfig;
  lockedBehavior: FeatureLockedBehavior;
  customLockTitle?: string;
  customLockMessage?: string;
  maintenanceMessage?: string;
  updatedAt?: string;
}

export interface EvaluatedFeatureStatus {
  id: string;
  enabled: boolean;
  locked: boolean;
  lockedBehavior: FeatureLockedBehavior;
  reason?:
    | 'disabled'
    | 'specific_users_only'
    | 'requires_auth'
    | 'plan_restricted'
    | 'progressive_time_locked'
    | 'progressive_messages_locked'
    | 'progressive_tasks_locked'
    | 'outside_time_window'
    | 'device_mismatch'
    | 'language_mismatch'
    | 'maintenance'
    | 'coming_soon'
    | 'ok';
  lockTitle?: string;
  lockMessage?: string;
  customBadge?: FeatureCustomBadge;
  customBadgeText?: string;
  name: string;
  icon: string;
}

export interface PaymentMethodEntity {
  id: string;
  type: 'bank' | 'wallet' | 'card';
  title: string;
  accountNumberOrDetails: string;
  accountHolder?: string;
  instructions?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthMethodsConfig {
  googleAuthEnabled: boolean;
  emailPasswordEnabled: boolean;
}

export interface SystemSettingsEntity {
  maintenanceMode: boolean;
  newRegistrationsEnabled: boolean;
  defaultPlan: string;
  defaultAIProvider: string;
  fallbackAIProvider: string;
  multiAIEnabled: boolean;
  voiceEnabled: boolean;
  authMethods?: AuthMethodsConfig;
  providers: {
    gemini: { enabled: boolean; model: string };
    openai: { enabled: boolean; model: string };
  };
  privateCandidVisibility?: FeatureFlagConfig;
  maritalSupportVisibility?: FeatureFlagConfig;
  subscriptionUpgradeVisibility?: FeatureFlagConfig;
  superAdminEmail?: string;
  superAdminPassword?: string;
  paymentMethods?: PaymentMethodEntity[];
  features?: FeatureRuleConfig[];
  updatedAt?: string;
}

export interface DatabaseSchema {
  users: UserEntity[];
  plans: PlanEntity[];
  subscriptions: SubscriptionEntity[];
  subscriptionHistory: SubscriptionHistoryEntity[];
  paymentReceipts?: PaymentReceiptEntity[];
  usageRecords: UsageRecordEntity[];
  adminAuditLogs: AdminAuditLogEntity[];
  aiUsageLogs: AIUsageLogEntity[];
  settings: SystemSettingsEntity;
}

const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'server_data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Priority Environment Variable Overrides for Super Admin
const getEnvAdminEmail = (): string => {
  return process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || 'admin@rafiq.ai';
};

const getEnvAdminPassword = (): string => {
  return process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || 'AdminSecret2026!';
};

export const defaultFeaturesList: FeatureRuleConfig[] = [
  {
    id: 'tab_companion',
    nameAr: 'واجهة المحادثة والرفيق',
    nameEn: 'Companion Chat Interface',
    descriptionAr: 'الشاشة الرئيسية للدردشة والتفاعل الذكي مع الرفيق',
    descriptionEn: 'Main companion chat screen and conversational AI',
    category: 'tabs',
    icon: 'MessageCircle',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tab_today',
    nameAr: 'واجهة يومي والمراجعة',
    nameEn: 'Today Agenda & Review Tab',
    descriptionAr: 'جدول اليوم والمهام الحالية والمراجعة اليومية',
    descriptionEn: 'Daily agenda, today tasks, and daily AI review',
    category: 'tabs',
    icon: 'Calendar',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tab_saved',
    nameAr: 'واجهة المحفوظات والمهام',
    nameEn: 'Saved Items & Tasks Tab',
    descriptionAr: 'سجل كافة المهام، المواعيد، الأهداف، والروابط المحفوظة',
    descriptionEn: 'All saved tasks, appointments, goals, and notes repository',
    category: 'tabs',
    icon: 'BookmarkCheck',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tab_profile',
    nameAr: 'واجهة البروفايل والتفضيلات',
    nameEn: 'Profile & Settings Tab',
    descriptionAr: 'إعدادات الحساب، الشخصية، اللغة، وإدارة الاشتراك',
    descriptionEn: 'Account settings, companion personality, language, and plan tier',
    category: 'tabs',
    icon: 'User',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tool_stats',
    nameAr: 'زر ومودال الإحصائيات والاستهلاك',
    nameEn: 'Stats & Analytics Modal',
    descriptionAr: 'إحصائيات إنجاز المهام، استهلاك الذكاء الاصطناعي، ونسب الالتزام',
    descriptionEn: 'Task completion rates, AI token usage, and habit consistency stats',
    category: 'actions',
    icon: 'BarChart3',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
    customLockMessage: 'متاح لجميع المشتركين لاستعراض تقدمهم اليومي والإحصائي',
  },
  {
    id: 'tool_voice_input',
    nameAr: 'زر الإدخال والتسجيل الصوتي',
    nameEn: 'Voice Input / Mic',
    descriptionAr: 'زر الميكروفون للحديث الصوتي المباشر مع الرفيق',
    descriptionEn: 'Direct speech-to-text microphone button in chat',
    category: 'chat_tools',
    icon: 'Mic',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tool_voice_reply',
    nameAr: 'الردود الصوتية للرفيق (TTS)',
    nameEn: 'AI Voice Speech Reply',
    descriptionAr: 'نطق رسائل الرفيق صوتياً بنبرة طبيعية وواقعية',
    descriptionEn: 'Natural text-to-speech audio synthesis responses',
    category: 'chat_tools',
    icon: 'Volume2',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tool_attachments',
    nameAr: 'إرفاق الوسائط والصور والملفات',
    nameEn: 'Media Attachments',
    descriptionAr: 'إمكانية إرسال وتحليل الصور والمستندات داخل الدردشة',
    descriptionEn: 'Image, video and document attachment and vision AI analysis',
    category: 'chat_tools',
    icon: 'Paperclip',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
    customLockMessage: 'ميزة إرفاق الصور والوسائط تتطلب حساباً مفعلاً',
  },
  {
    id: 'tool_private_candid',
    nameAr: 'وضع المصارحة والخواطر السرية الجريئة',
    nameEn: 'Private Candid Thoughts Mode',
    descriptionAr: 'نقاشات صريحة وغير مقيدة وحوارات عميقة مشفرة',
    descriptionEn: 'Unfiltered, confidential, and deep candid conversations',
    category: 'chat_tools',
    icon: 'Flame',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
  },
  {
    id: 'tool_marital_counseling',
    nameAr: 'مساعد الاستشارات الزوجية والعلاقات',
    nameEn: 'Marital & Relationship Coach',
    descriptionAr: 'جلسات استشارية متخصصة لحل النزاعات وفهم العلاقات',
    descriptionEn: 'Specialized relationship & marriage coaching advisor',
    category: 'chat_tools',
    icon: 'HeartHandshake',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
  },
  {
    id: 'feature_goals_tracking',
    nameAr: 'تتبع الأهداف والمراحل بالذكاء الاصطناعي',
    nameEn: 'AI Goals & Milestone Tracking',
    descriptionAr: 'تفكيك الأهداف الكبرى إلى مراحل زمنية ومتابعة نسب الإنجاز',
    descriptionEn: 'Strategic goal breakdown, progress bars, and AI milestones analysis',
    category: 'saved_tools',
    icon: 'Target',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
  },
  {
    id: 'feature_snippet_extractor',
    nameAr: 'استخراج الاقتباسات والملاحظات الطويلة',
    nameEn: 'Long Notes & Snippet Extractor',
    descriptionAr: 'حفظ النصوص الطويلة، الأشعار، والمقتطفات مع استخراج الكبسولات الذكية',
    descriptionEn: 'Long-form note drafting and AI smart snippet extraction',
    category: 'saved_tools',
    icon: 'FileText',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
  },
  {
    id: 'feature_smart_alarm',
    nameAr: 'المنبه والتذكيرات الصوتية التفاعلية',
    nameEn: 'Smart Interactive Alarms',
    descriptionAr: 'تنبيهات صوتية فورية مع أصوات رنين وتنبيه تفاعلي',
    descriptionEn: 'Full screen ringing alarms and persistent reminder notifications',
    category: 'saved_tools',
    icon: 'Bell',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tool_daily_checkin',
    nameAr: 'رسالة التفقد والاطمئنان اليومي',
    nameEn: 'Daily Wellness Check-in',
    descriptionAr: 'سؤال يومي ذكي لمتابعة المزاج والطاقة ومستوى الإنتاجية',
    descriptionEn: 'Daily proactive prompt to track mood, energy, and habits',
    category: 'chat_tools',
    icon: 'Smile',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'tool_daily_review',
    nameAr: 'توليد ملخص ومراجعة اليوم بالذكاء الاصطناعي',
    nameEn: 'AI Daily Summary Review',
    descriptionAr: 'تقرير مسائي شامل يحلل إنجازات اليوم ونقاط التحسين',
    descriptionEn: 'End-of-day AI comprehensive debrief and performance score',
    category: 'actions',
    icon: 'Sparkles',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'badge_lock',
  },
  {
    id: 'feature_theme_customization',
    nameAr: 'تخصيص الثيمات والوضع الليلي',
    nameEn: 'Theme & Appearance Customizer',
    descriptionAr: 'التبديل بين المظهر الفاتح والداكن والخطوط',
    descriptionEn: 'Dark/Light mode switches and UI styling preferences',
    category: 'preferences',
    icon: 'Palette',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
  {
    id: 'button_admin_panel',
    nameAr: 'زر الدخول للوحة التحكم الإدارية (Admin)',
    nameEn: 'Admin Panel Access Button',
    descriptionAr: 'التحكم في ظهور أو إخفاء زر الانتقال للوحة التحكم الإدارية في الإعدادات وقائمة الأدوات',
    descriptionEn: 'Control visibility of the Admin Panel portal trigger in Settings and tools menu',
    category: 'actions',
    icon: 'ShieldAlert',
    targetAudience: 'everyone',
    specificUsers: [],
    allowedPlans: ['all'],
    progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
    timeWindow: { enabled: false },
    lockedBehavior: 'hide',
  },
];

const defaultDatabase: DatabaseSchema = {
  users: [
    {
      id: 'admin_super_01',
      email: getEnvAdminEmail(),
      name: 'Super Admin',
      role: 'super_admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      currency: 'USD',
    },
  ],
  plans: [
    {
      id: 'free',
      name: 'الخطة المجانية (Free)',
      description: 'تجربة القيادة والاستخدام الأساسي للرفيق الذكي',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'USD',
      active: true,
      icon: 'Sparkles',
      badgeText: 'مجاناً للجميع',
      highlightColor: 'gray',
      targetRegions: ['ALL'],
      features: ['ai_basic', 'voice'],
      featuresList: [
        { text: '50 رسالة ذكاء اصطناعي شهرياً', enabled: true, icon: 'MessageCircle' },
        { text: '20 دقيقة محادثة صوتية شهرياً', enabled: true, icon: 'Mic' },
        { text: 'ملاحظات وتذكيرات غير محدودة', enabled: true, icon: 'CheckCircle2' },
        { text: 'النماذج المتقدمة الذكية (Pro Models)', enabled: false, icon: 'Lock' },
        { text: 'استجابة فائقة السرعة مع الأولوية', enabled: false, icon: 'Zap' },
      ],
      limits: {
        ai_messages_per_month: 50,
        voice_minutes_per_month: 20,
        multi_ai_requests_per_month: 0,
        advanced_ai_requests_per_month: 5,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'premium',
      name: 'الخطة المتقدمة (Premium)',
      description: 'محادثات متقدمة مع الرفيق الذكي وبدون حدود يومية',
      monthlyPrice: 9.99,
      yearlyPrice: 89.99,
      currency: 'USD',
      active: true,
      icon: 'Zap',
      badgeText: 'الأكثر شعبية ✨',
      highlightColor: 'indigo',
      targetRegions: ['ALL'],
      features: ['ai_basic', 'ai_advanced', 'voice', 'multi_ai', 'advanced_memory', 'advanced_reports', 'priority_ai'],
      featuresList: [
        { text: '2000 رسالة ذكاء اصطناعي شهرياً', enabled: true, highlighted: true, icon: 'MessageCircle' },
        { text: '500 دقيقة محادثة صوتية عالية الجودة', enabled: true, highlighted: true, icon: 'Mic' },
        { text: 'مقارنة النماذج المتعددة (Multi-AI Synthesis)', enabled: true, icon: 'Layers' },
        { text: 'ذاكرة موسعة ومحرك التحليل الشخصي', enabled: true, icon: 'Brain' },
        { text: 'استجابة فائقة السرعة وبدون انتظار', enabled: true, icon: 'Zap' },
      ],
      limits: {
        ai_messages_per_month: 2000,
        voice_minutes_per_month: 500,
        multi_ai_requests_per_month: 200,
        advanced_ai_requests_per_month: 500,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pro',
      name: 'الخطة الاحترافية (Pro Super)',
      description: 'السعة القصوى للمحترفين والأسر ورواد الأعمال',
      monthlyPrice: 24.99,
      yearlyPrice: 229.99,
      currency: 'USD',
      active: true,
      icon: 'Crown',
      badgeText: 'سعة كاملة بلا قيود 👑',
      highlightColor: 'amber',
      targetRegions: ['ALL'],
      features: ['ai_basic', 'ai_advanced', 'voice', 'multi_ai', 'advanced_memory', 'advanced_reports', 'priority_ai'],
      featuresList: [
        { text: '10,000 رسالة ذكاء اصطناعي شهرياً', enabled: true, highlighted: true, icon: 'Sparkles' },
        { text: '2000 دقيقة صوت تفاعلي وسريع جداً', enabled: true, highlighted: true, icon: 'Volume2' },
        { text: '1000 طلب نماذج متعددة وذكية جداً', enabled: true, icon: 'Cpu' },
        { text: 'دعم فني خاص وأولوية المعالجة على السيرفر', enabled: true, icon: 'ShieldCheck' },
      ],
      limits: {
        ai_messages_per_month: 10000,
        voice_minutes_per_month: 2000,
        multi_ai_requests_per_month: 1000,
        advanced_ai_requests_per_month: 2000,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  subscriptions: [
    {
      id: 'sub_admin_01',
      userId: 'admin_super_01',
      planId: 'premium',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      paymentProvider: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  subscriptionHistory: [],
  usageRecords: [],
  adminAuditLogs: [],
  aiUsageLogs: [],
  settings: {
    maintenanceMode: false,
    newRegistrationsEnabled: true,
    defaultPlan: 'free',
    defaultAIProvider: 'gemini',
    fallbackAIProvider: 'openai',
    multiAIEnabled: true,
    voiceEnabled: true,
    authMethods: {
      googleAuthEnabled: true,
      emailPasswordEnabled: false, // Default to Google-only as requested
    },
    providers: {
      gemini: { enabled: true, model: 'gemini-3.7-flash' },
      openai: { enabled: true, model: 'gpt-4o-mini' },
    },
    privateCandidVisibility: { mode: 'hidden' },
    maritalSupportVisibility: { mode: 'hidden' },
    superAdminEmail: getEnvAdminEmail(),
    superAdminPassword: getEnvAdminPassword(),
    paymentMethods: [
      {
        id: 'pm_bank_01',
        type: 'bank',
        title: 'تحويل بنكي (البنك الأهلي / الراجحي)',
        accountNumberOrDetails: 'EG120002000100000000012345678',
        accountHolder: 'شركة رفيق للذكاء الاصطناعي',
        instructions: 'يرجى تحويل مبلغ الاشتراك ثم رفع إيصال التحويل مع إدخال بريدك الحسابي للتفعيل المستمر.',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pm_wallet_01',
        type: 'wallet',
        title: 'محفظة إلكترونية (Vodafone Cash / STC Pay / InstaPay)',
        accountNumberOrDetails: '01012345678 / +966501234567',
        accountHolder: 'حساب رفيق الرسمي',
        instructions: 'أرسل قيمة الاشتراك للمحفظة ثم أرفق رقم العملية لتنفيذ التفعيل الفوري.',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'pm_card_01',
        type: 'card',
        title: 'بطاقة ائتمانية / الدفع الإلكتروني المباشر (Stripe / Visa)',
        accountNumberOrDetails: 'بوابة الدفع الإلكتروني المباشر',
        accountHolder: 'Stripe Secure Checkout',
        instructions: 'دفع مباشر آمن ويتم تفعيل الخطة فور سداد القيمة بالبطاقة.',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    features: defaultFeaturesList,
  },
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      let loadedData: Partial<DatabaseSchema> = {};

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        loadedData = JSON.parse(fileContent);
      }

      const loadedUsers = (loadedData.users || defaultDatabase.users).filter((u: any) => u.id !== 'user_default_01');
      const loadedSubs = (loadedData.subscriptions || defaultDatabase.subscriptions).filter((s: any) => s.userId !== 'user_default_01' && s.id !== 'sub_user_01');

      const loadedSettings: Partial<SystemSettingsEntity> = loadedData.settings || {};

      // Ensure Environment Variables take priority for admin email & password if explicitly configured
      const finalAdminEmail = process.env.ADMIN_EMAIL || process.env.SUPER_ADMIN_EMAIL || loadedSettings.superAdminEmail || 'admin@rafiq.ai';
      const finalAdminPassword = process.env.ADMIN_PASSWORD || process.env.SUPER_ADMIN_PASSWORD || loadedSettings.superAdminPassword || 'AdminSecret2026!';

      const mergedFeatures = defaultFeaturesList.map((defaultFeat) => {
        const found = (loadedSettings.features || []).find((f) => f.id === defaultFeat.id);
        return found ? { ...defaultFeat, ...found } : defaultFeat;
      });
      const customFeatures = (loadedSettings.features || []).filter(
        (f) => !defaultFeaturesList.some((df) => df.id === f.id)
      );

      const mergedSettings: SystemSettingsEntity = {
        ...defaultDatabase.settings,
        ...loadedSettings,
        authMethods: {
          googleAuthEnabled: loadedSettings.authMethods?.googleAuthEnabled !== undefined ? loadedSettings.authMethods.googleAuthEnabled : true,
          emailPasswordEnabled: loadedSettings.authMethods?.emailPasswordEnabled !== undefined ? loadedSettings.authMethods.emailPasswordEnabled : false,
        },
        superAdminEmail: finalAdminEmail,
        superAdminPassword: finalAdminPassword,
        features: [...mergedFeatures, ...customFeatures],
      };

      const finalDb: DatabaseSchema = {
        ...defaultDatabase,
        ...loadedData,
        users: loadedUsers,
        subscriptions: loadedSubs,
        settings: mergedSettings,
      };

      // Ensure super admin user entity email matches mergedSettings
      const superAdminUser = finalDb.users.find((u) => u.id === 'admin_super_01' || u.role === 'super_admin');
      if (superAdminUser) {
        superAdminUser.email = finalAdminEmail;
      }

      this.saveDatabase(finalDb);
      return finalDb;
    } catch (e) {
      console.warn('Failed to load database from file, using in-memory default:', e);
      return defaultDatabase;
    }
  }

  public save(): void {
    this.saveDatabase(this.data);
  }

  private saveDatabase(dbData: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database to disk:', e);
    }
  }

  // Getters
  public getUsers(): UserEntity[] {
    return this.data.users;
  }

  public getPlans(): PlanEntity[] {
    return this.data.plans;
  }

  public getSubscriptions(): SubscriptionEntity[] {
    return this.data.subscriptions;
  }

  public getSubscriptionHistory(): SubscriptionHistoryEntity[] {
    return this.data.subscriptionHistory;
  }

  public getUsageRecords(): UsageRecordEntity[] {
    return this.data.usageRecords;
  }

  public getAdminAuditLogs(): AdminAuditLogEntity[] {
    return this.data.adminAuditLogs;
  }

  public getAIUsageLogs(): AIUsageLogEntity[] {
    return this.data.aiUsageLogs;
  }

  public getPaymentReceipts(): PaymentReceiptEntity[] {
    if (!this.data.paymentReceipts) {
      this.data.paymentReceipts = [];
    }
    return this.data.paymentReceipts;
  }

  public addPaymentReceipt(receipt: PaymentReceiptEntity): PaymentReceiptEntity {
    if (!this.data.paymentReceipts) {
      this.data.paymentReceipts = [];
    }
    this.data.paymentReceipts.unshift(receipt);
    this.save();
    return receipt;
  }

  public updatePaymentReceiptStatus(
    id: string,
    status: 'approved' | 'rejected',
    reason?: string,
    approvedBy?: string
  ): PaymentReceiptEntity | undefined {
    if (!this.data.paymentReceipts) return undefined;
    const item = this.data.paymentReceipts.find((r) => r.id === id);
    if (item) {
      item.status = status;
      if (reason) item.rejectionReason = reason;
      if (approvedBy) item.approvedBy = approvedBy;
      item.approvedAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      this.save();
    }
    return item;
  }

  public updateUserLocation(
    userId: string,
    loc: {
      country?: string;
      countryCode?: string;
      city?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      locationStatus?: 'granted' | 'denied' | 'prompt' | 'unknown';
    }
  ): UserEntity | undefined {
    const u = this.findUserById(userId);
    if (u) {
      u.country = loc.country || u.country || 'غير معروف';
      u.countryCode = loc.countryCode || u.countryCode || 'XX';
      u.city = loc.city || u.city || 'غير معروف';
      u.region = loc.region || u.region;
      if (loc.latitude !== undefined) u.latitude = loc.latitude;
      if (loc.longitude !== undefined) u.longitude = loc.longitude;
      u.locationStatus = loc.locationStatus || 'unknown';
      u.locationUpdatedAt = new Date().toISOString();
      this.save();
      return u;
    }
    return undefined;
  }

  public getSettings(): SystemSettingsEntity {
    return this.data.settings;
  }

  // Mutation helpers
  public findUserById(id: string): UserEntity | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): UserEntity | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public upsertUser(user: UserEntity): UserEntity {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.save();
    return user;
  }

  public findPlanById(planId: string): PlanEntity | undefined {
    return this.data.plans.find((p) => p.id === planId);
  }

  public upsertPlan(plan: PlanEntity): PlanEntity {
    const idx = this.data.plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      this.data.plans[idx] = { ...plan, updatedAt: new Date().toISOString() };
    } else {
      this.data.plans.push(plan);
    }
    this.save();
    return plan;
  }

  public getSubscriptionByUserId(userId: string): SubscriptionEntity | undefined {
    return this.data.subscriptions.find((s) => s.userId === userId);
  }

  public upsertSubscription(sub: SubscriptionEntity): SubscriptionEntity {
    const idx = this.data.subscriptions.findIndex((s) => s.id === sub.id || s.userId === sub.userId);
    if (idx >= 0) {
      this.data.subscriptions[idx] = { ...sub, updatedAt: new Date().toISOString() };
    } else {
      this.data.subscriptions.push(sub);
    }
    this.save();
    return sub;
  }

  public addSubscriptionHistory(entry: Omit<SubscriptionHistoryEntity, 'id' | 'timestamp'>): SubscriptionHistoryEntity {
    const newEntry: SubscriptionHistoryEntity = {
      ...entry,
      id: 'sh_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    this.data.subscriptionHistory.unshift(newEntry);
    this.save();
    return newEntry;
  }

  public getUsageRecord(userId: string, period: string, feature: string): UsageRecordEntity | undefined {
    return this.data.usageRecords.find((r) => r.userId === userId && r.period === period && r.feature === feature);
  }

  public incrementUsage(userId: string, period: string, feature: string, amount: number = 1): UsageRecordEntity {
    let rec = this.getUsageRecord(userId, period, feature);
    if (!rec) {
      rec = {
        id: 'ur_' + Math.random().toString(36).substring(2, 9),
        userId,
        period,
        feature,
        count: amount,
        units: 'requests',
        lastUsedAt: new Date().toISOString(),
      };
      this.data.usageRecords.push(rec);
    } else {
      rec.count += amount;
      rec.lastUsedAt = new Date().toISOString();
    }
    this.save();
    return rec;
  }

  public resetUserUsage(userId: string, period: string): void {
    this.data.usageRecords = this.data.usageRecords.filter((r) => !(r.userId === userId && r.period === period));
    this.save();
  }

  public addAuditLog(log: Omit<AdminAuditLogEntity, 'id' | 'timestamp'>): AdminAuditLogEntity {
    const newLog: AdminAuditLogEntity = {
      ...log,
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    this.data.adminAuditLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  public addAIUsageLog(log: Omit<AIUsageLogEntity, 'id' | 'timestamp'>): AIUsageLogEntity {
    const newLog: AIUsageLogEntity = {
      ...log,
      id: 'ai_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    this.data.aiUsageLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  public deleteUser(id: string): void {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.save();
  }

  public updateSettings(partial: Partial<SystemSettingsEntity>): SystemSettingsEntity {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.settings;
  }

  public getPaymentMethods(): PaymentMethodEntity[] {
    return this.data.settings.paymentMethods || [];
  }

  public upsertPaymentMethod(pm: PaymentMethodEntity): PaymentMethodEntity {
    if (!this.data.settings.paymentMethods) {
      this.data.settings.paymentMethods = [];
    }
    const idx = this.data.settings.paymentMethods.findIndex((p) => p.id === pm.id);
    if (idx >= 0) {
      this.data.settings.paymentMethods[idx] = pm;
    } else {
      this.data.settings.paymentMethods.push(pm);
    }
    (this.data.settings as any).updatedAt = new Date().toISOString();
    this.save();
    return pm;
  }

  public deletePaymentMethod(id: string): void {
    if (!this.data.settings.paymentMethods) return;
    this.data.settings.paymentMethods = this.data.settings.paymentMethods.filter((p) => p.id !== id);
    (this.data.settings as any).updatedAt = new Date().toISOString();
    this.save();
  }

  // Feature Management & Rule Engine Methods
  public getFeatures(): FeatureRuleConfig[] {
    return this.data.settings.features || defaultFeaturesList;
  }

  public findFeatureById(id: string): FeatureRuleConfig | undefined {
    return (this.data.settings.features || defaultFeaturesList).find((f) => f.id === id);
  }

  public upsertFeature(feature: FeatureRuleConfig): FeatureRuleConfig {
    if (!this.data.settings.features) {
      this.data.settings.features = [...defaultFeaturesList];
    }
    const idx = this.data.settings.features.findIndex((f) => f.id === feature.id);
    const updated = { ...feature, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.data.settings.features[idx] = updated;
    } else {
      this.data.settings.features.push(updated);
    }
    (this.data.settings as any).updatedAt = new Date().toISOString();
    this.save();
    return updated;
  }

  public updateAllFeatures(features: FeatureRuleConfig[]): FeatureRuleConfig[] {
    this.data.settings.features = features.map((f) => ({ ...f, updatedAt: new Date().toISOString() }));
    (this.data.settings as any).updatedAt = new Date().toISOString();
    this.save();
    return this.data.settings.features;
  }

  public evaluateFeatureForContext(
    feature: FeatureRuleConfig,
    context: {
      userId?: string;
      email?: string;
      planId?: string;
      accountCreatedAt?: string;
      messagesCount?: number;
      tasksCompletedCount?: number;
    }
  ): EvaluatedFeatureStatus {
    const {
      userId = '',
      email = '',
      planId = 'free',
      accountCreatedAt,
      messagesCount = 0,
      tasksCompletedCount = 0,
    } = context;

    const isLoggedIn = Boolean(
      (email && email.trim().length > 0) ||
      (userId && userId.startsWith('USR-') && userId !== 'user_default_01')
    );

    // 0. Maintenance Mode / Coming Soon explicit locked behavior
    if (feature.lockedBehavior === 'maintenance') {
      return {
        id: feature.id,
        name: feature.nameAr,
        icon: feature.icon,
        enabled: false,
        locked: true,
        lockedBehavior: 'maintenance',
        reason: 'maintenance',
        lockTitle: feature.customLockTitle || 'الميزة تحت الصيانة والتحسينات 🛠️',
        lockMessage:
          feature.maintenanceMessage ||
          feature.customLockMessage ||
          'نعمل حالياً على تطوير وتحديث هذه الميزة لتقديم أداء أفضل وتجربة مميزة، وسنعاود إتاحتها فور اكتمال التحديثات. شكراً لتفهمكم وصبركم ✨',
        customBadge: feature.customBadge || 'maintenance',
        customBadgeText: feature.customBadgeText,
      };
    }

    if (feature.lockedBehavior === 'coming_soon') {
      return {
        id: feature.id,
        name: feature.nameAr,
        icon: feature.icon,
        enabled: false,
        locked: true,
        lockedBehavior: 'coming_soon',
        reason: 'coming_soon',
        lockTitle: feature.customLockTitle || 'قريباً جداً 🚀',
        lockMessage:
          feature.customLockMessage ||
          'ترقبوا إطلاق هذه الميزة قريباً! نعمل على تجهيزها لتمنحكم تجربة استثنائية.',
        customBadge: feature.customBadge || 'coming_soon',
        customBadgeText: feature.customBadgeText,
      };
    }

    // 1. Target Audience Evaluation
    if (feature.targetAudience === 'disabled') {
      return {
        id: feature.id,
        name: feature.nameAr,
        icon: feature.icon,
        enabled: false,
        locked: true,
        lockedBehavior: feature.lockedBehavior,
        reason: 'disabled',
        lockTitle: feature.customLockTitle || 'الميزة معطلة مؤقتاً',
        lockMessage: feature.customLockMessage || 'هذه الميزة معطلة حالياً للصيانة أو التطوير',
        customBadge: feature.customBadge,
        customBadgeText: feature.customBadgeText,
      };
    }

    if (feature.targetAudience === 'specific_users') {
      const allowedList = (feature.specificUsers || [])
        .map((u) => u.toLowerCase().trim())
        .filter(Boolean);
      const userMatch =
        (userId && allowedList.includes(userId.toLowerCase().trim())) ||
        (email && allowedList.includes(email.toLowerCase().trim()));

      if (!userMatch) {
        return {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'specific_users_only',
          lockTitle: feature.customLockTitle || 'ميزة خاصة ومحددة',
          lockMessage: feature.customLockMessage || 'هذه الميزة متاحة فقط لمستخدمين محددين تجريبياً',
          customBadge: feature.customBadge,
          customBadgeText: feature.customBadgeText,
        };
      }
    }

    if (feature.targetAudience === 'authenticated_only') {
      if (!isLoggedIn) {
        return {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'requires_auth',
          lockTitle: feature.customLockTitle || 'تسجيل الدخول مطلوب',
          lockMessage: feature.customLockMessage || 'يرجى تسجيل الدخول أو إنشاء حساب للوصول لهذه الميزة',
          customBadge: feature.customBadge,
          customBadgeText: feature.customBadgeText,
        };
      }
    }

    // 2. Plan Tier Requirement Evaluation (Supports 'none' / hidden from all plans)
    if (feature.allowedPlans) {
      const plans = feature.allowedPlans;
      const isNone = plans.includes('none') || plans.length === 0;
      if (isNone) {
        return {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'plan_restricted',
          lockTitle: feature.customLockTitle || 'غير متاحة للباقات',
          lockMessage:
            feature.customLockMessage || 'هذه الميزة معطلة حالياً لكافة الباقات والاشتراكات',
          customBadge: feature.customBadge,
          customBadgeText: feature.customBadgeText,
        };
      }

      if (!plans.includes('all') && !plans.includes(planId)) {
        return {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'plan_restricted',
          lockTitle: feature.customLockTitle || 'ترقية الخطة مطلوبة ✨',
          lockMessage:
            feature.customLockMessage ||
            `هذه الميزة تتطلب الاشتراك بإحدى الخطط المتقدمة (${plans.join(' / ')})`,
          customBadge: feature.customBadge,
          customBadgeText: feature.customBadgeText,
        };
      }
    }

    // 3. Progressive Disclosure (Onboarding & Usage Thresholds)
    if (feature.progressiveDisclosure && feature.progressiveDisclosure.enabled) {
      if (feature.progressiveDisclosure.minAccountAgeDays > 0 && accountCreatedAt) {
        const createdTime = new Date(accountCreatedAt).getTime();
        const daysOld = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
        if (daysOld < feature.progressiveDisclosure.minAccountAgeDays) {
          const remainingDays = Math.ceil(feature.progressiveDisclosure.minAccountAgeDays - daysOld);
          return {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'progressive_time_locked',
            lockMessage: feature.customLockMessage || `ستفتح هذه الميزة بعد ${remainingDays} يوم من استخدامك المستمر للتطبيق ✨`,
          };
        }
      }

      if (feature.progressiveDisclosure.minMessagesSent > 0) {
        if (messagesCount < feature.progressiveDisclosure.minMessagesSent) {
          const needed = feature.progressiveDisclosure.minMessagesSent - messagesCount;
          return {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'progressive_messages_locked',
            lockMessage: feature.customLockMessage || `أرسل ${needed} رسائل إضافية لفتح هذه الميزة تلقائياً ✨`,
          };
        }
      }

      if (feature.progressiveDisclosure.minCompletedTasks > 0) {
        if (tasksCompletedCount < feature.progressiveDisclosure.minCompletedTasks) {
          const needed = feature.progressiveDisclosure.minCompletedTasks - tasksCompletedCount;
          return {
            id: feature.id,
            name: feature.nameAr,
            icon: feature.icon,
            enabled: false,
            locked: true,
            lockedBehavior: feature.lockedBehavior,
            reason: 'progressive_tasks_locked',
            lockMessage: feature.customLockMessage || `أنجز ${needed} مهام إضافية لفتح هذه الأداة ✨`,
          };
        }
      }
    }

    // 4. Time Window Evaluation
    if (feature.timeWindow && feature.timeWindow.enabled) {
      const now = Date.now();
      if (feature.timeWindow.startDate && new Date(feature.timeWindow.startDate).getTime() > now) {
        return {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'outside_time_window',
          lockMessage: feature.customLockMessage || 'هذه الميزة ستبدأ قريباً في الموعد المحدد',
        };
      }
      if (feature.timeWindow.endDate && new Date(feature.timeWindow.endDate).getTime() < now) {
        return {
          id: feature.id,
          name: feature.nameAr,
          icon: feature.icon,
          enabled: false,
          locked: true,
          lockedBehavior: feature.lockedBehavior,
          reason: 'outside_time_window',
          lockMessage: feature.customLockMessage || 'انتهت الفترة المحددة لإتاحة هذه الميزة',
        };
      }
    }

    // All conditions passed
    return {
      id: feature.id,
      name: feature.nameAr,
      icon: feature.icon,
      enabled: true,
      locked: false,
      lockedBehavior: feature.lockedBehavior,
      reason: 'ok',
    };
  }

  public evaluateAllFeatures(context: {
    userId?: string;
    email?: string;
    planId?: string;
    accountCreatedAt?: string;
    messagesCount?: number;
    tasksCompletedCount?: number;
  }): Record<string, EvaluatedFeatureStatus> {
    const features = this.getFeatures();
    const result: Record<string, EvaluatedFeatureStatus> = {};
    for (const f of features) {
      result[f.id] = this.evaluateFeatureForContext(f, context);
    }
    return result;
  }
}

export const db = new Database();
