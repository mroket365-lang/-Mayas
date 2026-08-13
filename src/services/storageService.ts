import { CompanionItem, ChatMessage, UserProfile, DailyReport } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'rafiq_user_profile',
  ITEMS: 'rafiq_saved_items',
  MESSAGES: 'rafiq_chat_messages',
  DAILY_REPORTS: 'rafiq_daily_reports',
};

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
  onboardingCompleted: false,
  dailyMessageLimit: 5,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh',
  privateCandidMode: false,
  specialCounselingEnabled: false,
  specialCounselingVerified18: false,
  specialCounselingExpiresAt: undefined,
  specialCounselingLastActivatedDate: undefined,
};

export const storageService = {
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
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load messages:', e);
      return [];
    }
  },

  saveMessages(messages: ChatMessage[]): void {
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

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.DAILY_REPORTS);
    // Reset profile but keep language/theme
    const current = this.getProfile();
    this.saveProfile({
      ...defaultProfile,
      language: current.language,
      theme: current.theme,
    });
  },

  exportAllData(): string {
    const data = {
      profile: this.getProfile(),
      items: this.getItems(),
      messages: this.getMessages(),
      dailyReports: this.getDailyReports(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }
};
