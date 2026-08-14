import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { SubscriptionService } from '../services/subscriptionService.js';
import { PaymentGatewayManager } from '../services/payment/PaymentProvider.js';
import { realtimeSyncService } from '../services/realtimeSyncService.js';

export const userSubscriptionRouter = Router();

// GET /api/user/subscription or /api/subscription/status
const handleGetSubscription = (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'user_default_01';
  
  const { user, subscription, plan } = SubscriptionService.getUserSubscription(userId);
  const period = SubscriptionService.getCurrentPeriod();

  const usageRecords = db.getUsageRecords().filter((r) => r.userId === userId && r.period === period);

  const usageMap: Record<string, number> = {
    ai_messages: 0,
    voice_minutes: 0,
    multi_ai: 0,
    advanced_ai: 0,
  };

  usageRecords.forEach((r) => {
    usageMap[r.feature] = r.count;
  });

  const stats = SubscriptionService.getUserFullStats(userId);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
    },
    subscription: {
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      paymentProvider: subscription.paymentProvider,
    },
    plan: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      features: plan.features,
      limits: plan.limits,
    },
    period,
    usage: usageMap,
    stats, // Comprehensive stats: tokens, points (1 pt = 5 tokens), messages, voice
  });
};

userSubscriptionRouter.get('/subscription', handleGetSubscription);
userSubscriptionRouter.get('/subscription/status', handleGetSubscription);
userSubscriptionRouter.get('/user/subscription', handleGetSubscription);

// GET /api/user/usage-stats (Dedicated Real-time Stats)
userSubscriptionRouter.get('/usage-stats', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'user_default_01';
  const stats = SubscriptionService.getUserFullStats(userId);
  const { plan } = SubscriptionService.getUserSubscription(userId);
  return res.json({
    success: true,
    userId,
    stats,
    plan: {
      id: plan.id,
      name: plan.name,
      limits: plan.limits,
    },
  });
});

// POST /api/user/record-voice-usage
userSubscriptionRouter.post('/record-voice-usage', (req: Request, res: Response) => {
  const userId = req.body.userId || (req.headers['x-user-id'] as string) || 'user_default_01';
  const durationSeconds = Number(req.body.seconds) || 5;

  // Record voice seconds in usage records
  SubscriptionService.recordUsage(userId, 'voice_seconds', durationSeconds);
  const minutes = Math.ceil(durationSeconds / 60);
  SubscriptionService.recordUsage(userId, 'voice_minutes', minutes);

  // Broadcast realtime sync
  realtimeSyncService.broadcast('subscription_updated', { userId, feature: 'voice_seconds', amount: durationSeconds });

  const stats = SubscriptionService.getUserFullStats(userId);
  return res.json({ success: true, stats });
});

// GET /api/user/plans or /api/subscription/plans or /api/plans
const handleGetPlans = (req: Request, res: Response) => {
  const publicPlans = db.getPlans().filter((p) => p.active);
  return res.json(publicPlans);
};

userSubscriptionRouter.get('/plans', handleGetPlans);
userSubscriptionRouter.get('/user/plans', handleGetPlans);
userSubscriptionRouter.get('/subscription/plans', handleGetPlans);

// GET /api/payment-methods
userSubscriptionRouter.get('/payment-methods', (req: Request, res: Response) => {
  const activeMethods = db.getPaymentMethods().filter((p) => p.enabled);
  return res.json(activeMethods);
});

// POST /api/user/checkout
userSubscriptionRouter.post('/checkout', async (req: Request, res: Response) => {
  const { userId = 'user_default_01', planId, billingCycle = 'monthly', provider = 'stripe' } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  const gateway = PaymentGatewayManager.getProvider(provider);
  if (!gateway) {
    return res.status(400).json({ error: `Payment provider ${provider} not supported.` });
  }

  const result = await gateway.createCheckoutSession({
    userId,
    planId,
    billingCycle,
    currency: 'USD',
  });

  realtimeSyncService.broadcast('subscription_updated', { userId, planId, result });

  return res.json(result);
});

// POST /api/webhooks/payment
userSubscriptionRouter.post('/webhooks/payment', async (req: Request, res: Response) => {
  const providerName = (req.query.provider as string) || 'stripe';
  const gateway = PaymentGatewayManager.getProvider(providerName);

  if (!gateway) {
    return res.status(400).json({ error: 'Unknown payment provider' });
  }

  const result = await gateway.processWebhookEvent(req.body, req.headers['stripe-signature'] as string);
  return res.json(result);
});
