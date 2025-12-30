import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';

/**
 * 权限管理模型
 * 用于管理用户对提示词的访问权限和操作权限
 */

export interface Permission {
  id: string;
  promptId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  grantedBy: string;
  grantedAt: string;
  revokedAt: string | null;
}

export interface PermissionLevel {
  level: 'owner' | 'editor' | 'viewer' | 'commenter';
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canComment: boolean;
  canManagePermissions: boolean;
}

export const PERMISSION_LEVELS: Record<string, PermissionLevel> = {
  owner: {
    level: 'owner',
    canView: true,
    canEdit: true,
    canDelete: true,
    canShare: true,
    canComment: true,
    canManagePermissions: true,
  },
  editor: {
    level: 'editor',
    canView: true,
    canEdit: true,
    canDelete: false,
    canShare: false,
    canComment: true,
    canManagePermissions: false,
  },
  viewer: {
    level: 'viewer',
    canView: true,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canComment: false,
    canManagePermissions: false,
  },
  commenter: {
    level: 'commenter',
    canView: true,
    canEdit: false,
    canDelete: false,
    canShare: false,
    canComment: true,
    canManagePermissions: false,
  },
};

export class PermissionModel {
  static async grant(promptId: string, userId: string, role: string, grantedBy: string): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT OR REPLACE INTO permissions (id, promptId, userId, role, grantedBy, grantedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, promptId, userId, role, grantedBy, now]
    );
  }

  static async check(promptId: string, userId: string, roles: string[]): Promise<boolean> {
    const placeholders = roles.map(() => '?').join(',');
    const perm = await database.get(
      `SELECT * FROM permissions 
       WHERE promptId = ? AND userId = ? AND revokedAt IS NULL AND role IN (${placeholders})`,
      [promptId, userId, ...roles]
    );
    return !!perm;
  }

  static async getByPrompt(promptId: string): Promise<any[]> {
    return await database.all(
      `SELECT p.*, u.displayName, u.username 
       FROM permissions p
       LEFT JOIN users u ON p.userId = u.id
       WHERE p.promptId = ? AND p.revokedAt IS NULL`,
      [promptId]
    );
  }

  static async revoke(permissionId: string): Promise<void> {
    await database.run(
      'UPDATE permissions SET revokedAt = ? WHERE id = ?',
      [new Date().toISOString(), permissionId]
    );
  }
}