import React, { useState, useEffect } from 'react';
import { grantPermission, getPromptPermissions, revokePermission } from '../services/collaborationService';

interface Permission {
  id: string;
  promptId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  userName: string;
  displayName: string;
  grantedAt: string;
  revokedAt: string | null;
}

interface PermissionComponentProps {
  promptId: string;
  isOwner: boolean;
}

const ROLE_DESCRIPTIONS = {
  owner: '完全权限，可管理所有内容和权限',
  editor: '可编辑和查看提示词',
  commenter: '可查看并评论',
  viewer: '只能查看',
};

const ROLE_COLORS = {
  owner: 'bg-red-100 text-red-800',
  editor: 'bg-blue-100 text-blue-800',
  commenter: 'bg-yellow-100 text-yellow-800',
  viewer: 'bg-gray-100 text-gray-800',
};

export const PermissionManagement: React.FC<PermissionComponentProps> = ({ promptId, isOwner }) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer' | 'commenter'>('viewer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, [promptId]);

  const loadPermissions = async () => {
    try {
      const data = await getPromptPermissions(promptId);
      setPermissions(data.filter((p: Permission) => !p.revokedAt));
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !newUserId.trim()) return;

    try {
      setLoading(true);
      await grantPermission(promptId, newUserId, newRole);
      setNewUserId('');
      setNewRole('viewer');
      loadPermissions();
    } catch (error) {
      console.error('Failed to grant permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!isOwner || !confirm('确定要撤销此权限吗？')) return;

    try {
      await revokePermission(permissionId);
      loadPermissions();
    } catch (error) {
      console.error('Failed to revoke permission:', error);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold mb-4">🔐 权限管理</h3>

      {/* 授予权限表单 */}
      <form onSubmit={handleGrantPermission} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">用户 ID 或邮箱</label>
            <input
              type="text"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="输入用户 ID"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">角色</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">查看者</option>
              <option value="commenter">评论者</option>
              <option value="editor">编辑者</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!newUserId.trim() || loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '授予中...' : '授予权限'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600">{ROLE_DESCRIPTIONS[newRole]}</p>
      </form>

      {/* 权限列表 */}
      <div>
        <h4 className="font-semibold mb-4">当前权限列表</h4>
        {permissions.length === 0 ? (
          <p className="text-center text-gray-500">暂无其他用户权限</p>
        ) : (
          <div className="space-y-3">
            {permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="font-semibold">{perm.displayName || perm.userName}</p>
                  <p className="text-sm text-gray-600">{perm.userId}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ROLE_COLORS[perm.role]}`}>
                    {perm.role === 'owner'
                      ? '拥有者'
                      : perm.role === 'editor'
                        ? '编辑者'
                        : perm.role === 'commenter'
                          ? '评论者'
                          : '查看者'}
                  </span>
                  {perm.role !== 'owner' && (
                    <button
                      onClick={() => handleRevokePermission(perm.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      撤销
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 角色说明 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="font-semibold mb-3">角色权限说明</h4>
        <div className="space-y-2 text-sm">
          {(['owner', 'editor', 'commenter', 'viewer'] as const).map((role) => (
            <div key={role} className="flex gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${ROLE_COLORS[role]}`}>
                {role === 'owner' ? '拥有者' : role === 'editor' ? '编辑者' : role === 'commenter' ? '评论者' : '查看者'}
              </span>
              <span className="text-gray-700">{ROLE_DESCRIPTIONS[role]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionManagement;
