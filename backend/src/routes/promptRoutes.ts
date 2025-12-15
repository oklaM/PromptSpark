import { Router } from 'express';
import { PromptController } from '../controllers/promptController';

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

// Import/Export
router.get('/prompts/export', PromptController.exportPrompts);
router.post('/prompts/import', PromptController.importPrompts);

// Bulk operations
router.post('/prompts/bulk', PromptController.bulkAction);

// Duplicate
router.post('/prompts/:id/duplicate', PromptController.duplicate);

export default router;
