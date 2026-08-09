import { db } from '../../db/database.js';
import { SubscriptionService } from '../subscriptionService.js';

export interface PaymentIntentOptions {
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  currency: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface IPaymentProvider {
  name: string;
  createCheckoutSession(options: PaymentIntentOptions): Promise<PaymentResult>;
  cancelSubscription(externalSubscriptionId: string): Promise<boolean>;
  processWebhookEvent(payload: any, signature?: string): Promise<{ handled: boolean; message: string }>;
}

export class StripePaymentProvider implements IPaymentProvider {
  public name = 'stripe';

  async createCheckoutSession(options: PaymentIntentOptions): Promise<PaymentResult> {
    const plan = db.findPlanById(options.planId);
    if (!plan) {
      return { success: false, error: 'Invalid plan ID' };
    }

    // Abstracted session creation logic
    const sessionToken = 'cs_test_' + Math.random().toString(36).substring(2, 12);
    return {
      success: true,
      transactionId: sessionToken,
      checkoutUrl: `/checkout-simulated?session_id=${sessionToken}&planId=${options.planId}&userId=${options.userId}`,
    };
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<boolean> {
    console.log(`[StripePaymentProvider] Cancelling Stripe subscription ${externalSubscriptionId}`);
    return true;
  }

  async processWebhookEvent(payload: any): Promise<{ handled: boolean; message: string }> {
    const { type, data } = payload || {};
    if (type === 'payment_intent.succeeded' || type === 'customer.subscription.created') {
      const { userId, planId, durationDays = 30 } = data?.object?.metadata || {};
      if (userId && planId) {
        SubscriptionService.grantManualPremium(userId, planId, Number(durationDays) || 30, 'webhook_stripe', 'system@stripe.webhook');
        return { handled: true, message: `Successfully processed Stripe subscription event for user ${userId}` };
      }
    }
    return { handled: false, message: 'Unhandled or unrecognised Stripe event structure' };
  }
}

export class GooglePlayPaymentProvider implements IPaymentProvider {
  public name = 'google_play';

  async createCheckoutSession(options: PaymentIntentOptions): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: 'inapp_gp_' + Math.random().toString(36).substring(2, 10),
    };
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<boolean> {
    return true;
  }

  async processWebhookEvent(payload: any): Promise<{ handled: boolean; message: string }> {
    return { handled: true, message: 'Google Play billing event received' };
  }
}

export class ApplePayPaymentProvider implements IPaymentProvider {
  public name = 'apple';

  async createCheckoutSession(options: PaymentIntentOptions): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: 'inapp_apple_' + Math.random().toString(36).substring(2, 10),
    };
  }

  async cancelSubscription(externalSubscriptionId: string): Promise<boolean> {
    return true;
  }

  async processWebhookEvent(payload: any): Promise<{ handled: boolean; message: string }> {
    return { handled: true, message: 'Apple StoreKit billing event received' };
  }
}

export class PaymentGatewayManager {
  private static providers: Map<string, IPaymentProvider> = new Map([
    ['stripe', new StripePaymentProvider()],
    ['google_play', new GooglePlayPaymentProvider()],
    ['apple', new ApplePayPaymentProvider()],
  ]);

  public static getProvider(name: string): IPaymentProvider | undefined {
    return this.providers.get(name);
  }
}
