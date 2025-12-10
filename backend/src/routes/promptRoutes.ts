import { Router } from 'express';
import { PromptController } from '../controllers/promptController.js';

const router = Router();

// CRUD operations
router.post('/prompts', PromptController.create);
router.get('/prompts', PromptController.getAll);
router.get('/prompts/search', PromptController.search);
router.get('/prompts/:id', PromptController.getById);
router.put('/prompts/:id', PromptController.update);
router.delete('/prompts/:id', PromptController.delete);

// Like functionality
router.post('/prompts/:id/like', PromptController.toggleLike);

export default router;
