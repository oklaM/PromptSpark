import { Request, Response } from 'express';
import { PromptModel, CreatePromptDTO } from '../models/Prompt';
import { PromptVersionModel } from '../models/PromptVersion';
import { PermissionModel } from '../models/Permission';

export class PromptController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePromptDTO = req.body;
      const currentUser = (req as any).user;

      // Use authenticated user as author
      if (currentUser) {
        data.author = currentUser.username;
      }
      
      const prompt = await PromptModel.create(data);

      // Automatically grant owner permission if created by a user
      if (currentUser) {
        await PermissionModel.grant(prompt.id, currentUser.id, 'owner', currentUser.id);
      }

      res.status(201).json({
        success: true,
        data: prompt,
        message: 'Prompt created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create prompt'
      });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PromptModel.incrementViews(id);
      const prompt = await PromptModel.getById(id);

      if (!prompt) {
        res.status(404).json({
          success: false,
          message: 'Prompt not found'
        });
        return;
      }

      res.json({
        success: true,
        data: prompt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get prompt'
      });
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await PromptModel.getAll(page, limit);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get prompts'
      });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<CreatePromptDTO> = req.body;
      
      // Ensure only the author (or authorized user) can update
      const existingPrompt = await PromptModel.getById(id);
      if (!existingPrompt) {
        res.status(404).json({ success: false, message: 'Prompt not found' });
        return;
      }

      const currentUser = (req as any).user;
      if (currentUser && existingPrompt.author === 'Anonymous') {
          // Claim the prompt
          await PromptModel.claim(id, currentUser.username);
          // Grant owner permission
          await PermissionModel.grant(id, currentUser.id, 'owner', currentUser.id);
      } else if (currentUser && existingPrompt.author !== currentUser.username) {
          // Check for editor permission
          const hasPermission = await PermissionModel.check(id, currentUser.id, ['owner', 'editor']);
          if (!hasPermission) {
            res.status(403).json({ success: false, message: 'No permission to update this prompt' });
            return;
          }
      }

      const updatedPrompt = await PromptModel.update(id, data, currentUser?.username || req.body.author);

      res.json({
        success: true,
        data: updatedPrompt,
        message: 'Prompt updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update prompt'
      });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PromptModel.delete(id);

      res.json({
        success: true,
        message: 'Prompt deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete prompt'
      });
    }
  }

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, category, tags } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
        return;
      }

      const tagArray = typeof tags === 'string' ? tags.split(',') : (tags as string[]) || [];
      const results = await PromptModel.search(
        query as string,
        category as string,
        tagArray
      );

      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search prompts'
      });
    }
  }

  static async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { liked } = req.body;

      await PromptModel.toggleLike(id, liked);
      const prompt = await PromptModel.getById(id);

      res.json({
        success: true,
        data: prompt,
        message: 'Like status updated'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update like status'
      });
    }
  }

  static async exportPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { ids, format } = req.query;
      const idArray = typeof ids === 'string' ? ids.split(',') : (ids as string[]) || [];
      const prompts = await PromptModel.exportPrompts(idArray.length ? idArray : undefined);

      const fmt = (format as string) || 'json';
      if (fmt === 'csv') {
        // build CSV
        const header = ['id', 'title', 'description', 'content', 'category', 'author', 'isPublic', 'tags', 'createdAt', 'updatedAt'];
        const rows = prompts.map(p => header.map(h => {
          if (h === 'tags') return `"${(p.tags || []).join(';')}"`;
          const v = (p as any)[h];
          return `"${String(v ?? '')}"`;
        }).join(','));
        const csv = [header.join(','), ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
        return;
      }
      if (fmt === 'md' || fmt === 'markdown') {
        const md = prompts.map(p => `## ${p.title}\n\n${p.description || ''}\n\n\`\`\`prompt\n${p.content}\n\`\`\`\n\nTags: ${(p.tags || []).join(', ')}\n\n---`).join('\n\n');
        res.setHeader('Content-Type', 'text/markdown');
        res.send(md);
        return;
      }

      res.json({ success: true, data: prompts });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to export prompts' });
    }
  }

  static async importPrompts(req: Request, res: Response): Promise<void> {
    try {
      const items = req.body.items as CreatePromptDTO[];
      if (!items || !Array.isArray(items)) {
        res.status(400).json({ success: false, message: 'items array required in body' });
        return;
      }
      const created = await PromptModel.importPrompts(items);
      res.status(201).json({ success: true, data: created, message: 'Imported prompts' });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to import prompts' });
    }
  }

  static async bulkAction(req: Request, res: Response): Promise<void> {
    try {
      const { action, ids, isPublic } = req.body;
      if (!action || !ids || !Array.isArray(ids)) {
        res.status(400).json({ success: false, message: 'action and ids[] required' });
        return;
      }

      if (action === 'delete') {
        await PromptModel.bulkDelete(ids);
      } else if (action === 'publish') {
        await PromptModel.bulkUpdatePublish(ids, true);
      } else if (action === 'unpublish') {
        await PromptModel.bulkUpdatePublish(ids, false);
      } else {
        res.status(400).json({ success: false, message: 'unsupported action' });
        return;
      }

      res.json({ success: true, message: 'Bulk action completed' });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to perform bulk action' });
    }
  }

  static async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { author } = req.body;
      const dup = await PromptModel.duplicate(id, author);
      res.status(201).json({ success: true, data: dup, message: 'Prompt duplicated' });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to duplicate prompt' });
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const history = await PromptVersionModel.getHistory(id);
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to get history' });
    }
  }

  static async revert(req: Request, res: Response): Promise<void> {
    try {
      const { id, version } = req.params;
      const verNum = parseInt(version);
      const targetVersion = await PromptVersionModel.getVersion(id, verNum);

      if (!targetVersion) {
        res.status(404).json({ success: false, message: 'Version not found' });
        return;
      }

      // Update prompt with version data
      const updated = await PromptModel.update(id, {
        title: targetVersion.title,
        description: targetVersion.description,
        content: targetVersion.content,
        category: targetVersion.category,
        tags: targetVersion.tags
      }, `Reverted to v${verNum}`);

      res.json({ success: true, data: updated, message: `Reverted to version ${verNum}` });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to revert' });
    }
  }
}
