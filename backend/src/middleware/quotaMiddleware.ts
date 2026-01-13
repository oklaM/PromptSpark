import type { Request, Response, NextFunction } from 'express';
import { database } from '../db/database';
import { SubscriptionModel } from '../models/Subscription';

type AuthenticatedRequest = Request & { user?: { id: string; username: string } };

interface QuotaResponse {
  success: false;
  code: string;
  message: string;
  data: {
    current?: number;
    used?: number;
    limit: number;
    plan: string;
    resetsAt?: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response): req is AuthenticatedRequest & { user: { id: string; username: string } } {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  return true;
}

function sendQuotaExceeded(res: Response, response: QuotaResponse): void {
  res.status(403).json(response);
}

async function getCurrentPromptCount(username: string): Promise<number> {
  const countRes = await database.get<{ count: string }>(
    'SELECT COUNT(*) as count FROM prompts WHERE author = $1 AND "deletedAt" IS NULL',
    [username],
  );
  return parseInt(countRes?.count || '0');
}

export async function checkStorageQuota(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!requireAuth(req, res)) return;

  try {
    const { id, username } = req.user;
    const sub = await SubscriptionModel.getByUserId(id);
    const currentCount = await getCurrentPromptCount(username);

    if (currentCount >= sub.storageLimit) {
      sendQuotaExceeded(res, {
        success: false,
        code: 'QUOTA_EXCEEDED',
        message: `Storage quota exceeded (${currentCount}/${sub.storageLimit}). Please upgrade to Pro for unlimited storage.`,
        data: {
          current: currentCount,
          limit: sub.storageLimit,
          plan: sub.plan,
        },
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to check storage quota',
    });
  }
}

export async function checkAiQuota(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!requireAuth(req, res)) return;

  try {
    const { id } = req.user;
    const sub = await SubscriptionModel.getByUserId(id);

    if (sub.aiUsedToday >= sub.aiLimit) {
      sendQuotaExceeded(res, {
        success: false,
        code: 'AI_QUOTA_EXCEEDED',
        message: `Daily AI quota exceeded (${sub.aiUsedToday}/${sub.aiLimit}). Try again tomorrow or upgrade to Pro.`,
        data: {
          used: sub.aiUsedToday,
          limit: sub.aiLimit,
          plan: sub.plan,
          resetsAt: sub.lastResetDate,
        },
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({
      success: false,
      message: 'Failed to check AI quota',
    });
  }
}
