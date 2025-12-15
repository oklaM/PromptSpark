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
