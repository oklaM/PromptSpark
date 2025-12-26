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

  static async runPrompt(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, config, apiKey, model } = req.body;

      if (!prompt) {
        res.status(400).json({ success: false, message: 'Prompt is required' });
        return;
      }

      // Setup SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await AiService.runPromptStream(prompt, { ...config, model }, apiKey);

      for await (const chunk of stream) {
        const text = chunk.text();
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Run Prompt Error:', error);
      // If headers are not sent, send JSON error. If sent, send SSE error event.
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Execution failed' });
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Execution failed' })}\n\n`);
        res.end();
      }
    }
  }

  static async getModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await AiService.getAvailableModels();
      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve models'
      });
    }
  }
}
