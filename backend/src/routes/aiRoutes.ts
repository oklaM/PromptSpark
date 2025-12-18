import { Router } from 'express';
import { AiController } from '../controllers/aiController';

const router = Router();

router.post('/analyze', AiController.analyze);

export default router;
