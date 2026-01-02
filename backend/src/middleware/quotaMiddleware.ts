import { Request, Response, NextFunction } from 'express';
import { database } from '../db/database';
import { SubscriptionModel } from '../models/Subscription';
import { PromptModel } from '../models/Prompt';

export const checkStorageQuota = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Auth required' });

  const sub = await SubscriptionModel.getByUserId(user.id);
  const { total } = await PromptModel.getAll(1, 1); // Get total count (inefficient but works for SQLite/Simple PG)
  
  // Actually we need total for THIS user
  const userPrompts = await PromptModel.search('', undefined, []); 
  const countRes = await database.get('SELECT COUNT(*) as count FROM prompts WHERE author = ? AND "deletedAt" IS NULL', [user.username]);
  const currentCount = parseInt(countRes?.count || '0');

  if (currentCount >= sub.storageLimit) {
    return res.status(403).json({
      success: false,
      code: 'QUOTA_EXCEEDED',
      message: `存储空间已满 (${currentCount}/${sub.storageLimit})。请升级到 Pro 账户以解锁无限存储。`
    });
  }

  next();
};

export const checkAiQuota = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Auth required' });

  const sub = await SubscriptionModel.getByUserId(user.id);

  if (sub.aiUsedToday >= sub.aiLimit) {
    return res.status(403).json({
      success: false,
      code: 'AI_QUOTA_EXCEEDED',
      message: `今日 AI 优化额度已用完 (${sub.aiUsedToday}/${sub.aiLimit})。请明日再试或升级到 Pro 账户。`
    });
  }

  next();
};
