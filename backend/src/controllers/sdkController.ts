import { Response } from 'express';
import { ApiTokenModel } from '../models/ApiToken';
import { PromptModel } from '../models/Prompt';
import { database } from '../db/database';
import { SdkRequest } from '../middleware/sdkAuthMiddleware';
import { AuthRequest } from '../middleware/authMiddleware';
import type { UserRow } from '../types/database';

export class SdkController {
  // --- Token Management ---

  static async listTokens(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const tokens = await ApiTokenModel.getByUser(userId);
      res.json({ success: true, data: tokens });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to list tokens' });
    }
  }

  static async createToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Token name is required' });
        return;
      }
      const token = await ApiTokenModel.create(userId, name);
      res.status(201).json({ success: true, data: token });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create token' });
    }
  }

  static async revokeToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const success = await ApiTokenModel.revoke(id, userId);
      if (success) {
        res.json({ success: true, message: 'Token revoked' });
      } else {
        res.status(404).json({ success: false, message: 'Token not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to revoke token' });
    }
  }

  // --- SDK Access ---

  static async getPromptByKey(req: SdkRequest, res: Response): Promise<void> {
    try {
      const { key } = req.params; // Currently key is promptId
      const userId = req.sdkUser!.userId; // Guaranteed by middleware

      const prompt = await PromptModel.getById(key);
      if (!prompt) {
        res.status(404).json({ success: false, message: 'Prompt not found' });
        return;
      }

      if (prompt.isPublic) {
        res.json({ success: true, data: prompt });
        return;
      }

      // Check access
      // 1. Get user details for username check (legacy author check)
      const user = await database.get<Pick<UserRow, 'username'>>('SELECT username FROM users WHERE id = ?', [userId]);
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid token user' });
        return;
      }

      if (user.username === prompt.author) {
        res.json({ success: true, data: prompt });
        return;
      }

      // 2. Check permissions table
      const perm = await database.get(
        `SELECT * FROM permissions WHERE promptId = ? AND userId = ? AND revokedAt IS NULL`,
        [key, userId]
      );

      if (perm) {
        res.json({ success: true, data: prompt });
        return;
      }

      res.status(403).json({ success: false, message: 'Access denied' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
