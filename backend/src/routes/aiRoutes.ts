import { Router } from 'express';
import { AiController } from '../controllers/aiController';

const router = Router();

router.post('/analyze', AiController.analyze);
router.post('/diagnose', AiController.diagnose);
router.post('/run', AiController.runPrompt);
router.get('/models', AiController.getModels);

export default router;
