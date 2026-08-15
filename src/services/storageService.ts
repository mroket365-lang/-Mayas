import { CompanionItem, ChatMessage, UserProfile, DailyReport, DailyCheckIn } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'rafiq_user_profile',
  ITEMS: 'rafiq_saved_items',
  MESSAGES: 'rafiq_chat_messages',
  DAILY_REPORTS: 'rafiq_daily_reports',
  DAILY_CHECKINS: 'rafiq_daily_checkins',
  REMEMBER_TOKEN: 'rafiq_remember_token',
  AUTH_USER: 'rafiq_authenticated_user',
  GUEST_SESSION_AT: 'rafiq_guest_session_timestamp',
};

// 24-hour expiration for guest local sessions (Standard AI companion security & privacy practice)
const GUEST_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const defaultProfile: UserProfile = {
  displayName: 'غالي',
  addressAs: 'يا غالي',
  companionGender: 'female',
  personality: 'close_friend',
  language: 'ar',
  proactivityLevel: 'medium',
  useEmojis: true,
  voiceSpeed: 1.0,
  alarmSoundEnabled: true,
  theme: 'light',
  onboardingCompleted: true,
  dailyMessageLimit: 5,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh',
  privateCandidMode: false,
  specialCounselingEnabled: false,
  specialCounselingVerified18: false,
  specialCounselingExpiresAt: undefined,
  specialCounselingLastActivatedDate: undefined,
  dailyCheckInEnabled: true,
  dailyCheckInTime: '20:00',
  lastDailyCheckInDate: undefined,
  checkInStreak: 0,
};

export const storageService = {
  getRememberToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.REMEMBER_TOKEN);
    } catch {
      return null;
    }
  },

  setRememberToken(token: string | null, userObj?: any): void {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_TOKEN, token);
        if (userObj) {
          localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userObj));
        }
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {
      console.warn('Could not store remember token:', e);
    }
  },

  getStoredAuthUser(): any | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) return defaultProfile;
      return { ...defaultProfile, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load profile:', e);
      return defaultProfile;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  },

  getItems(): CompanionItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load items:', e);
      return [];
    }
  },

  saveItems(items: CompanionItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save items:', e);
      try {
        // Fallback: prune completed items if quota exceeded
        const activeItems = items.filter(i => i.status !== 'completed');
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(activeItems));
      } catch (_) {}
    }
  },

  addItem(item: CompanionItem): CompanionItem[] {
    const items = this.getItems();
    // Check duplicate title & type within pending items
    const duplicate = items.find(
      i => i.type === item.type && i.title.trim().toLowerCase() === item.title.trim().toLowerCase() && i.status === 'pending'
    );
    if (duplicate) {
      return items;
    }
    const updated = [item, ...items];
    this.saveItems(updated);
    return updated;
  },

  updateItem(updatedItem: CompanionItem): CompanionItem[] {
    const items = this.getItems();
    const updated = items.map(i => (i.id === updatedItem.id ? updatedItem : i));
    this.saveItems(updated);
    return updated;
  },

  deleteItem(id: string): CompanionItem[] {
    const items = this.getItems();
    const updated = items.filter(i => i.id !== id);
    this.saveItems(updated);
    return updated;
  },

  getMessages(): ChatMessage[] {
    try {
      // Check if this is a guest user session and check if it expired (> 24 hours)
      const token = this.getRememberToken();
      if (!token) {
        const guestSessionTimeStr = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_AT);
        if (guestSessionTimeStr) {
          const guestSessionTime = parseInt(guestSessionTimeStr, 10);
          if (!isNaN(guestSessionTime) && Date.now() - guestSessionTime > GUEST_SESSION_MAX_AGE_MS) {
            // Guest session expired (exceeded 24 hours): clean temporary guest data
            this.cleanExpiredGuestSession();
            return [];
          }
        }
      }

      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  },

  cleanExpiredGuestSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
      localStorage.removeItem(STORAGE_KEYS.DAILY_REPORTS);
      localStorage.removeItem(STORAGE_KEYS.DAILY_CHECKINS);
      localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_AT);
    } catch (e) {
      console.warn('Failed to clean expired guest session:', e);
    }
  },

  touchGuestSession(): void {
    try {
      const token = this.getRememberToken();
      if (!token) {
        const existing = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION_AT);
        if (!existing) {
          localStorage.setItem(STORAGE_KEYS.GUEST_SESSION_AT, Date.now().toString());
        }
      }
    } catch (_) {}
  },

  saveMessages(messages: ChatMessage[]): void {
    // Update guest session timestamp if guest
    this.touchGuestSession();

    // 1. Sanitize messages for storage: keep last 150 messages & strip heavy base64 mediaUrl strings
    let toSave: ChatMessage[] = messages.slice(-150).map(m => {
      if (m.mediaUrl && m.mediaUrl.length > 2000) {
        // Exclude heavy base64 data string from persistent localStorage
        const { mediaUrl, ...rest } = m;
        return rest;
      }
      return m;
    });

    // 2. Progressive saving with fallback handling for QuotaExceededError
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Initial saveMessages failed (quota exceeded). Pruning old history...');
      try {
        // Prune to last 70 messages
        toSave = toSave.slice(-70);
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(toSave));
      } catch (e2) {
        try {
          // Prune to last 30 messages
          toSave = toSave.slice(-30);
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(toSave));
        } catch (e3) {
          try {
            // Strip all media metadata & keep last 15 text-only messages
            toSave = toSave.slice(-15).map(m => ({
              id: m.id,
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp
            }));
            localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(toSave));
          } catch (e4) {
            console.error('Storage quota severely exceeded, unable to persist messages:', e4);
          }
        }
      }
    }
  },

  addMessage(msg: ChatMessage): ChatMessage[] {
    const msgs = this.getMessages();
    const exists = msgs.some(m => m.id === msg.id);
    const updated = exists ? msgs.map(m => (m.id === msg.id ? msg : m)) : [...msgs, msg];
    this.saveMessages(updated);
    return updated;
  },

  getDailyReports(): DailyReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_REPORTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load daily reports:', e);
      return [];
    }
  },

  saveDailyReport(report: DailyReport): void {
    const reports = this.getDailyReports();
    const filtered = reports.filter(r => r.date !== report.date);
    const updated = [report, ...filtered];
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save daily report:', e);
    }
  },

  getDailyCheckIns(): DailyCheckIn[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_CHECKINS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load daily check-ins:', e);
      return [];
    }
  },

  getTodayCheckIn(): DailyCheckIn | null {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkIns = this.getDailyCheckIns();
    return checkIns.find(c => c.date === todayStr) || null;
  },

  saveDailyCheckIn(checkIn: DailyCheckIn): { checkIns: DailyCheckIn[]; streak: number } {
    const checkIns = this.getDailyCheckIns();
    const filtered = checkIns.filter(c => c.date !== checkIn.date);
    const updated = [checkIn, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_CHECKINS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save daily check-in:', e);
    }

    // Calculate streak
    let streak = 0;
    const sortedDates = Array.from(new Set(updated.map(c => c.date))).sort().reverse();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (sortedDates.length > 0 && (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr)) {
      streak = 1;
      let checkDate = new Date(sortedDates[0]);
      for (let i = 1; i < sortedDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const expectedStr = checkDate.toISOString().split('T')[0];
        if (sortedDates[i] === expectedStr) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Update profile
    const profile = this.getProfile();
    const updatedProfile: UserProfile = {
      ...profile,
      lastDailyCheckInDate: checkIn.date,
      checkInStreak: streak,
    };
    this.saveProfile(updatedProfile);

    // Also update habits status in saved items if any matching habit items exist
    if (checkIn.habitsSummary && checkIn.habitsSummary.length > 0) {
      const items = this.getItems();
      let itemsChanged = false;
      const updatedItems = items.map(item => {
        const matchingHabit = checkIn.habitsSummary.find(h => h.habitId === item.id || h.habitTitle.trim() === item.title.trim());
        if (matchingHabit && matchingHabit.completed) {
          itemsChanged = true;
          const completedDates = item.completedDates || [];
          if (!completedDates.includes(checkIn.date)) {
            const newDates = [...completedDates, checkIn.date];
            const currentStreak = (item.streak || 0) + 1;
            return {
              ...item,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              completedDates: newDates,
              streak: currentStreak,
              bestStreak: Math.max(item.bestStreak || 0, currentStreak),
            };
          }
        }
        return item;
      });

      if (itemsChanged) {
        this.saveItems(updatedItems);
      }
    }

    // Dispatch realtime event for app components
    try {
      window.dispatchEvent(new CustomEvent('rafiq_checkin_updated', { detail: { checkIn, streak } }));
    } catch (_) {}

    return { checkIns: updated, streak };
  },

  getCheckInStats(): {
    streak: number;
    totalCheckIns: number;
    avgMoodScore: number;
    avgEnergy: number;
    moodBreakdown: Record<string, number>;
    recentTimeline: DailyCheckIn[];
    habitsCompletedTotal: number;
  } {
    const checkIns = this.getDailyCheckIns();
    const profile = this.getProfile();
    const streak = profile.checkInStreak || 0;
    const totalCheckIns = checkIns.length;

    if (totalCheckIns === 0) {
      return {
        streak,
        totalCheckIns: 0,
        avgMoodScore: 0,
        avgEnergy: 0,
        moodBreakdown: { great: 0, good: 0, neutral: 0, tired: 0, stressed: 0, sad: 0 },
        recentTimeline: [],
        habitsCompletedTotal: 0,
      };
    }

    const sumMood = checkIns.reduce((acc, c) => acc + (c.moodScore || 3), 0);
    const sumEnergy = checkIns.reduce((acc, c) => acc + (c.energyLevel || 3), 0);
    const avgMoodScore = Number((sumMood / totalCheckIns).toFixed(1));
    const avgEnergy = Number((sumEnergy / totalCheckIns).toFixed(1));

    const moodBreakdown: Record<string, number> = {
      great: 0,
      good: 0,
      neutral: 0,
      tired: 0,
      stressed: 0,
      sad: 0,
    };

    let habitsCompletedTotal = 0;
    checkIns.forEach(c => {
      if (moodBreakdown[c.mood] !== undefined) {
        moodBreakdown[c.mood] += 1;
      }
      if (c.habitsSummary) {
        habitsCompletedTotal += c.habitsSummary.filter(h => h.completed).length;
      }
    });

    return {
      streak,
      totalCheckIns,
      avgMoodScore,
      avgEnergy,
      moodBreakdown,
      recentTimeline: checkIns.slice(0, 14),
      habitsCompletedTotal,
    };
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.DAILY_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_CHECKINS);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_AT);
    // Reset profile but keep language/theme
    const current = this.getProfile();
    this.saveProfile({
      ...defaultProfile,
      language: current.language,
      theme: current.theme,
    });
  },

  resetToGuestSession(): { profile: UserProfile; items: CompanionItem[]; messages: ChatMessage[] } {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.DAILY_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_CHECKINS);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION_AT);

    const current = this.getProfile();
    const guestProfile: UserProfile = {
      ...defaultProfile,
      language: current.language || 'ar',
      theme: current.theme || 'light',
    };
    this.saveProfile(guestProfile);
    return {
      profile: guestProfile,
      items: [],
      messages: [],
    };
  },

  exportAllData(): string {
    const data = {
      profile: this.getProfile(),
      items: this.getItems(),
      messages: this.getMessages(),
      dailyReports: this.getDailyReports(),
      dailyCheckIns: this.getDailyCheckIns(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }
};
