import { Request, Response } from 'express';
import { AiService } from '../services/aiService';

export class AiController {
  static async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { content, title, description, targetField } = req.body;

      if (!content && !title && !description) {
        res.status(400).json({
          success: false,
          message: 'At least one field (content, title, or description) is required'
        });
        return;
      }

      const result = await AiService.analyzeContent({ content, title, description }, targetField);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Analysis failed'
      });
    }
  }
}
