import React from 'react';
import { User, Lock, LogIn, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../context/ToastContext';

interface LoginFormProps {
  onClose?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onClose, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
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
      const res = await authService.login({ username, password });
      if (res && res.token) {
        setAuth(res.token, res.data);
        show('登录成功', 'success');
        onClose && onClose();
      } else {
        show('登录失败', 'error');
      }
    } catch (err) {
      console.error('Login failed', err);
      show('登录失败: ' + (err instanceof Error ? err.message : '用户名或密码错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 w-full sm:w-96 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">欢迎回来</h3>
        <p className="text-sm text-gray-600">登录您的 PromptSpark 账户</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="用户名"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            type="password"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {onSwitchToRegister && (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            注册新账户
          </button>
        )}
        <div className="flex items-center gap-2">
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
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium flex items-center gap-2 transition-all text-sm disabled:opacity-50 shadow-md shadow-blue-200"
          >
            <LogIn className="w-4 h-4" />
            {loading ? '登录中...' : '登录'}
          </button>
        </div>
      </div>
    </form>
  );
}
