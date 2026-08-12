import { Router, Request, Response, NextFunction } from 'express';
import { db, UserEntity, PlanEntity } from '../db/database.js';
import { SubscriptionService } from '../services/subscriptionService.js';

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

  // Verify Admin credentials
  const defaultAdmin = db.findUserByEmail('admin@rafiq.ai') || db.getUsers().find((u) => u.role === 'super_admin');
  
  if (
    (email.toLowerCase() === 'admin@rafiq.ai' && password === 'AdminSecret2026!') ||
    (defaultAdmin && defaultAdmin.email.toLowerCase() === email.toLowerCase() && password === 'AdminSecret2026!')
  ) {
    const adminUser = defaultAdmin || {
      id: 'admin_super_01',
      email: 'admin@rafiq.ai',
      name: 'Super Admin',
      role: 'super_admin' as const,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      currency: 'USD',
    };

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
      details: 'Admin logged into Admin Panel successfully.',
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
      },
    });
  }

  return res.status(401).json({ error: 'Invalid admin credentials' });
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

// 4. Users List (Paginated & Searchable)
adminRouter.get('/users', requireAdminAuth, (req: Request, res: Response) => {
  const { search = '', plan = '', status = '', page = '1', limit = '10' } = req.query;

  let users = db.getUsers();
  const subscriptions = db.getSubscriptions();
  const plans = db.getPlans();

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
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
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

  return res.json({
    user,
    subscription: sub,
    plan,
    usagePeriod,
    usageRecords,
    subscriptionHistory: history,
    recentAILogsCount: aiLogs.length,
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

  return res.json(newPlan);
});

adminRouter.put('/plans/:id', requireAdminAuth, requireSuperAdmin, (req: Request, res: Response) => {
  const planId = req.params.id;
  const plan = db.findPlanById(planId);
  const session = (req as any).adminSession;

  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const { name, description, monthlyPrice, yearlyPrice, currency, active, features, limits } = req.body;

  const updatedPlan: PlanEntity = {
    ...plan,
    name: name !== undefined ? name : plan.name,
    description: description !== undefined ? description : plan.description,
    monthlyPrice: monthlyPrice !== undefined ? Number(monthlyPrice) : plan.monthlyPrice,
    yearlyPrice: yearlyPrice !== undefined ? Number(yearlyPrice) : plan.yearlyPrice,
    currency: currency || plan.currency,
    active: active !== undefined ? Boolean(active) : plan.active,
    features: Array.isArray(features) ? features : plan.features,
    limits: limits ? { ...plan.limits, ...limits } : plan.limits,
    updatedAt: new Date().toISOString(),
  };

  db.upsertPlan(updatedPlan);

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_PLAN',
    details: `Updated plan '${planId}' configuration and limits.`,
  });

  return res.json(updatedPlan);
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
  const { maintenanceMode, newRegistrationsEnabled, defaultPlan, multiAIEnabled, voiceEnabled } = req.body;
  const session = (req as any).adminSession;

  const updated = db.updateSettings({
    maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
    newRegistrationsEnabled: newRegistrationsEnabled !== undefined ? Boolean(newRegistrationsEnabled) : undefined,
    defaultPlan: defaultPlan || undefined,
    multiAIEnabled: multiAIEnabled !== undefined ? Boolean(multiAIEnabled) : undefined,
    voiceEnabled: voiceEnabled !== undefined ? Boolean(voiceEnabled) : undefined,
  });

  db.addAuditLog({
    adminId: session.adminId,
    adminEmail: session.email,
    action: 'UPDATE_SYSTEM_SETTINGS',
    details: 'Updated global system settings and feature flags.',
  });

  return res.json(updated);
});
