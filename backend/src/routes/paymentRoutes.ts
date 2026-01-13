import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { ensureAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * Payment Routes
 * Base path: /api/payments
 */

// Get available subscription plans (public)
router.get('/plans', PaymentController.getPlans);

// Create checkout session (requires auth)
router.post('/checkout', ensureAuth, PaymentController.createCheckoutSession);

// Get current user's subscription status (requires auth)
router.get('/subscription', ensureAuth, PaymentController.getSubscriptionStatus);

// Cancel subscription (requires auth)
router.post('/subscription/cancel', ensureAuth, PaymentController.cancelSubscription);

// Webhook endpoint (for payment provider callbacks)
// Note: This should NOT have auth middleware as it's called by the payment provider
router.post('/webhook', PaymentController.handleWebhook);

export default router;
