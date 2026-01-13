import { Router } from 'express';
import { AiController } from '../controllers/aiController';
import { ensureAuth } from '../middleware/authMiddleware';
import { checkAiQuota } from '../middleware/quotaMiddleware';

const router = Router();

router.post('/analyze', AiController.analyze);
router.post('/diagnose', ensureAuth, checkAiQuota, AiController.diagnose);
router.post('/optimize', ensureAuth, checkAiQuota, AiController.optimize);
router.post('/run', AiController.runPrompt);
router.get('/models', AiController.getModels);

export default router;
