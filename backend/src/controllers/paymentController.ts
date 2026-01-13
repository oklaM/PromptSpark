import { Request, Response } from 'express';
import { paymentService, SUBSCRIPTION_PLANS } from '../services/paymentService';

export class PaymentController {
  /**
   * Get available subscription plans
   */
  static async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = Object.values(SUBSCRIPTION_PLANS);
      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get plans'
      });
    }
  }

  /**
   * Create checkout session for a plan
   */
  static async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { planId } = req.body;

      if (!planId) {
        res.status(400).json({
          success: false,
          message: 'planId is required'
        });
        return;
      }

      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan) {
        res.status(400).json({
          success: false,
          message: 'Invalid plan ID'
        });
        return;
      }

      const result = await paymentService.createCheckoutSession(user.id, planId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create checkout session'
      });
    }
  }

  /**
   * Get subscription status for current user
   */
  static async getSubscriptionStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const status = await paymentService.getSubscriptionStatus(user.id);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get subscription status'
      });
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await paymentService.cancelSubscription(user.id);

      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Handle webhook from payment provider
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;

      // Verify webhook signature (for Stripe)
      // const signature = req.headers['stripe-signature'];
      // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

      await paymentService.handleWebhook(event);

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Webhook processing failed'
      });
    }
  }
}
