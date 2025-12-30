import { Router } from 'express';
import { SdkController } from '../controllers/sdkController';
import { ensureSdkAuth } from '../middleware/sdkAuthMiddleware';

const router = Router();

// Public SDK API (requires API Token)
router.get('/prompts/:key', ensureSdkAuth, SdkController.getPromptByKey);

export default router;
