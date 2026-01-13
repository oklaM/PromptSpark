/**
 * 权限管理控制器
 * 处理用户权限、评论、讨论和评分的业务逻辑
 */

import { Request, Response } from 'express';
import { database } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { PERMISSION_LEVELS } from '../models/Permission';
import { PromptStats } from '../models/Rating';
import type { PermissionRow, CommentRow, RatingRow } from '../types/database';

// ========== 权限管理接口 ==========

export const grantPermission = async (req: Request, res: Response) => {
  try {
    const { promptId, userId, role } = req.body;
    const currentUserId = (req as any).user?.id;

    // 验证权限
    const ownerPerm = await database.get<PermissionRow>(
      'SELECT * FROM permissions WHERE "promptId" = ? AND "userId" = ? AND role = ?',
      [promptId, currentUserId, 'owner']
    );

    if (!ownerPerm) {
      return res.status(403).json({ error: '无权限管理此提示词的权限' });
    }

    if (!['owner', 'editor', 'viewer', 'commenter'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO permissions
       (id, "promptId", "userId", role, "grantedBy", "grantedAt")
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT ("promptId", "userId") DO UPDATE SET
       role = excluded.role,
       "grantedBy" = excluded."grantedBy",
       "grantedAt" = excluded."grantedAt",
       "revokedAt" = NULL`,
      [id, promptId, userId, role, currentUserId, now]
    );

    res.json({ success: true, permissionId: id });
  } catch (error) {
    console.error('Error granting permission:', error);
    res.status(500).json({ error: '权限授予失败' });
  }
};

export const revokePermission = async (req: Request, res: Response) => {
  try {
    const { permissionId } = req.params;
    const currentUserId = (req as any).user?.id;

    const permission = await database.get<PermissionRow>(
      'SELECT * FROM permissions WHERE id = ?',
      [permissionId]
    );

    if (!permission) {
      return res.status(404).json({ error: '权限不存在' });
    }

    const ownerPerm = await database.get<PermissionRow>(
      'SELECT * FROM permissions WHERE "promptId" = ? AND "userId" = ? AND role = ?',
      [permission.promptid, currentUserId, 'owner']
    );

    if (!ownerPerm) {
      return res.status(403).json({ error: '无权撤销此权限' });
    }

    await database.run(
      'UPDATE permissions SET "revokedAt" = ? WHERE id = ?',
      [new Date().toISOString(), permissionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking permission:', error);
    res.status(500).json({ error: '权限撤销失败' });
  }
};

export const getPromptPermissions = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;

    const permissions = await database.all(
      `SELECT p.*, u."displayName", u.username 
       FROM permissions p
       LEFT JOIN users u ON p."userId" = u.id
       WHERE p."promptId" = ? AND p."revokedAt" IS NULL`,
      [promptId]
    );

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: '获取权限失败' });
  }
};

export const checkUserPermission = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;
    // allow passing userId via params for tests/legacy routes: /check-permission/:promptId/:userId
    const userId = (req.params as any).userId || (req as any).user?.id;

    const permission = await database.get<PermissionRow>(
      `SELECT * FROM permissions
       WHERE "promptId" = ? AND "userId" = ? AND "revokedAt" IS NULL`,
      [promptId, userId]
    );

    if (!permission) {
      return res.json({ hasPermission: false, level: null });
    }

    const permLevel = PERMISSION_LEVELS[permission.role];
    res.json({ hasPermission: true, level: permission.role, permissions: permLevel });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: '检查权限失败' });
  }
};

// ========== 评论接口 ==========

export const createComment = async (req: Request, res: Response) => {
  try {
    const { promptId, content, parentId } = req.body;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.username;

    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO comments 
       (id, "promptId", "userId", "userName", content, "parentId", "createdAt", "updatedAt") 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, promptId, userId, userName, content, parentId || null, now, now]
    );

    // 更新讨论评论数
    if (parentId) {
      const discussion = await database.get(
        'SELECT id FROM discussions WHERE id = (SELECT id FROM discussions LIMIT 1) AND "promptId" = ?',
        [promptId]
      );
      if (discussion) {
        await database.run(
          'UPDATE discussions SET "commentCount" = "commentCount" + 1, "lastCommentAt" = ? WHERE "promptId" = ?',
          [now, promptId]
        );
      }
    }

    res.json({ 
      success: true, 
      comment: { 
        id, 
        promptId, 
        userId, 
        userName, 
        content, 
        parentId: parentId || null,
        likes: 0,
        createdAt: now,
        updatedAt: now
      } 
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    if ((error as any).code === '23505') {
      return res.status(400).json({ error: '无法评论：提示词不存在或用户无效' });
    }
    res.status(500).json({ error: '评论创建失败' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;
    const { parentId } = req.query;

    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM comments r WHERE r."parentId" = c.id AND r."deletedAt" IS NULL) as "replyCount"
      FROM comments c 
      WHERE c."promptId" = ? AND c."deletedAt" IS NULL`;
    const params: any[] = [promptId];

    if (parentId) {
      sql += ` AND c."parentId" = ?`;
      params.push(parentId);
    } else {
      sql += ` AND c."parentId" IS NULL`;
    }

    sql += ` ORDER BY c."createdAt" DESC`;

    const comments = await database.all(sql, params);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?.id;

    const comment = await database.get<CommentRow>(
      'SELECT * FROM comments WHERE id = ?',
      [commentId]
    );

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (comment.userid !== userId) {
      return res.status(403).json({ error: '无权删除他人评论' });
    }

    await database.run(
      'UPDATE comments SET "deletedAt" = ? WHERE id = ?',
      [new Date().toISOString(), commentId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: '评论删除失败' });
  }
};

export const likeComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user?.id;

    const existing = await database.get(
      'SELECT * FROM comment_likes WHERE "commentId" = ? AND "userId" = ?',
      [commentId, userId]
    );

    if (existing) {
      await database.run(
        'DELETE FROM comment_likes WHERE "commentId" = ? AND "userId" = ?',
        [commentId, userId]
      );
      await database.run(
        'UPDATE comments SET likes = likes - 1 WHERE id = ?',
        [commentId]
      );
      res.json({ success: true, liked: false });
    } else {
      await database.run(
        'INSERT INTO comment_likes ("commentId", "userId", "createdAt") VALUES (?, ?, ?)',
        [commentId, userId, new Date().toISOString()]
      );
      await database.run(
        'UPDATE comments SET likes = likes + 1 WHERE id = ?',
        [commentId]
      );
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: '点赞失败' });
  }
};

// ========== 讨论接口 ==========

export const createDiscussion = async (req: Request, res: Response) => {
  try {
    const { promptId, title, description } = req.body;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.username;

    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO discussions 
       (id, "promptId", title, description, "initiatorId", "initiatorName", "createdAt", "updatedAt") 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, promptId, title, description, userId, userName, now, now]
    );

    res.json({ success: true, discussionId: id });
  } catch (error) {
    console.error('Error creating discussion:', error);
    if ((error as any).code === '23505') {
      return res.status(400).json({ error: '无法创建讨论：提示词不存在或用户无效' });
    }
    res.status(500).json({ error: '讨论创建失败' });
  }
};

export const getDiscussions = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;

    const discussions = await database.all(
      `SELECT * FROM discussions WHERE "promptId" = ? ORDER BY "lastCommentAt" DESC`,
      [promptId]
    );

    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ error: '获取讨论失败' });
  }
};

export const updateDiscussionStatus = async (req: Request, res: Response) => {
  try {
    const { discussionId } = req.params;
    const { status } = req.body;

    if (!['open', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: '无效的讨论状态' });
    }

    await database.run(
      'UPDATE discussions SET status = ?, "updatedAt" = ? WHERE id = ?',
      [status, new Date().toISOString(), discussionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({ error: '讨论更新失败' });
  }
};

// ========== 评分接口 ==========

export const submitRating = async (req: Request, res: Response) => {
  try {
    const { promptId, score, feedback, helpfulness, accuracy, relevance } = req.body;
    const userId = (req as any).user?.id;
    const userName = (req as any).user?.username;

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: '评分必须在 1-5 之间' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO ratings 
       (id, "promptId", "userId", "userName", score, feedback, helpfulness, accuracy, relevance, "createdAt", "updatedAt") 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT ("promptId", "userId") DO UPDATE SET
       score = excluded.score,
       feedback = excluded.feedback,
       helpfulness = excluded.helpfulness,
       accuracy = excluded.accuracy,
       relevance = excluded.relevance,
       "updatedAt" = excluded."updatedAt"`,
      [id, promptId, userId, userName, score, feedback || null, helpfulness || 0, accuracy || 0, relevance || 0, now, now]
    );

    res.json({ success: true, ratingId: id });
  } catch (error) {
    console.error('Error submitting rating:', error);
    if ((error as any).code === '23505') {
      return res.status(400).json({ error: '无法提交评分：提示词不存在或用户无效' });
    }
    res.status(500).json({ error: '评分提交失败' });
  }
};

export const getPromptRatings = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;

    const ratings = await database.all(
      `SELECT * FROM ratings WHERE "promptId" = ? ORDER BY "createdAt" DESC`,
      [promptId]
    );

    res.json(ratings);
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({ error: '获取评分失败' });
  }
};

export const getPromptStats = async (req: Request, res: Response) => {
  try {
    const { promptId } = req.params;

    const ratings = await database.all<RatingRow>(
      `SELECT * FROM ratings WHERE "promptId" = ?`,
      [promptId]
    );

    if (ratings.length === 0) {
      return res.json({
        promptId,
        averageScore: 0,
        totalRatings: 0,
        averageHelpfulness: 0,
        averageAccuracy: 0,
        averageRelevance: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        lastUpdated: new Date().toISOString(),
      });
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    let totalHelpfulness = 0;
    let totalAccuracy = 0;
    let totalRelevance = 0;

    ratings.forEach((rating) => {
      const score = rating.overall || 0;
      if (score >= 1 && score <= 5) {
        distribution[score as 1 | 2 | 3 | 4 | 5]++;
      }
      totalScore += score;
      totalHelpfulness += rating.helpfulness || 0;
      totalAccuracy += rating.accuracy || 0;
      totalRelevance += rating.relevance || 0;
    });

    const stats: PromptStats = {
      promptId,
      averageScore: parseFloat((totalScore / ratings.length).toFixed(2)),
      totalRatings: ratings.length,
      averageHelpfulness: parseFloat((totalHelpfulness / ratings.length).toFixed(2)),
      averageAccuracy: parseFloat((totalAccuracy / ratings.length).toFixed(2)),
      averageRelevance: parseFloat((totalRelevance / ratings.length).toFixed(2)),
      ratingDistribution: distribution,
      lastUpdated: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: '评分统计失败' });
  }
};

export const deleteRating = async (req: Request, res: Response) => {
  try {
    const { ratingId } = req.params;
    const userId = (req as any).user?.id;

    const rating = await database.get<RatingRow>(
      'SELECT * FROM ratings WHERE id = ?',
      [ratingId]
    );

    if (!rating) {
      return res.status(404).json({ error: '评分不存在' });
    }

    if (rating.userid !== userId) {
      return res.status(403).json({ error: '无权删除他人评分' });
    }

    await database.run(
      'DELETE FROM ratings WHERE id = ?',
      [ratingId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ error: '评分删除失败' });
  }
};
