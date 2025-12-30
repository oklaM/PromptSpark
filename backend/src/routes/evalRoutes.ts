import { Router } from 'express';
import { EvalController } from '../controllers/evalController';

const router = Router();

router.post('/evals', EvalController.create);
router.get('/prompts/:promptId/evals', EvalController.getByPromptId);
router.get('/prompts/:promptId/evals/stats', EvalController.getStats);

export default router;
