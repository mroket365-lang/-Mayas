import { Router, Request, Response, NextFunction } from 'express';
import { db, UserEntity, PlanEntity } from '../db/database.js';
import { SubscriptionService } from '../services/subscriptionService.js';
import { realtimeSyncService } from '../services/realtimeSyncService.js';

export const adminRouter = Router();

// In-memory admin session storage for security
const activeAdminSessions = new Map<string, { adminId: string; email: string; role: string; expiresAt: number }>();

// Simple hash or validation token helper
function generateAdminToken(): string {
  return 'adm_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Admin Auth Middleware
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const tokenHeader = req.headers['x-admin-token'] as string;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : tokenHeader;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const session = activeAdminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeAdminSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }

  (req as any).adminSession = session;
  next();
}

// Require Super Admin role for sensitive settings
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).adminSession;
  if (!session || session.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden: Super Admin privileges required' });
  }
  next();
}

// 1. Admin Login Endpoint
adminRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const settings = db.getSettings();
  const storedAdminEmail = settings.superAdminEmail || 'admin@rafiq.ai';
  const storedAdminPassword = settings.superAdminPassword || 'AdminSecret2026!';

  // Check super admin or assistant managers in DB
  const isSuperAdmin =
    email.trim().toLowerCase() === storedAdminEmail.toLowerCase() && password === storedAdminPassword;

  const assistantUser = db.getUsers().find(
    (u) =>
      (u.role === 'admin' || u.role === 'assistant') &&
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.passwordHash === password
  );

  if (isSuperAdmin || assistantUser) {
    const adminUser = isSuperAdmin
      ? {
          id: 'admin_super_01',
          email: storedAdminEmail,
          name: 'Super Admin',
          role: 'super_admin' as const,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        }
      : assistantUser!;

    const token = generateAdminToken();
    activeAdminSessions.set(token, {
      adminId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    });

    db.addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'ADMIN_LOGIN',
      details: `Admin/Assistant (${adminUser.role}) logged in successfully.`,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      token,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        permissions: (adminUser as any).permissions || [],
      },
    });
  }

  return res.status(401).json({ error: 'بيانات تسجيل الدخول الخاصة بالإدارة غير صحيحة' });
});

// 2. Verify Session Token
adminRouter.get('/verify', requireAdminAuth, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  const admin = db.findUserById(session.adminId);
  return res.json({
    valid: true,
    admin: {
      id: session.adminId,
      email: session.email,
      role: session.role,
      name: admin?.name || 'Admin',
    },
  });
});

// 3. Dashboard Aggregated Stats
const getDashboardStats = (req: Request, res: Response) => {
  const users = db.getUsers();
  const subscriptions = db.getSubscriptions();
  const aiLogs = db.getAIUsageLogs();
  const plans = db.getPlans();
  const settings = db.getSettings();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
  const expiredSubscriptions = subscriptions.filter((s) => s.status === 'expired').length;
  const cancelledSubscriptions = subscriptions.filter((s) => s.status === 'cancelled').length;

  const premiumUsers = subscriptions.filter((s) => s.status === 'active' && s.planId !== 'free').length;
  const freeUsers = totalUsers - premiumUsers;

  const totalAIRequests = aiLogs.length;
  const estimatedAICostUSD = aiLogs.reduce((acc, log) => acc + (log.estimatedCost || 0), 0);

  return res.json({
    totalUsers,
    activeUsers,
    suspendedUsers,
    freeUsers,
    premiumUsers,
    activeSubscriptions,
    expiredSubscriptions,
    cancelledSubscriptions,
    totalAIRequests,
    estimatedAICostUSD: Number(estimatedAICostUSD.toFixed(4)),
    settings,
    plansCount: plans.length,
    activePlansCount: plans.filter((p) => p.active).length,
  });
};

adminRouter.get('/dashboard/stats', requireAdminAuth, getDashboardStats);
adminRouter.get('/stats', requireAdminAuth, getDashboardStats);

// Helper to check if a user is a non-logged-in guest account
function isGuestUser(u: UserEntity): boolean {
  if (!u.email || u.email.trim() === '') return true;
  const emailLower = u.email.toLowerCase().trim();
  if (
    emailLower.startsWith('guest_') ||
    emailLower.startsWith('anonymous_') ||
    emailLower.startsWith('temp_') ||
    emailLower.endsWith('@guest.local') ||
    emailLower.endsWith('@example.com') ||
    u.id === 'user_default_01' ||
    !emailLower.includes('@')
  ) {
    return true;
  }
  return false;
}

// 4. Users List (Paginated & Searchable with Guest Separation)
adminRouter.get('/users', requireAdminAuth, (req: Request, res: Response) => {
  const { search = '', plan = '', status = '', userType = 'all', page = '1', limit = '10' } = req.query;

  let allUsers = db.getUsers();
  const subscriptions = db.getSubscriptions();
  const plans = db.getPlans();

  // Calculate global counts before pagination/filtering
  const registeredCount = allUsers.filter((u) => !isGuestUser(u)).length;
  const guestCount = allUsers.filter((u) => isGuestUser(u)).length;

  let users = [...allUsers];

  // User type filter ('registered' vs 'guest' vs 'all')
  if (userType === 'registered') {
    users = users.filter((u) => !isGuestUser(u));
  } else if (userType === 'guest') {
    users = users.filter((u) => isGuestUser(u));
  }

  // Search filter
  if (search) {
    const q = String(search).toLowerCase();
    users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }

  // Status filter
  if (status) {
    users = users.filter((u) => u.status === status);
  }

  // Plan filter
  if (plan) {
    users = users.filter((u) => {
      const sub = subscriptions.find((s) => s.userId === u.id);
      const userPlan = sub && sub.status === 'active' ? sub.planId : 'free';
      return userPlan === plan;
    });
  }

  const totalCount = users.length;
  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.max(1, parseInt(String(limit)) || 10);
  const totalPages = Math.ceil(totalCount / limitNum) || 1;

  const paginatedUsers = users.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  const formatted = paginatedUsers.map((u) => {
    const sub = subscriptions.find((s) => s.userId === u.id);
    const planObj = plans.find((p) => p.id === (sub && sub.status === 'active' ? sub.planId : 'free'));
    const isGuest = isGuestUser(u);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isGuest,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
      subscription: sub
        ? {
            id: sub.id,
            planId: sub.planId,
            planName: planObj?.name || sub.planId,
            status: sub.status,
            endDate: sub.endDate,
            paymentProvider: sub.paymentProvider,
          }
        : {
            planId: 'free',
            planName: 'Free Plan',
            status: 'active',
          },
    };
  });

  return res.json({
    users: formatted,
    totalCount,
    registeredCount,
    guestCount,
    page: pageNum,
    totalPages,
  });
});

// 5. User Details API
adminRouter.get('/users/:id', requireAdminAuth, (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = db.findUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const sub = db.getSubscriptionByUserId(userId);
  const plan = db.findPlanById(sub?.planId || 'free');
  const usagePeriod = SubscriptionService.getCurrentPeriod();

  const usageRecords = db.getUsageRecords().filter((r) => r.userId === userId && r.period === usagePeriod);
  const history = db.getSubscriptionHistory().filter((h) => h.userId === userId);
  const aiLogs = db.getAIUsageLogs().filter((l) => l.userId === userId).slice(0, 50);
  const stats = SubscriptionService.getUserFullStats(userId);

  return res.json({
    user,
    subscription: sub,
    plan,
    usagePeriod,
    usageRecords,
    subscriptionHistory: history,
    recentAILogsCount: aiLogs.length,
    stats, // includes tokensUsed, pointsUsed (1pt=5tokens), messagesCount, voiceMinutes
  });
});

// 6. User Actions Endpoint
adminRouter.post('/users/:id/action', requireAdminAuth, (req: Request, res: Response) => {
  const userId = req.params.id;
  const { action, planId = 'premium', durationDays = 30, reason = '' } = req.body;
  const session = (req as any).adminSession;

  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    if (action === 'grant_premium' || action === 'change_plan') {
      const sub = SubscriptionService.grantManualPremium(userId, planId, Number(durationDays) || 30, session.adminId, session.email);
      realtimeSyncService.broadcast('subscription_updated', { userId, planId, sub });
      return res.json({ success: true, message: `Successfully updated user plan to ${planId}`, subscription: sub });
    }

    if (action === 'suspend') {
      user.status = 'suspended';
      db.upsertUser(user);
      db.addAuditLog({
        adminId: session.adminId,
        adminEmail: session.email,
        action: 'SUSPEND_USER',
        targetUserId: userId,
        details: `Suspended account for user ${user.email}. Reason: ${reason || 'None provided'}`,
      });
      realtimeSyncService.broadcast('user_updated', { userId, status: 'suspended' });
      return res.json({ success: true, message: `User ${user.email} suspended successfully.` });
    }

    if (action === 'reactivate') {
      user.status = 'active';
      db.upsertUser(user);
      db.addAuditLog({
        adminId: session.adminId,
        adminEmail: session.email,
        action: 'REACTIVATE_USER',
        targetUserId: userId,
        details: `Reactivated account for user ${user.email}.`,
      });
      realtimeSyncService.broadcast('user_updated', { userId, status: 'active' });
      return res.json({ success: true, message: `User ${user.email} reactivated successfully.` });
    }

    if (action === 'reset_usage') {
      const period = SubscriptionService.getCurrentPeriod();
      db.resetUserUsage(userId, period);
      db.addAuditLog({
        adminId: session.adminId,
        adminEmail: session.email,
        action: 'RESET_USER_USAGE',
        targetUserId: userId,
        details: `Reset usage counters for user ${user.email} for period ${period}.`,
      });
      realtimeSyncService.broadcast('user_usage_reset', { userId, period });
      return res.json({ success: true, message: `Usage reset for user ${user.email}.` });
    }

    if (action === 'cancel_subscription') {
      const sub = db.getSubscriptionByUserId(userId);
      if (sub) {
        sub.status = 'cancelled';
        db.upsertSubscription(sub);
        db.addSubscriptionHistory({
          userId,
          subscriptionId: sub.id,
          planId: sub.planId,
          action: 'admin_cancelled',
          status: 'cancelled',
          performedBy: session.adminId,
          details: `Subscription cancelled by admin ${session.email}.`,
        });
      }
      realtimeSyncService.broadcast('subscription_updated', { userId, status: 'cancelled' });
      return res.json({ success: true, message: 'Subscription cancelled.' });
    }

    return res.status(400).json({ error: 'Invalid action provided' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Action failed';
    return res.status(500).json({ error: errorMsg });
  }
});

// 7. Plans Management
adminRouter.get('/plans', requireAdminAuth, (req: Request, res: Response) => {
  return res.json(db.getPlans());
});

adminRouter.post('/plans', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const { id, name, description, monthlyPrice, yearlyPrice, currency = 'USD', limits, features } = req.body;
  const session = (req as any).adminSession;

  if (!id || !name) {
    return res.status(400).json({ error: 'Plan ID and Name are required' });
  }

  const existing = db.findPlanById(id);
  if (existing) {
    return res.status(400).json({ error: 'A plan with this ID already exists.' });
  }

  const newPlan: PlanEntity = {
    id: id.toLowerCase().replace(/\s+/g, '_'),
    name,
    description: description || '',
    monthlyPrice: Number(monthlyPrice) || 0,
    yearlyPrice: Number(yearlyPrice) || 0,
    currency,
    active: true,
    icon: req.body.icon || 'Sparkles',
    badgeText: req.body.badgeText || '',
    highlightColor: req.body.highlightColor || 'indigo',
    targetRegions: Array.isArray(req.body.targetRegions) ? req.body.targetRegions : ['ALL'],
    featuresList: Array.isArray(req.body.featuresList) ? req.body.featuresList : [],
    unlockedFeatureIds: Array.isArray(req.body.unlockedFeatureIds) ? req.body.unlockedFeatureIds : [],
    features: Array.isArray(features) ? features : ['ai_basic'],
    limits: limits || {
      ai_messages_per_month: 100,
      voice_minutes_per_month: 30,
      multi_ai_requests_per_month: 10,
      advanced_ai_requests_per_month: 20,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.upsertPlan(newPlan);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'CREATE_PLAN',
    details: `Created new subscription plan: '${name}' (${newPlan.id}).`,
  });

  realtimeSyncService.broadcast('plans_updated', { plan: newPlan });

  return res.json(newPlan);
});

adminRouter.put('/plans/:id', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const planId = req.params.id;
  const plan = db.findPlanById(planId);
  const session = (req as any).adminSession;

  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const {
    name,
    description,
    monthlyPrice,
    yearlyPrice,
    currency,
    active,
    features,
    featuresList,
    icon,
    badgeText,
    highlightColor,
    targetRegions,
    unlockedFeatureIds,
    limits,
  } = req.body;

  const updatedPlan: PlanEntity = {
    ...plan,
    name: name !== undefined ? name : plan.name,
    description: description !== undefined ? description : plan.description,
    monthlyPrice: monthlyPrice !== undefined ? Number(monthlyPrice) : plan.monthlyPrice,
    yearlyPrice: yearlyPrice !== undefined ? Number(yearlyPrice) : plan.yearlyPrice,
    currency: currency || plan.currency,
    active: active !== undefined ? Boolean(active) : plan.active,
    icon: icon !== undefined ? icon : plan.icon,
    badgeText: badgeText !== undefined ? badgeText : plan.badgeText,
    highlightColor: highlightColor !== undefined ? highlightColor : plan.highlightColor,
    targetRegions: Array.isArray(targetRegions) ? targetRegions : plan.targetRegions,
    featuresList: Array.isArray(featuresList) ? featuresList : plan.featuresList,
    unlockedFeatureIds: Array.isArray(unlockedFeatureIds) ? unlockedFeatureIds : plan.unlockedFeatureIds,
    features: Array.isArray(features) ? features : plan.features,
    limits: limits ? { ...plan.limits, ...limits } : plan.limits,
    updatedAt: new Date().toISOString(),
  };

  db.upsertPlan(updatedPlan);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_PLAN',
    details: `Updated plan '${planId}' configuration, regions, and features.`,
  });

  realtimeSyncService.broadcast('plans_updated', { plan: updatedPlan });

  return res.json(updatedPlan);
});

// Admin Receipts / Payment Requests
adminRouter.get('/receipts', requireAdminAuth, (req: Request, res: Response) => {
  const receipts = db.getPaymentReceipts();
  return res.json(receipts);
});

adminRouter.post('/receipts/:id/status', requireAdminAuth, (req: Request, res: Response) => {
  const receiptId = req.params.id;
  const { status, rejectionReason } = req.body;
  const session = (req as any).adminSession;

  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  const receipt = db.updatePaymentReceiptStatus(receiptId, status, rejectionReason, session.email);
  if (!receipt) {
    return res.status(404).json({ error: 'Receipt request not found' });
  }

  // If approved, automatically activate subscription for the user
  if (status === 'approved') {
    const daysToAdd = receipt.billingCycle === 'yearly' ? 365 : 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const sub = db.upsertSubscription({
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      userId: receipt.userId,
      planId: receipt.planId,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: true,
      paymentProvider: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    db.addSubscriptionHistory({
      userId: receipt.userId,
      subscriptionId: sub.id,
      planId: receipt.planId,
      action: 'APPROVED_MANUAL_RECEIPT',
      status: 'active',
      details: `Approved receipt '${receipt.transactionReference}' for plan '${receipt.planName}' by ${session.email}`,
      performedBy: session.email,
    });

    realtimeSyncService.broadcast('subscription_updated', { userId: receipt.userId, planId: receipt.planId, status: 'active' });
  }

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: status === 'approved' ? 'APPROVE_PAYMENT_RECEIPT' : 'REJECT_PAYMENT_RECEIPT',
    details: `${status.toUpperCase()} payment receipt (${receipt.transactionReference}) for user ${receipt.userEmail}.`,
  });

  realtimeSyncService.broadcast('receipts_updated', receipt);

  return res.json({ success: true, receipt });
});

// 8. Subscriptions List
adminRouter.get('/subscriptions', requireAdminAuth, (req: Request, res: Response) => {
  const { status = '', search = '' } = req.query;
  let subs = db.getSubscriptions();
  const users = db.getUsers();
  const plans = db.getPlans();

  if (status) {
    subs = subs.filter((s) => s.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    subs = subs.filter((s) => {
      const u = users.find((usr) => usr.id === s.userId);
      return (
        s.userId.toLowerCase().includes(q) ||
        (u && (u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)))
      );
    });
  }

  const formatted = subs.map((s) => {
    const u = users.find((usr) => usr.id === s.userId);
    const p = plans.find((pln) => pln.id === s.planId);
    return {
      ...s,
      userName: u?.name || 'Unknown User',
      userEmail: u?.email || s.userId,
      planName: p?.name || s.planId,
      monthlyPrice: p?.monthlyPrice || 0,
      currency: p?.currency || 'USD',
    };
  });

  return res.json(formatted);
});

// 9. AI Usage & Provider Analytics
adminRouter.get('/usage', requireAdminAuth, (req: Request, res: Response) => {
  const logs = db.getAIUsageLogs();
  const recentLogs = logs.slice(0, 100);

  const byProvider: Record<string, { requests: number; cost: number }> = {};
  logs.forEach((l) => {
    if (!byProvider[l.provider]) {
      byProvider[l.provider] = { requests: 0, cost: 0 };
    }
    byProvider[l.provider].requests += 1;
    byProvider[l.provider].cost += l.estimatedCost || 0;
  });

  return res.json({
    totalLogsCount: logs.length,
    recentLogs,
    byProvider,
  });
});

// 10. AI Providers Config
adminRouter.get('/providers', requireAdminAuth, (req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json(settings.providers);
});

adminRouter.post('/providers', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const { provider, enabled, model } = req.body;
  const session = (req as any).adminSession;
  const settings = db.getSettings();

  if (!provider || !settings.providers[provider as keyof typeof settings.providers]) {
    return res.status(400).json({ error: 'Invalid AI provider specified' });
  }

  const updatedProviders = {
    ...settings.providers,
    [provider]: {
      ...settings.providers[provider as keyof typeof settings.providers],
      enabled: enabled !== undefined ? Boolean(enabled) : settings.providers[provider as keyof typeof settings.providers].enabled,
      model: model || settings.providers[provider as keyof typeof settings.providers].model,
    },
  };

  db.updateSettings({ providers: updatedProviders });

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_AI_PROVIDER',
    details: `Updated AI Provider '${provider}' config: enabled=${enabled}, model=${model}.`,
  });

  realtimeSyncService.broadcast('providers_updated', updatedProviders);

  return res.json(updatedProviders);
});

// 11. Audit Logs Endpoint
adminRouter.get('/audit-logs', requireAdminAuth, (req: Request, res: Response) => {
  const logs = db.getAdminAuditLogs();
  return res.json(logs);
});

// 12. Settings & System Feature Flags
adminRouter.get('/settings', requireAdminAuth, (req: Request, res: Response) => {
  return res.json(db.getSettings());
});

adminRouter.put('/settings', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const {
    maintenanceMode,
    newRegistrationsEnabled,
    defaultPlan,
    multiAIEnabled,
    voiceEnabled,
    authMethods,
    privateCandidVisibility,
    maritalSupportVisibility,
    subscriptionUpgradeVisibility,
  } = req.body;
  const session = (req as any).adminSession;

  const updated = db.updateSettings({
    maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
    newRegistrationsEnabled: newRegistrationsEnabled !== undefined ? Boolean(newRegistrationsEnabled) : undefined,
    defaultPlan: defaultPlan || undefined,
    multiAIEnabled: multiAIEnabled !== undefined ? Boolean(multiAIEnabled) : undefined,
    voiceEnabled: voiceEnabled !== undefined ? Boolean(voiceEnabled) : undefined,
    authMethods: authMethods || undefined,
    privateCandidVisibility: privateCandidVisibility || undefined,
    maritalSupportVisibility: maritalSupportVisibility || undefined,
    subscriptionUpgradeVisibility: subscriptionUpgradeVisibility || undefined,
  });

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_SYSTEM_SETTINGS',
    details: 'Updated global system settings and feature flags.',
  });

  realtimeSyncService.broadcast('settings_updated', updated);

  return res.json(updated);
});

// 13. Secure Admin Credentials Update
adminRouter.post('/change-credentials', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const { newEmail, newPassword } = req.body;
  const session = (req as any).adminSession;

  if (!newEmail || !newPassword) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة السر الجديدة مطلوبان' });
  }

  db.updateSettings({
    superAdminEmail: newEmail.trim().toLowerCase(),
    superAdminPassword: newPassword,
  });

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'CHANGE_ADMIN_CREDENTIALS',
    details: `Changed super admin email to ${newEmail} and updated password securely.`,
  });

  return res.json({ success: true, message: 'تم تحديث بيانات دخول المسؤول بنجاح' });
});

// 14. Assistants & Managers Management
adminRouter.get('/assistants', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const assistants = db.getUsers().filter((u) => u.role === 'admin' || u.role === 'assistant');
  return res.json(assistants);
});

adminRouter.post('/assistants', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const { email, password, name, permissions } = req.body;
  const session = (req as any).adminSession;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'الاسم، البريد الإلكتروني، وكلمة المرور مطلوبة' });
  }

  const newAssistant: UserEntity = {
    id: `adm_assist_${Date.now().toString(36)}`,
    email: email.trim().toLowerCase(),
    passwordHash: password,
    name: name.trim(),
    role: 'assistant',
    status: 'active',
    permissions: Array.isArray(permissions) ? permissions : ['users_view', 'stats_view'],
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  db.upsertUser(newAssistant);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'ADD_ASSISTANT_ADMIN',
    details: `Added new assistant admin: ${name} (${email}).`,
  });

  return res.json(newAssistant);
});

adminRouter.delete('/assistants/:id', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const assistantId = req.params.id;
  const session = (req as any).adminSession;

  db.deleteUser(assistantId);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'DELETE_ASSISTANT_ADMIN',
    details: `Removed assistant admin ID: ${assistantId}.`,
  });

  return res.json({ success: true, message: 'تم حذف المساعد بنجاح' });
});

// 15. Payment Methods Management (طرق الدفع)
adminRouter.get('/payment-methods', requireAdminAuth, (req: Request, res: Response) => {
  return res.json(db.getPaymentMethods());
});

adminRouter.post('/payment-methods', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const { type, title, accountNumberOrDetails, accountHolder, instructions, enabled = true } = req.body;
  const session = (req as any).adminSession;

  if (!type || !title || !accountNumberOrDetails) {
    return res.status(400).json({ error: 'نوع طريقة الدفع، العنوان، وتفاصيل الحساب مطلوبة' });
  }

  const newPm = {
    id: `pm_${type}_${Date.now().toString(36)}`,
    type: type as 'bank' | 'wallet' | 'card',
    title: title.trim(),
    accountNumberOrDetails: accountNumberOrDetails.trim(),
    accountHolder: accountHolder ? accountHolder.trim() : undefined,
    instructions: instructions ? instructions.trim() : undefined,
    enabled: Boolean(enabled),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.upsertPaymentMethod(newPm);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'ADD_PAYMENT_METHOD',
    details: `Added new payment method: ${title} (${type}).`,
  });

  realtimeSyncService.broadcast('payment_methods_updated', newPm);

  return res.json(newPm);
});

adminRouter.put('/payment-methods/:id', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const pmId = req.params.id;
  const session = (req as any).adminSession;
  const methods = db.getPaymentMethods();
  const existing = methods.find((p) => p.id === pmId);

  if (!existing) {
    return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
  }

  const { type, title, accountNumberOrDetails, accountHolder, instructions, enabled } = req.body;

  const updatedPm = {
    ...existing,
    type: type || existing.type,
    title: title !== undefined ? title.trim() : existing.title,
    accountNumberOrDetails: accountNumberOrDetails !== undefined ? accountNumberOrDetails.trim() : existing.accountNumberOrDetails,
    accountHolder: accountHolder !== undefined ? accountHolder.trim() : existing.accountHolder,
    instructions: instructions !== undefined ? instructions.trim() : existing.instructions,
    enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
    updatedAt: new Date().toISOString(),
  };

  db.upsertPaymentMethod(updatedPm);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_PAYMENT_METHOD',
    details: `Updated payment method '${existing.title}' (${pmId}).`,
  });

  realtimeSyncService.broadcast('payment_methods_updated', updatedPm);

  return res.json(updatedPm);
});

adminRouter.delete('/payment-methods/:id', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const pmId = req.params.id;
  const session = (req as any).adminSession;

  db.deletePaymentMethod(pmId);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'DELETE_PAYMENT_METHOD',
    details: `Deleted payment method ID: ${pmId}.`,
  });

  realtimeSyncService.broadcast('payment_methods_updated', { deletedId: pmId });

  return res.json({ success: true, message: 'تم حذف طريقة الدفع بنجاح' });
});

// ==========================================
// 8. Dynamic Feature Management & Entitlements
// ==========================================

// Get all feature flags and rules
adminRouter.get('/features', requireAdminAuth, (req: Request, res: Response) => {
  const features = db.getFeatures();
  return res.json(features);
});

// Update or configure a specific feature flag
adminRouter.put('/features/:id', requireAdminAuth, (req: Request, res: Response) => {
  const featureId = req.params.id;
  const session = (req as any).adminSession;
  const existing = db.findFeatureById(featureId);

  if (!existing) {
    return res.status(404).json({ error: 'الميزة المطلوبة غير موجودة في النظام' });
  }

  const {
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    category,
    icon,
    targetAudience,
    specificUsers,
    allowedPlans,
    deviceTarget,
    languageTarget,
    customBadge,
    customBadgeText,
    progressiveDisclosure,
    timeWindow,
    lockedBehavior,
    customLockTitle,
    customLockMessage,
    maintenanceMessage,
  } = req.body;

  const updatedFeature = {
    ...existing,
    nameAr: nameAr !== undefined ? nameAr.trim() : existing.nameAr,
    nameEn: nameEn !== undefined ? nameEn.trim() : existing.nameEn,
    descriptionAr: descriptionAr !== undefined ? descriptionAr.trim() : existing.descriptionAr,
    descriptionEn: descriptionEn !== undefined ? descriptionEn.trim() : existing.descriptionEn,
    category: category || existing.category,
    icon: icon || existing.icon,
    targetAudience: targetAudience || existing.targetAudience,
    specificUsers: Array.isArray(specificUsers)
      ? specificUsers.map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : existing.specificUsers,
    allowedPlans: Array.isArray(allowedPlans) ? allowedPlans : existing.allowedPlans,
    deviceTarget: deviceTarget || existing.deviceTarget || 'all',
    languageTarget: languageTarget || existing.languageTarget || 'all',
    customBadge: customBadge || existing.customBadge || 'none',
    customBadgeText: customBadgeText !== undefined ? customBadgeText.trim() : existing.customBadgeText,
    progressiveDisclosure: progressiveDisclosure
      ? {
          enabled: Boolean(progressiveDisclosure.enabled),
          minAccountAgeDays: Number(progressiveDisclosure.minAccountAgeDays) || 0,
          minMessagesSent: Number(progressiveDisclosure.minMessagesSent) || 0,
          minCompletedTasks: Number(progressiveDisclosure.minCompletedTasks) || 0,
        }
      : existing.progressiveDisclosure,
    timeWindow: timeWindow
      ? {
          enabled: Boolean(timeWindow.enabled),
          startDate: timeWindow.startDate || null,
          endDate: timeWindow.endDate || null,
        }
      : existing.timeWindow,
    lockedBehavior: lockedBehavior || existing.lockedBehavior,
    customLockTitle: customLockTitle !== undefined ? customLockTitle.trim() : existing.customLockTitle,
    customLockMessage: customLockMessage !== undefined ? customLockMessage.trim() : existing.customLockMessage,
    maintenanceMessage: maintenanceMessage !== undefined ? maintenanceMessage.trim() : existing.maintenanceMessage,
    updatedAt: new Date().toISOString(),
  };

  db.upsertFeature(updatedFeature);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_FEATURE_RULE',
    details: `Updated rule for feature '${updatedFeature.nameAr}' (${featureId}) -> Audience: ${updatedFeature.targetAudience}, Plans: ${updatedFeature.allowedPlans?.join(',') || 'all'}.`,
  });

  // Broadcast real-time sync across connected users
  realtimeSyncService.broadcast('features_updated', {
    feature: updatedFeature,
    allFeatures: db.getFeatures(),
    timestamp: Date.now(),
  });

  return res.json(updatedFeature);
});

// Reset all features to factory defaults
adminRouter.post('/features/reset-defaults', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  const resetList = db.updateAllFeatures(db.getFeatures().map((f) => {
    return {
      ...f,
      targetAudience: 'everyone',
      specificUsers: [],
      allowedPlans: ['all'],
      progressiveDisclosure: { enabled: false, minAccountAgeDays: 0, minMessagesSent: 0, minCompletedTasks: 0 },
      timeWindow: { enabled: false, startDate: null, endDate: null },
      lockedBehavior: 'badge_lock',
    };
  }));

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'RESET_FEATURE_RULES',
    details: 'Reset all feature rules to factory defaults (Available to everyone).',
  });

  realtimeSyncService.broadcast('features_updated', {
    allFeatures: resetList,
    timestamp: Date.now(),
  });

  return res.json({ success: true, features: resetList });
});

// Simulator endpoint: Test how features are evaluated for any hypothetical user context
adminRouter.post('/features/simulate', requireAdminAuth, (req: Request, res: Response) => {
  const { userId, email, planId, accountCreatedAt, messagesCount, tasksCompletedCount } = req.body;
  const evaluated = db.evaluateAllFeatures({
    userId,
    email,
    planId: planId || 'free',
    accountCreatedAt,
    messagesCount: Number(messagesCount) || 0,
    tasksCompletedCount: Number(tasksCompletedCount) || 0,
  });

  return res.json({
    context: { userId, email, planId, accountCreatedAt, messagesCount, tasksCompletedCount },
    evaluation: evaluated,
  });
});
