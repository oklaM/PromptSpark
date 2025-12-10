import { Request, Response } from 'express';
import { PromptModel, CreatePromptDTO } from '../models/Prompt.js';

export class PromptController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePromptDTO = req.body;
      const prompt = await PromptModel.create(data);
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
      const updatedPrompt = await PromptModel.update(id, data, req.body.author);

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
}
