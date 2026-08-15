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
  category?: string;
  memoryKey?: string;
  snoozedUntil?: string;
  completedAt?: string;
  subtasks?: SubTask[];
  progressPercent?: number; // 0 to 100
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
  dailyCheckInEnabled?: boolean;
  dailyCheckInTime?: string; // HH:mm (e.g. "20:00")
  lastDailyCheckInDate?: string; // YYYY-MM-DD
  checkInStreak?: number;
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
