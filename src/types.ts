export type ItemType = 
  | 'task' 
  | 'appointment' 
  | 'reminder' 
  | 'alarm' 
  | 'habit' 
  | 'goal' 
  | 'idea' 
  | 'note' 
  | 'followup' 
  | 'memory';

export type TaskStatus = 
  | 'pending' 
  | 'completed' 
  | 'completed_late' 
  | 'missed' 
  | 'snoozed' 
  | 'cancelled' 
  | 'rescheduled';

export interface ActionSummary {
  type: 'created' | 'updated' | 'deleted' | 'completed' | 'searched' | 'review' | 'remembered';
  itemType: ItemType;
  title: string;
  details?: string;
  itemId?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue?: number;
  currentValue?: number;
  completed: boolean;
  startDate?: string;
  endDate?: string;
  note?: string;
}

export interface GoalAIAnalysis {
  percentage: number;
  status: 'excellent' | 'good' | 'behind' | 'critical';
  summary: string;
  advice: string[];
  analyzedAt: string;
}

export type TaskCategory = 
  | 'urgent'
  | 'work' 
  | 'personal' 
  | 'health' 
  | 'finance' 
  | 'education' 
  | 'home' 
  | 'other' 
  | string;

export interface CompanionItem {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm (24h)
  location?: string;
  person?: string;
  priority?: 'low' | 'medium' | 'high';
  repeatRule?: 'none' | 'daily' | 'weekly' | 'monthly' | 'specific_days';
  repeatDays?: number[]; // 0=Sunday, 1=Monday...
  streak?: number;
  bestStreak?: number;
  completedDates?: string[];
  icon?: string;
  category?: TaskCategory;
  memoryKey?: string;
  snoozedUntil?: string;
  completedAt?: string;
  subtasks?: SubTask[];
  progressPercent?: number; // 0 to 100
  // Long Notes fields
  imageUrl?: string;
  isLongNote?: boolean;
  noteCategory?: 'poetry' | 'snippet' | 'general' | 'draft' | 'long_note';
  // Goal & Plan fields
  startDate?: string;
  endDate?: string;
  targetGoal?: string;
  targetMetric?: string;
  targetValue?: number;
  currentValue?: number;
  milestones?: GoalMilestone[];
  aiAnalysis?: GoalAIAnalysis;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionsTaken?: ActionSummary[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  mediaName?: string;
}

export type PersonalityType = 
  | 'close_friend' 
  | 'brother_sister' 
  | 'secretary' 
  | 'motivator' 
  | 'calm' 
  | 'spontaneous'
  | 'bold';

export type ProactivityLevel = 'low' | 'medium' | 'high';

export type AppLanguage = 'ar' | 'en' | 'zh' | 'hi' | 'ja' | 'de' | 'tr' | 'fr';

export type CompanionGender = 'male' | 'female' | 'unspecified';

export type ConsultationType =
  | 'none'
  | 'financial'
  | 'family'
  | 'religious'
  | 'political'
  | 'psychological'
  | 'marital';

export interface ConsultationConfig {
  id: ConsultationType;
  featureId: string;
  nameAr: string;
  nameEn: string;
  categoryNameAr: string;
  categoryNameEn: string;
  descAr: string;
  descEn: string;
  iconName: string;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  ageRestricted?: boolean;
  systemPromptDirectiveAr: string;
  systemPromptDirectiveEn: string;
}

export interface UserProfile {
  id?: string;
  accountId?: string;
  email?: string;
  username?: string;
  phone?: string;
  displayName: string;
  addressAs: string;
  companionGender: CompanionGender;
  personality: PersonalityType;
  language: AppLanguage;
  proactivityLevel: ProactivityLevel;
  useEmojis: boolean;
  voiceSpeed: number;
  alarmSoundEnabled: boolean;
  theme: 'light' | 'dark';
  onboardingCompleted: boolean;
  dailyMessageLimit: number;
  timeZone: string;
  privateCandidMode?: boolean;
  specialCounselingEnabled?: boolean;
  specialCounselingVerified18?: boolean;
  specialCounselingExpiresAt?: string;
  specialCounselingLastActivatedDate?: string;
  activeConsultationType?: ConsultationType;
  activeConsultationExpiresAt?: string;
  activeConsultationActivatedAt?: string;
  dailyCheckInEnabled?: boolean;
  dailyCheckInTime?: string; // HH:mm (e.g. "20:00")
  lastDailyCheckInDate?: string; // YYYY-MM-DD
  checkInStreak?: number;
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

export interface PlanItemConfig {
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
  targetRegions?: string[]; // e.g. ['all'] or ['SA', 'AE', 'EG', 'US', etc.]
  unlockedFeatureIds?: string[];
  limits: {
    ai_messages_per_month: number;
    voice_minutes_per_month: number;
    multi_ai_requests_per_month: number;
    advanced_ai_requests_per_month: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentReceiptRequest {
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
  receiptImage?: string; // Base64 data URL for transfer receipt screenshot
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type MoodType = 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'sad';

export interface HabitCheckInStatus {
  habitId: string;
  habitTitle: string;
  completed: boolean;
}

export interface DailyCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mood: MoodType;
  moodScore: number; // 1 (sad) to 5 (great)
  energyLevel: number; // 1 to 5
  note?: string;
  habitsSummary: HabitCheckInStatus[];
  source: 'voice' | 'text';
  createdAt: string;
}

export type FeatureVisibilityMode = 'hidden' | 'everyone' | 'specific_user' | 'allowed_users_list' | 'region';

export interface FeatureFlagConfig {
  mode: FeatureVisibilityMode;
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

export interface SystemFeaturePermissions {
  privateCandidAllowed: boolean;
  maritalSupportAllowed: boolean;
}

export interface DailyReport {
  date: string;
  totalTasks: number;
  completedOnTime: number;
  completedLate: number;
  missed: number;
  cancelled: number;
  scorePercentage: number;
  summaryNote: string;
  reviewedAt?: string;
}
