import React from 'react';
import { Mail, Lock, User as UserIcon, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../context/ToastContext';

export function RegisterForm({ onClose }: { onClose?: () => void }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const setAuth = useAuthStore(state => state.setAuth);
  const { show } = useToast();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username || !password) {
      show('请输入用户名和密码', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({ username, password, email, displayName });
      if (res && res.token) {
        setAuth(res.token, res.data);
        show('注册成功', 'success');
        onClose && onClose();
      } else {
        show('注册失败', 'error');
      }
    } catch (err) {
      console.error('Register failed', err);
      show('注册失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 w-full sm:w-96 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">创建账户</h3>
        <p className="text-sm text-gray-600">加入 PromptSpark 社区</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="用户名"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱 (可选)"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="relative">
          <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="显示名 (可选)"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            type="password"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium flex items-center gap-2 transition-all text-sm disabled:opacity-50"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? '注册中...' : '注册'}
        </button>
      </div>
    </form>
  );
}
