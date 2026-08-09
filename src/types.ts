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
  category?: string;
  memoryKey?: string;
  snoozedUntil?: string;
  completedAt?: string;
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
  | 'spontaneous';

export type ProactivityLevel = 'low' | 'medium' | 'high';

export type AppLanguage = 'ar' | 'en' | 'zh' | 'hi' | 'ja' | 'de' | 'tr' | 'fr';

export interface UserProfile {
  id?: string;
  displayName: string;
  addressAs: string;
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
