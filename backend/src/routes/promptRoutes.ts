import { Router } from 'express';
import { PromptController } from '../controllers/promptController';
import { ensureAuth } from '../middleware/authMiddleware';

const router = Router();

// CRUD operations
router.post('/prompts', ensureAuth, PromptController.create);
router.get('/prompts', PromptController.getAll);
router.get('/prompts/search', PromptController.search);
router.get('/prompts/export', PromptController.exportPrompts);
router.get('/prompts/:id', PromptController.getById);
router.put('/prompts/:id', ensureAuth, PromptController.update);
router.delete('/prompts/:id', ensureAuth, PromptController.delete);

// Like functionality
router.post('/prompts/:id/like', PromptController.toggleLike);

// Import/Export
router.post('/prompts/import', PromptController.importPrompts);

// Bulk operations
router.post('/prompts/bulk', PromptController.bulkAction);

// Duplicate
router.post('/prompts/:id/duplicate', PromptController.duplicate);

// Version History
router.get('/prompts/:id/history', PromptController.getHistory);
router.post('/prompts/:id/revert/:version', PromptController.revert);

export default router;
