import { db, PlanEntity, SubscriptionEntity, UsageRecordEntity, UserEntity } from '../db/database.js';

export interface EntitlementCheckResult {
  allowed: boolean;
  reason?: string;
  planId: string;
  planName: string;
  featureKey: string;
  currentUsage: number;
  maxLimit: number;
  period: string;
}

export class SubscriptionService {
  /**
   * Get or initialize subscription for a user.
   * If user doesn't exist, initializes user and assigns default Free plan.
   */
  public static getUserSubscription(userId: string): {
    user: UserEntity;
    subscription: SubscriptionEntity;
    plan: PlanEntity;
  } {
    const isGuest = !userId || userId === 'user_default_01' || userId.startsWith('guest_') || !userId.startsWith('USR-');
    let user = db.findUserById(userId);

    const plans = db.getPlans();
    const defaultPlanId = db.getSettings().defaultPlan || 'free';
    const freePlan = plans.find((p) => p.id === defaultPlanId) || plans.find((p) => p.id === 'free') || plans[0];

    if (!user) {
      if (isGuest) {
        // Return transient guest subscription without saving to database
        const guestUser: UserEntity = {
          id: userId || 'guest',
          email: 'guest@rafiq.local',
          name: 'ضيف زائر',
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          currency: 'USD',
        };
        const guestSub: SubscriptionEntity = {
          id: 'sub_guest',
          userId: guestUser.id,
          planId: freePlan.id,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: false,
          paymentProvider: 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { user: guestUser, subscription: guestSub, plan: freePlan };
      }

      user = db.upsertUser({
        id: userId,
        email: `${userId}@user.rafiq`,
        name: 'Rafiq User',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        currency: 'USD',
      });
    } else {
      db.upsertUser({ ...user, lastActiveAt: new Date().toISOString() });
    }

    let sub = db.getSubscriptionByUserId(userId);
    const now = new Date();

    if (!sub) {
      sub = db.upsertSubscription({
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        userId,
        planId: freePlan.id,
        status: 'active',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true,
        paymentProvider: 'manual',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    // Check expiration
    if (sub.status === 'active' && new Date(sub.endDate) < now && sub.planId !== 'free') {
      sub.status = 'expired';
      db.upsertSubscription(sub);
      db.addSubscriptionHistory({
        userId,
        subscriptionId: sub.id,
        planId: sub.planId,
        action: 'expired',
        status: 'expired',
        details: 'Subscription expired automatically due to end date passage.',
      });
    }

    let plan = db.findPlanById(sub.status === 'active' ? sub.planId : 'free');
    if (!plan) {
      plan = db.findPlanById('free')!;
    }

    return { user, subscription: sub, plan };
  }

  /**
   * Checks if user is entitled to use a given feature and is within current period usage limit.
   */
  public static checkEntitlement(userId: string, featureKey: 'ai_messages' | 'voice_minutes' | 'multi_ai' | 'advanced_ai'): EntitlementCheckResult {
    const { user, subscription, plan } = this.getUserSubscription(userId);

    if (user.status === 'suspended' || user.status === 'banned') {
      return {
        allowed: false,
        reason: 'Account is suspended or restricted.',
        planId: plan.id,
        planName: plan.name,
        featureKey,
        currentUsage: 0,
        maxLimit: 0,
        period: this.getCurrentPeriod(),
      };
    }

    const settings = db.getSettings();
    if (settings.maintenanceMode) {
      return {
        allowed: false,
        reason: 'System is currently under scheduled maintenance.',
        planId: plan.id,
        planName: plan.name,
        featureKey,
        currentUsage: 0,
        maxLimit: 0,
        period: this.getCurrentPeriod(),
      };
    }

    const period = this.getCurrentPeriod();
    const usageRec = db.getUsageRecord(userId, period, featureKey);
    const currentUsage = usageRec ? usageRec.count : 0;

    let limitKey: keyof PlanEntity['limits'] = 'ai_messages_per_month';
    if (featureKey === 'voice_minutes') limitKey = 'voice_minutes_per_month';
    if (featureKey === 'multi_ai') limitKey = 'multi_ai_requests_per_month';
    if (featureKey === 'advanced_ai') limitKey = 'advanced_ai_requests_per_month';

    const maxLimit = plan.limits[limitKey] ?? 0;

    if (featureKey === 'multi_ai' && !settings.multiAIEnabled) {
      return {
        allowed: false,
        reason: 'Multi-AI orchestration feature is temporarily disabled by admin.',
        planId: plan.id,
        planName: plan.name,
        featureKey,
        currentUsage,
        maxLimit,
        period,
      };
    }

    if (currentUsage >= maxLimit) {
      return {
        allowed: false,
        reason: `Monthly limit reached for ${featureKey} (${currentUsage}/${maxLimit}).`,
        planId: plan.id,
        planName: plan.name,
        featureKey,
        currentUsage,
        maxLimit,
        period,
      };
    }

    return {
      allowed: true,
      planId: plan.id,
      planName: plan.name,
      featureKey,
      currentUsage,
      maxLimit,
      period,
    };
  }

  public static recordUsage(userId: string, featureKey: string, amount: number = 1): UsageRecordEntity {
    const period = this.getCurrentPeriod();
    return db.incrementUsage(userId, period, featureKey, amount);
  }

  /**
   * Helper to calculate complete stats for a user:
   * Tokens, Points (1 point = 5 tokens), Messages, Voice (minutes & seconds), Multi-AI, Advanced AI
   */
  public static getUserFullStats(userId: string) {
    const period = this.getCurrentPeriod();
    const usageRecords = db.getUsageRecords().filter((r) => r.userId === userId && r.period === period);
    const aiLogs = db.getAIUsageLogs().filter((l) => l.userId === userId);

    let messagesCount = 0;
    let voiceSeconds = 0;
    let multiAiCount = 0;
    let advancedAiCount = 0;
    let tokensUsed = 0;

    usageRecords.forEach((r) => {
      if (r.feature === 'ai_messages') messagesCount += r.count;
      else if (r.feature === 'voice_seconds') voiceSeconds += r.count;
      else if (r.feature === 'voice_minutes') voiceSeconds += r.count * 60;
      else if (r.feature === 'multi_ai') multiAiCount += r.count;
      else if (r.feature === 'advanced_ai') advancedAiCount += r.count;
      else if (r.feature === 'tokens_used') tokensUsed += r.count;
    });

    // Also sum from AI Logs if tokens not explicitly counted in usageRecords
    let logsTokens = 0;
    let logsCostUSD = 0;
    aiLogs.forEach((l) => {
      logsTokens += (l.tokensInput || 0) + (l.tokensOutput || 0);
      logsCostUSD += l.estimatedCost || 0;
    });

    const totalTokens = Math.max(tokensUsed, logsTokens);
    const pointsUsed = Math.floor(totalTokens / 5); // 1 point = 5 tokens
    const voiceMinutes = Number((voiceSeconds / 60).toFixed(1));

    return {
      period,
      tokensUsed: totalTokens,
      pointsUsed, // 1 point = 5 tokens
      pointsToTokensRatio: 5, // Rule: 1 point = 5 tokens
      messagesCount,
      voiceSeconds,
      voiceMinutes,
      multiAiCount,
      advancedAiCount,
      estimatedCostUSD: Number(logsCostUSD.toFixed(4)),
      totalLogsCount: aiLogs.length,
    };
  }

  public static getCurrentPeriod(): string {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  }

  public static grantManualPremium(
    targetUserId: string,
    planId: string,
    durationDays: number,
    adminId: string,
    adminEmail: string
  ): SubscriptionEntity {
    const plan = db.findPlanById(planId);
    if (!plan) throw new Error(`Plan with ID ${planId} not found.`);

    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    let sub = db.getSubscriptionByUserId(targetUserId);

    if (!sub) {
      sub = {
        id: 'sub_' + Math.random().toString(36).substring(2, 9),
        userId: targetUserId,
        planId,
        status: 'active',
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: false,
        paymentProvider: 'manual',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    } else {
      sub.planId = planId;
      sub.status = 'active';
      sub.startDate = now.toISOString();
      sub.endDate = endDate.toISOString();
      sub.paymentProvider = 'manual';
    }

    db.upsertSubscription(sub);

    db.addSubscriptionHistory({
      userId: targetUserId,
      subscriptionId: sub.id,
      planId,
      action: 'manual_grant',
      status: 'active',
      performedBy: adminId,
      details: `Granted ${plan.name} manually for ${durationDays} days.`,
    });

    db.addAuditLog({
      adminId,
      adminEmail,
      action: 'GRANT_PREMIUM',
      targetUserId,
      details: `Granted plan '${plan.name}' (${planId}) for ${durationDays} days.`,
    });

    return sub;
  }
}
