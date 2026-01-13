import { Request, Response } from 'express';
import { PromptModel, CreatePromptDTO } from '../models/Prompt';
import { PromptVersionModel } from '../models/PromptVersion';
import { PermissionModel } from '../models/Permission';

type AuthenticatedRequest = Request & { user?: { id: string; username: string } };

interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  message: string;
}

function sendSuccess<T>(res: Response, data: T, message?: string, pagination?: SuccessResponse<T>['pagination'], status = 200): void {
  const response: SuccessResponse<T> = { success: true, data };
  if (message) response.message = message;
  if (pagination) response.pagination = pagination;
  res.status(status).json(response);
}

function sendError(res: Response, message: string, status = 500): void {
  const response: ErrorResponse = { success: false, message };
  res.status(status).json(response);
}

function parseTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String);
  return String(tags).split(',');
}

function getCurrentUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

function validateRequiredFields(data: { title?: string; content?: string }): string | null {
  if (!data.content?.trim()) return 'Content is required';
  if (!data.title?.trim()) return 'Title is required';
  return null;
}

export class PromptController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePromptDTO = req.body;

      const error = validateRequiredFields(data);
      if (error) {
        sendError(res, error, 400);
        return;
      }

      const currentUser = getCurrentUser(req);
      if (currentUser) {
        data.author = currentUser.username;
      }

      const prompt = await PromptModel.create(data);

      if (currentUser) {
        await PermissionModel.grant(prompt.id, currentUser.id, 'owner', currentUser.id);
      }

      sendSuccess(res, prompt, 'Prompt created successfully', undefined, 201);
    } catch {
      sendError(res, 'Failed to create prompt');
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PromptModel.incrementViews(id);
      const prompt = await PromptModel.getById(id);

      if (!prompt) {
        sendError(res, 'Prompt not found', 404);
        return;
      }

      sendSuccess(res, prompt);
    } catch {
      sendError(res, 'Failed to get prompt');
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(String(req.query.page || '1')) || 1;
      const limit = parseInt(String(req.query.limit || '20')) || 20;
      const result = await PromptModel.getAll(page, limit);

      sendSuccess(res, result.data, undefined, { page, limit, total: result.total });
    } catch {
      sendError(res, 'Failed to get prompts');
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: Partial<CreatePromptDTO> = req.body;

      const existingPrompt = await PromptModel.getById(id);
      if (!existingPrompt) {
        sendError(res, 'Prompt not found', 404);
        return;
      }

      const currentUser = getCurrentUser(req);
      if (currentUser && existingPrompt.author === 'Anonymous') {
        await PromptModel.claim(id, currentUser.username);
        await PermissionModel.grant(id, currentUser.id, 'owner', currentUser.id);
      } else if (currentUser && existingPrompt.author !== currentUser.username) {
        const hasPermission = await PermissionModel.check(id, currentUser.id, ['owner', 'editor']);
        if (!hasPermission) {
          sendError(res, 'No permission to update this prompt', 403);
          return;
        }
      }

      const updatedPrompt = await PromptModel.update(id, data, currentUser?.username || req.body.author);

      sendSuccess(res, updatedPrompt, 'Prompt updated successfully');
    } catch {
      sendError(res, 'Failed to update prompt');
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await PromptModel.delete(id);
      sendSuccess(res, {}, 'Prompt deleted successfully');
    } catch {
      sendError(res, 'Failed to delete prompt');
    }
  }

  static async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, category, tags, page, limit } = req.query;

      if (!query) {
        sendError(res, 'Query parameter is required', 400);
        return;
      }

      const pageNum = parseInt(String(page || '1')) || 1;
      const limitNum = parseInt(String(limit || '20')) || 20;
      const tagArray = parseTags(tags);

      const result = await PromptModel.search(
        String(query),
        category ? String(category) : undefined,
        tagArray,
        pageNum,
        limitNum,
      );

      sendSuccess(res, result.data, undefined, {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch {
      sendError(res, 'Failed to search prompts');
    }
  }

  static async advancedSearch(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        category,
        tags,
        model,
        sampler,
        minSeed,
        maxSeed,
        author,
        isPublic,
        page,
        limit,
      } = req.query;

      const pageNum = parseInt(String(page || '1')) || 1;
      const limitNum = parseInt(String(limit || '20')) || 20;
      const tagArray = parseTags(tags);

      const result = await PromptModel.advancedSearch(
        {
          query: query ? String(query) : undefined,
          category: category ? String(category) : undefined,
          tags: tagArray,
          model: model ? String(model) : undefined,
          sampler: sampler ? String(sampler) : undefined,
          minSeed: minSeed ? parseInt(String(minSeed)) : undefined,
          maxSeed: maxSeed ? parseInt(String(maxSeed)) : undefined,
          author: author ? String(author) : undefined,
          isPublic: isPublic ? isPublic === 'true' : undefined,
        },
        pageNum,
        limitNum,
      );

      sendSuccess(res, result.data, undefined, {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      });
    } catch {
      sendError(res, 'Failed to perform advanced search');
    }
  }

  static async toggleLike(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { liked } = req.body;

      await PromptModel.toggleLike(id, liked);
      const prompt = await PromptModel.getById(id);

      sendSuccess(res, prompt, 'Like status updated');
    } catch {
      sendError(res, 'Failed to update like status');
    }
  }

  static async exportPrompts(req: Request, res: Response): Promise<void> {
    try {
      const { ids, format } = req.query;
      const idArray = parseTags(ids);
      const prompts = await PromptModel.exportPrompts(idArray.length ? idArray : undefined);

      const fmt = (format as string) || 'json';

      if (fmt === 'csv') {
        const header = ['id', 'title', 'description', 'content', 'category', 'author', 'isPublic', 'tags', 'createdAt', 'updatedAt'];
        const rows = prompts.map(p =>
          header.map(h => {
            if (h === 'tags') return `"${(p.tags || []).join(';')}"`;
            return `"${String((p as any)[h] ?? '')}"`;
          }).join(','),
        );
        const csv = [header.join(','), ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
        return;
      }

      if (fmt === 'md' || fmt === 'markdown') {
        const md = prompts
          .map(p =>
            `## ${p.title}\n\n${p.description || ''}\n\n\`\`\`prompt\n${p.content}\n\`\`\`\n\nTags: ${(p.tags || []).join(', ')}\n\n---`,
          )
          .join('\n\n');
        res.setHeader('Content-Type', 'text/markdown');
        res.send(md);
        return;
      }

      sendSuccess(res, prompts);
    } catch {
      sendError(res, 'Failed to export prompts');
    }
  }

  static async importPrompts(req: Request, res: Response): Promise<void> {
    try {
      const items = req.body.items as CreatePromptDTO[];
      if (!items?.length) {
        sendError(res, 'items array required in body', 400);
        return;
      }

      const created = await PromptModel.importPrompts(items);
      sendSuccess(res, created, 'Imported prompts', undefined, 201);
    } catch {
      sendError(res, 'Failed to import prompts');
    }
  }

  static async bulkAction(req: Request, res: Response): Promise<void> {
    try {
      const { action, ids } = req.body;

      if (!action || !ids?.length) {
        sendError(res, 'action and ids[] required', 400);
        return;
      }

      if (action === 'delete') {
        await PromptModel.bulkDelete(ids);
      } else if (action === 'publish') {
        await PromptModel.bulkUpdatePublish(ids, true);
      } else if (action === 'unpublish') {
        await PromptModel.bulkUpdatePublish(ids, false);
      } else {
        sendError(res, 'unsupported action', 400);
        return;
      }

      sendSuccess(res, {}, 'Bulk action completed');
    } catch {
      sendError(res, 'Failed to perform bulk action');
    }
  }

  static async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { author } = req.body;
      const dup = await PromptModel.duplicate(id, author);
      sendSuccess(res, dup, 'Prompt duplicated', undefined, 201);
    } catch {
      sendError(res, 'Failed to duplicate prompt');
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const history = await PromptVersionModel.getHistory(id);
      sendSuccess(res, history);
    } catch {
      sendError(res, 'Failed to get history');
    }
  }

  static async revert(req: Request, res: Response): Promise<void> {
    try {
      const { id, version } = req.params;
      const verNum = parseInt(version);
      const targetVersion = await PromptVersionModel.getVersion(id, verNum);

      if (!targetVersion) {
        sendError(res, 'Version not found', 404);
        return;
      }

      const updated = await PromptModel.update(
        id,
        {
          title: targetVersion.title,
          description: targetVersion.description,
          content: targetVersion.content,
          category: targetVersion.category,
          tags: targetVersion.tags,
        },
        `Reverted to v${verNum}`,
      );

      sendSuccess(res, updated, `Reverted to version ${verNum}`);
    } catch {
      sendError(res, 'Failed to revert');
    }
  }

  static async sync(req: Request, res: Response): Promise<void> {
    try {
      const items = req.body.items;
      if (!items?.length) {
        sendError(res, 'items array required', 400);
        return;
      }

      const currentUser = getCurrentUser(req);
      const createdPrompts = [];

      for (const item of items) {
        const dto: CreatePromptDTO = {
          title: item.model ? `${item.model} Capture` : 'Synced Prompt',
          content:
            item.positivePrompt + (item.negativePrompt ? `\n\nNegative Prompt:\n${item.negativePrompt}` : ''),
          description: `Captured from ${item.sourceUrl || 'Web'}`,
          category: 'AI Art',
          tags: [item.model, ...(item.loras || []).map((l: unknown) => (l as { name: string }).name)].filter(
            Boolean,
          ),
          author: currentUser ? currentUser.username : 'Anonymous',
          metadata: item,
        };

        const prompt = await PromptModel.create(dto);
        if (currentUser) {
          await PermissionModel.grant(prompt.id, currentUser.id, 'owner', currentUser.id);
        }
        createdPrompts.push(prompt);
      }

      sendSuccess(res, createdPrompts, `Successfully synced ${createdPrompts.length} prompts`, undefined, 201);
    } catch {
      sendError(res, 'Sync failed');
    }
  }
}
