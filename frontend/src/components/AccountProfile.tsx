import { useAuthStore } from '../stores/authStore';
import { useToast } from '../context/ToastContext';

export function AccountProfile({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore();
  const { show } = useToast();

  const handleLogout = () => {
    logout();
    show('已退出登录', 'info');
    onClose?.();
  };

  if (!user) {
    return <div className="p-4 text-center text-gray-600">未登录</div>;
  }

  return (
    <div className="w-96 p-6 space-y-4">
      <h3 className="text-lg font-semibold">账户信息</h3>
      <div className="space-y-3 py-4 border-y">
        <div>
          <label className="text-sm text-gray-600">用户名</label>
          <p className="font-medium">{user.username}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">显示名</label>
          <p className="font-medium">{user.displayName || '未设置'}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-4">
        <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          关闭
        </button>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          退出登录
        </button>
      </div>
    </div>
  );
}
