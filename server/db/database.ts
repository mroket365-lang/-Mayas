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
  limits: {
    ai_messages_per_month: number;
    voice_minutes_per_month: number;
    multi_ai_requests_per_month: number;
    advanced_ai_requests_per_month: number;
  };
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

export interface SystemSettingsEntity {
  maintenanceMode: boolean;
  newRegistrationsEnabled: boolean;
  defaultPlan: string;
  defaultAIProvider: string;
  fallbackAIProvider: string;
  multiAIEnabled: boolean;
  voiceEnabled: boolean;
  providers: {
    gemini: { enabled: boolean; model: string };
    openai: { enabled: boolean; model: string };
  };
  privateCandidVisibility?: FeatureFlagConfig;
  maritalSupportVisibility?: FeatureFlagConfig;
  superAdminEmail?: string;
  superAdminPassword?: string;
  paymentMethods?: PaymentMethodEntity[];
  updatedAt?: string;
}

export interface DatabaseSchema {
  users: UserEntity[];
  plans: PlanEntity[];
  subscriptions: SubscriptionEntity[];
  subscriptionHistory: SubscriptionHistoryEntity[];
  usageRecords: UsageRecordEntity[];
  adminAuditLogs: AdminAuditLogEntity[];
  aiUsageLogs: AIUsageLogEntity[];
  settings: SystemSettingsEntity;
}

const DATA_DIR = path.join(process.cwd(), 'server_data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultDatabase: DatabaseSchema = {
  users: [
    {
      id: 'admin_super_01',
      email: 'admin@rafiq.ai',
      name: 'Super Admin',
      role: 'super_admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      currency: 'USD',
    },
    {
      id: 'user_default_01',
      email: 'user@example.com',
      name: 'Rafiq User',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      currency: 'USD',
    },
  ],
  plans: [
    {
      id: 'free',
      name: 'Free Plan / الخطة المجانية',
      description: 'Standard AI companion with monthly limits',
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: 'USD',
      active: true,
      features: ['ai_basic', 'voice'],
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
      name: 'Premium Plan / الخطة المتقدمة',
      description: 'Unlimited AI conversations, Multi-AI orchestration & priority support',
      monthlyPrice: 9.99,
      yearlyPrice: 89.99,
      currency: 'USD',
      active: true,
      features: ['ai_basic', 'ai_advanced', 'voice', 'multi_ai', 'advanced_memory', 'advanced_reports', 'priority_ai'],
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
      name: 'Pro Family Plan / الخطة الاحترافية',
      description: 'Highest capacity for power users with unlimited multi-model synthesis',
      monthlyPrice: 24.99,
      yearlyPrice: 229.99,
      currency: 'USD',
      active: true,
      features: ['ai_basic', 'ai_advanced', 'voice', 'multi_ai', 'advanced_memory', 'advanced_reports', 'priority_ai'],
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
    {
      id: 'sub_user_01',
      userId: 'user_default_01',
      planId: 'free',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    providers: {
      gemini: { enabled: true, model: 'gemini-3.7-flash' },
      openai: { enabled: true, model: 'gpt-4o-mini' },
    },
    privateCandidVisibility: { mode: 'hidden' },
    maritalSupportVisibility: { mode: 'hidden' },
    superAdminEmail: 'admin@rafiq.ai',
    superAdminPassword: 'AdminSecret2026!',
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

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          ...defaultDatabase,
          ...parsed,
          settings: { ...defaultDatabase.settings, ...(parsed.settings || {}) },
        };
      } else {
        this.saveDatabase(defaultDatabase);
        return defaultDatabase;
      }
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
}

export const db = new Database();
