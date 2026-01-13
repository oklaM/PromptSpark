/**
 * Payment Service Interface
 * Supports Stripe and LemonSqueezy payment providers
 */

import { SubscriptionModel } from '../models/Subscription';

export type PaymentProvider = 'stripe' | 'lemonsqueezy';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    storage: number;
    aiRequests: number;
  };
}

export type PlanType = 'pro' | 'team' | 'free';

// Define subscription plans
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: 9.99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      '1000 prompts storage',
      '100 AI optimizations per day',
      'Advanced search & filters',
      'Priority support',
      'Export to multiple formats'
    ],
    limits: {
      storage: 1000,
      aiRequests: 100
    }
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: 99.99,
    currency: 'USD',
    interval: 'yearly',
    features: [
      '1000 prompts storage',
      '100 AI optimizations per day',
      'Advanced search & filters',
      'Priority support',
      'Export to multiple formats',
      'Save 17% with yearly billing'
    ],
    limits: {
      storage: 1000,
      aiRequests: 100
    }
  },
  team_monthly: {
    id: 'team_monthly',
    name: 'Team Monthly',
    price: 49.99,
    currency: 'USD',
    interval: 'monthly',
    features: [
      'Everything in Pro',
      '10000 prompts storage',
      '1000 AI optimizations per day',
      'Team collaboration',
      'Admin dashboard',
      'Audit logs',
      'SSO (coming soon)'
    ],
    limits: {
      storage: 10000,
      aiRequests: 1000
    }
  }
};

export interface PaymentService {
  createCheckoutSession(userId: string, planId: string): Promise<{ checkoutUrl: string; sessionId: string }>;
  handleWebhook(event: any): Promise<void>;
  cancelSubscription(userId: string): Promise<void>;
  getSubscriptionStatus(userId: string): Promise<{ status: string; plan: string | null }>;
}

/**
 * Mock Payment Service for development/testing
 * In production, replace with actual Stripe/LemonSqueezy implementation
 */
class MockPaymentService implements PaymentService {
  async createCheckoutSession(userId: string, planId: string): Promise<{ checkoutUrl: string; sessionId: string }> {
    const sessionId = `mock_session_${Date.now()}`;
    const checkoutUrl = `https://mock.checkout.url/session/${sessionId}`;

    console.log(`[Mock Payment] Created checkout session for user ${userId}, plan ${planId}`);
    console.log(`[Mock Payment] Checkout URL: ${checkoutUrl}`);

    // Simulate successful payment after 2 seconds
    setTimeout(async () => {
      console.log(`[Mock Payment] Simulating successful payment for session ${sessionId}`);
      await this.activateSubscription(userId, planId);
    }, 2000);

    return { checkoutUrl, sessionId };
  }

  async handleWebhook(event: any): Promise<void> {
    console.log('[Mock Payment] Webhook received:', event.type);
    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const { userId, planId } = event.data;
        await this.activateSubscription(userId, planId);
        break;
      }
      case 'customer.subscription.deleted':
        await this.deactivateSubscription(event.data.userId);
        break;
      default:
        console.log('[Mock Payment] Unhandled webhook event:', event.type);
    }
  }

  async cancelSubscription(userId: string): Promise<void> {
    console.log(`[Mock Payment] Cancelling subscription for user ${userId}`);
    // Revert to free plan - we need to handle this case
    // For now, we'll manually update to free plan in the database
    const { database } = await import('../db/database');
    await database.run(
      'UPDATE subscriptions SET plan = ?, "storageLimit" = ?, "aiLimit" = ?, "updatedAt" = ? WHERE "userId" = ?',
      ['free', 50, 5, new Date().toISOString(), userId]
    );
  }

  async getSubscriptionStatus(userId: string): Promise<{ status: string; plan: string | null }> {
    const sub = await SubscriptionModel.getByUserId(userId);
    return {
      status: 'active', // Mock status
      plan: sub.plan
    };
  }

  private async activateSubscription(userId: string, planId: string): Promise<void> {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Determine plan type
    const planType: PlanType = planId.includes('team') ? 'team' : 'pro';

    // Update subscription
    await SubscriptionModel.upgradePlan(userId, planType);

    console.log(`[Mock Payment] Activated ${planType} subscription for user ${userId}`);
  }

  private async deactivateSubscription(userId: string): Promise<void> {
    // Manually update to free plan
    const { database } = await import('../db/database');
    await database.run(
      'UPDATE subscriptions SET plan = ?, "storageLimit" = ?, "aiLimit" = ?, "updatedAt" = ? WHERE "userId" = ?',
      ['free', 50, 5, new Date().toISOString(), userId]
    );
    console.log(`[Mock Payment] Deactivated subscription for user ${userId}`);
  }
}

// Export singleton instance
export const paymentService = new MockPaymentService();

/**
 * TODO: Implement Stripe Payment Service
 *
 * To use Stripe:
 * 1. Install stripe package: npm install stripe
 * 2. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env
 * 3. Replace MockPaymentService with StripePaymentService
 *
 * Example implementation:
 *
 * import Stripe from 'stripe';
 *
 * class StripePaymentService implements PaymentService {
 *   private stripe: Stripe;
 *
 *   constructor() {
 *     this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 *   }
 *
 *   async createCheckoutSession(userId: string, planId: string) {
 *     const plan = SUBSCRIPTION_PLANS[planId];
 *     const session = await this.stripe.checkout.sessions.create({
 *       payment_method_types: ['card'],
 *       line_items: [{
 *         price_data: {
 *           currency: plan.currency,
 *           product_data: { name: plan.name },
 *           unit_amount: Math.round(plan.price * 100),
 *           recurring: { interval: plan.interval },
 *         },
 *         quantity: 1,
 *       }],
 *       mode: 'subscription',
 *       success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
 *       cancel_url: `${process.env.FRONTEND_URL}/pricing`,
 *       metadata: { userId, planId },
 *     });
 *
 *     return {
 *       checkoutUrl: session.url!,
 *       sessionId: session.id,
 *     };
 *   }
 *
 *   // ... implement other methods
 * }
 */
