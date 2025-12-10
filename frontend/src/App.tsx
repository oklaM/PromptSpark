import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { usePrompts, usePromptDetail } from './hooks/usePrompts';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { PromptCard } from './components/PromptCard';
import { BulkActions } from './components/BulkActions';
import { PromptDetail } from './components/PromptDetail';
import { CreatePromptModal } from './components/CreatePromptModal';
import { usePromptStore } from './stores/promptStore';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AccountProfile } from './components/AccountProfile';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';

type ViewType = 'list' | 'detail';

function AppContent() {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const prompts = usePrompts();
  const currentPrompt = usePromptDetail(selectedPromptId || '');
  const { isLoading, error } = usePromptStore();

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setViewType('detail');
  };

  const handleBack = () => {
    setViewType('list');
    setSelectedPromptId(null);
  };

  const handleCreateSuccess = () => {
    // 可以刷新列表
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => selected ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
  };

  const clearSelection = () => setSelectedIds([]);

  const handleDuplicate = async (id: string) => {
    // call service to duplicate and optionally refresh
    // lightweight: just alert for now
    try {
      // dynamic import to avoid circular issues
      const { promptService } = await import('./services/promptService');
      await promptService.duplicatePrompt(id);
      // refresh by setting a store or reloading prompts in hook
    } catch (err) {
      console.error('Duplicate failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <Header
        onCreateClick={() => setShowCreateModal(true)}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
        onAccountClick={() => setShowAccount(true)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {viewType === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            {/* Sidebar - Hidden on mobile, visible on md+ */}
            <div className="hidden md:block md:col-span-1">
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="col-span-1 md:col-span-3">
              {/* Search Bar */}
              <div className="mb-6">
                <SearchBar />
              </div>

              {/* Bulk Actions Bar */}
              <div className="mb-4 overflow-x-auto">
                <BulkActions selectedIds={selectedIds} onCleared={clearSelection} onImported={() => { /* refresh */ }} />
              </div>

              {/* Prompts Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">加载中...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="font-medium">加载失败</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : prompts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      {...prompt}
                      onClick={() => handleSelectPrompt(prompt.id)}
                      selected={selectedIds.includes(prompt.id)}
                      onSelect={handleSelect}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">未找到提示词</h3>
                  <p className="text-gray-600">尝试更改搜索条件或创建新的提示词</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              返回列表
            </button>

            {currentPrompt ? (
              <PromptDetail {...currentPrompt} onClose={handleBack} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">加载中...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreatePromptModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Login/Register/Account Modals */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg">
            <LoginForm onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}
      {showRegister && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg">
            <RegisterForm onClose={() => setShowRegister(false)} />
          </div>
        </div>
      )}
      {showAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg">
            <AccountProfile onClose={() => setShowAccount(false)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>© 2024 PromptSpark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
