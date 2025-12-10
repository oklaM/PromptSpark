import { useState } from 'react';
import { Menu, X, Plus, LogIn, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../context/ToastContext';

interface HeaderProps {
  onCreateClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onAccountClick: () => void;
}

export function Header({ onCreateClick, onLoginClick, onRegisterClick, onAccountClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuthStore();
  const { show: toast } = useToast();

  const handleCreateClick = () => {
    if (!user) {
      toast('请先登录', 'info');
      onLoginClick();
    } else {
      onCreateClick();
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">✨</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">PromptSpark</h1>
              <p className="text-xs text-gray-500">提示词管理系统</p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建提示词
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <button
                  onClick={onAccountClick}
                  className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.displayName || user.username}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <button
                  onClick={onLoginClick}
                  className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
                <button
                  onClick={onRegisterClick}
                  className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  注册
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            <button
              onClick={handleCreateClick}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建提示词
            </button>

            {user ? (
              <>
                <button
                  onClick={() => {
                    onAccountClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  账户 ({user.displayName || user.username})
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    onLoginClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <LogIn className="w-4 h-4" />
                  登录
                </button>
                <button
                  onClick={() => {
                    onRegisterClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  注册
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
