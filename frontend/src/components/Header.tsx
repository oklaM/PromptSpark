import { useState } from 'react';
import { Menu, X, Plus, LogIn, LogOut, User, Settings, Filter } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../context/ToastContext';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  onCreateClick: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onAccountClick: () => void;
  onSettingsClick: () => void;
  onFilterClick?: () => void;
  renderImportButton?: React.ReactNode;
  showSearch?: boolean;
}

export function Header({
  onCreateClick,
  onLoginClick,
  onRegisterClick,
  onAccountClick,
  onSettingsClick,
  onFilterClick,
  renderImportButton,
  showSearch = true
}: HeaderProps) {
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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">✨</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">PromptSpark</h1>
            </div>
          </div>

          {/* Desktop Search Bar */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-xl">
              <SearchBar />
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {renderImportButton}

            <button
              onClick={handleCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 transition-all active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>新建</span>
            </button>
            
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200 ml-2">
                <button
                  onClick={onAccountClick}
                  className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-bold">{user.displayName || user.username}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-2">
                <button
                  onClick={onLoginClick}
                  className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-bold text-sm"
                >
                  登录
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {renderImportButton}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Filter Bar */}
        {showSearch && (
          <div className="md:hidden pb-3 flex gap-2">
            <div className="flex-1">
              <SearchBar 
                renderFilterButton={
                  <button
                    onClick={onFilterClick}
                    className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-blue-600 transition-colors"
                    title="筛选"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                }
              />
            </div>
          </div>
        )}
        {/* Mobile Menu (Drawer) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <button
              onClick={() => {
                  onSettingsClick();
                  setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-3 font-bold"
            >
              <Settings className="w-5 h-5" />
              设置
            </button>
            
            <button
              onClick={handleCreateClick}
              className="w-full px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3 font-bold"
            >
              <Plus className="w-5 h-5" />
              新建提示词
            </button>

            {user ? (
              <>
                <button
                  onClick={() => {
                    onAccountClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-3 font-bold"
                >
                  <User className="w-5 h-5" />
                  账户中心 ({user.displayName || user.username})
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 font-bold"
                >
                  <LogOut className="w-5 h-5" />
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
                  className="w-full px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3 font-bold"
                >
                  <LogIn className="w-5 h-5" />
                  登录
                </button>
                <button
                  onClick={() => {
                    onRegisterClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-green-600 hover:bg-green-50 rounded-xl transition-colors flex items-center gap-3 font-bold"
                >
                  <LogIn className="w-5 h-5" />
                  注册账户
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
