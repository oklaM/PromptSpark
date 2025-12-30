import { Router } from 'express';
import { SdkController } from '../controllers/sdkController';
import { ensureAuth } from '../middleware/authMiddleware';

const router = Router();

// Token Management (requires Login)
router.get('/tokens', ensureAuth, SdkController.listTokens);
router.post('/tokens', ensureAuth, SdkController.createToken);
router.delete('/tokens/:id', ensureAuth, SdkController.revokeToken);

export default router;
