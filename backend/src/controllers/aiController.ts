import { Request, Response } from 'express';
import { AiService } from '../services/aiService';
import { SubscriptionModel } from '../models/Subscription';

export class AiController {
  static async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { content, title, description, targetField, config, apiKey, provider, baseURL, model } = req.body;

      if (!content && !title && !description) {
        res.status(400).json({
          success: false,
          message: 'At least one field (content, title, or description) is required'
        });
        return;
      }

      // Merge direct params into a config object
      const aiConfig = {
          apiKey: apiKey || config?.apiKey,
          baseURL: baseURL || config?.baseURL,
          provider: provider || config?.provider,
          model: model || config?.model
      };

      const result = await AiService.analyzeContent({ content, title, description }, targetField, aiConfig);

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

  static async diagnose(req: Request, res: Response): Promise<void> {
    try {
        const { content, config, apiKey, provider, baseURL, model } = req.body;

        if (!content) {
            res.status(400).json({ success: false, message: 'Content is required for diagnosis' });
            return;
        }

        const aiConfig = {
            apiKey: apiKey || config?.apiKey,
            baseURL: baseURL || config?.baseURL,
            provider: provider || config?.provider,
            model: model || config?.model
        };

        const result = await AiService.diagnosePrompt(content, aiConfig);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Diagnosis failed'
        });
    }
  }

  static async runPrompt(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, config, apiKey, model, provider, baseURL } = req.body;

      if (!prompt) {
        res.status(400).json({ success: false, message: 'Prompt is required' });
        return;
      }

      // Setup SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await AiService.runPromptStream(prompt, { 
          ...config, 
          model, 
          apiKey, 
          provider, 
          baseURL 
      });

      for await (const chunk of stream) {
        const text = chunk;
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

  static async optimize(req: Request, res: Response): Promise<void> {
    try {
      const { content, goal, config, apiKey, provider, baseURL, model } = req.body;

      if (!content) {
        res.status(400).json({ success: false, message: 'Content is required for optimization' });
        return;
      }

      const aiConfig = {
          apiKey: apiKey || config?.apiKey,
          baseURL: baseURL || config?.baseURL,
          provider: provider || config?.provider,
          model: model || config?.model
      };

      const result = await AiService.optimizePrompt(content, goal || 'quality', aiConfig);

      // Increment usage count for the user
      if ((req as any).user) {
        await SubscriptionModel.incrementAiUsage((req as any).user.id);
      }

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Optimization failed'
      });
    }
  }
}
