import type { Request, Response } from 'express';
import { AiService, type AiConfig } from '../services/aiService';
import { SubscriptionModel } from '../models/Subscription';

type AuthenticatedRequest = Request & { user?: { id: string } };

interface RequestBody {
  config?: AiConfig;
  apiKey?: string;
  baseURL?: string;
  provider?: string;
  model?: string;
}

function buildAiConfig(body: RequestBody): AiConfig {
  const { config, apiKey, baseURL, provider, model } = body;
  return {
    apiKey: apiKey ?? config?.apiKey,
    baseURL: baseURL ?? config?.baseURL,
    provider: provider ?? config?.provider,
    model: model ?? config?.model,
  };
}

function incrementAiUsageIfNeeded(req: AuthenticatedRequest): void {
  const user = req.user;
  if (user) {
    void SubscriptionModel.incrementAiUsage(user.id);
  }
}

function sendErrorResponse(res: Response, message: string, status = 500): void {
  res.status(status).json({ success: false, message });
}

export class AiController {
  static async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { content, title, description, targetField } = req.body;

      if (!content && !title && !description) {
        sendErrorResponse(res, 'At least one field (content, title, or description) is required', 400);
        return;
      }

      const aiConfig = buildAiConfig(req.body);
      const result = await AiService.analyzeContent({ content, title, description }, targetField, aiConfig);

      res.json({ success: true, data: result });
    } catch (error) {
      sendErrorResponse(res, error instanceof Error ? error.message : 'Analysis failed');
    }
  }

  static async diagnose(req: Request, res: Response): Promise<void> {
    try {
      const { content } = req.body;

      if (!content) {
        sendErrorResponse(res, 'Content is required for diagnosis', 400);
        return;
      }

      const aiConfig = buildAiConfig(req.body);
      const result = await AiService.diagnosePrompt(content, aiConfig);

      incrementAiUsageIfNeeded(req as AuthenticatedRequest);

      res.json({ success: true, data: result });
    } catch (error) {
      sendErrorResponse(res, error instanceof Error ? error.message : 'Diagnosis failed');
    }
  }

  static async optimize(req: Request, res: Response): Promise<void> {
    try {
      const { content, goal } = req.body;

      if (!content) {
        sendErrorResponse(res, 'Content is required for optimization', 400);
        return;
      }

      const aiConfig = buildAiConfig(req.body);
      const result = await AiService.optimizePrompt(content, goal || 'quality', aiConfig);

      incrementAiUsageIfNeeded(req as AuthenticatedRequest);

      res.json({ success: true, data: result });
    } catch (error) {
      sendErrorResponse(res, error instanceof Error ? error.message : 'Optimization failed');
    }
  }

  static async runPrompt(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, config, apiKey, model, provider, baseURL } = req.body;

      if (!prompt) {
        sendErrorResponse(res, 'Prompt is required', 400);
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await AiService.runPromptStream(prompt, {
        ...config,
        model,
        apiKey,
        provider,
        baseURL,
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Run Prompt Error:', error);

      if (!res.headersSent) {
        sendErrorResponse(res, error instanceof Error ? error.message : 'Execution failed');
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Execution failed' })}\n\n`);
        res.end();
      }
    }
  }

  static async getModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await AiService.getAvailableModels();
      res.json({ success: true, data: models });
    } catch {
      sendErrorResponse(res, 'Failed to retrieve models');
    }
  }
}
