import { useState } from 'react';
import { promptService } from './services/promptService';
import { ChevronLeft, Plus, Upload } from 'lucide-react';
import { usePrompts, usePromptDetail } from './hooks/usePrompts';
import { Sidebar } from './components/Sidebar';
import { PromptCard } from './components/PromptCard';
import { BulkActions } from './components/BulkActions';
import { PromptDetail } from './components/PromptDetail';
import { CreatePromptModal } from './components/CreatePromptModal';
import { usePromptStore } from './stores/promptStore';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AccountProfile } from './components/AccountProfile';
import { SettingsModal } from './components/SettingsModal';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/Header';

type ViewType = 'list' | 'detail';

function AppContent() {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const { prompts, refresh } = usePrompts();
  const currentPrompt = usePromptDetail(selectedPromptId || '');
  const { isLoading, error } = usePromptStore();
  const { show: toast } = useToast();

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setViewType('detail');
  };

  const handleBack = () => {
    setViewType('list');
    setSelectedPromptId(null);
    refresh();
  };

  const handleEdit = () => {
    if (currentPrompt) {
      setEditingPrompt(currentPrompt);
      setShowCreateModal(true);
    }
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingPrompt(null);
  };

  const handleCreateSuccess = () => {
    refresh();
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => selected ? [...new Set([...prev, id])] : prev.filter(x => x !== id));
  };

  const clearSelection = () => setSelectedIds([]);

  const handleDuplicate = async (id: string) => {
    try {
      await promptService.duplicatePrompt(id);
      refresh();
    } catch (err) {
      console.error('Duplicate failed', err);
    }
  };

  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      await promptService.importPrompts(items);
      toast('导入成功', 'success');
      refresh();
    } catch (err) {
      console.error('Import failed', err);
      toast('导入失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header
        onCreateClick={() => setShowCreateModal(true)}
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
        onAccountClick={() => setShowAccount(true)}
        onSettingsClick={() => setShowSettings(true)}
        onFilterClick={() => setShowMobileSidebar(true)}
        showSearch={viewType === 'list'}
        renderImportButton={
          <label className="flex items-center justify-center gap-2 px-3 h-10 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-600 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-all">
            <Upload className="w-4 h-4" />
            <span className="hidden lg:inline text-xs font-bold">导入</span>
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
        }
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
        {viewType === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            <div className={`
              fixed inset-0 z-50 md:relative md:inset-auto md:z-0 transition-opacity duration-300 md:block md:col-span-1
              ${showMobileSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}
            `}>
              <div 
                className="absolute inset-0 bg-black/40 md:hidden" 
                onClick={() => setShowMobileSidebar(false)}
              ></div>
              <div className={`
                relative w-72 h-full md:w-full md:h-auto transform transition-transform duration-300 md:transform-none
                ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              `}>
                <Sidebar onMobileClose={() => setShowMobileSidebar(false)} />
              </div>
            </div>

            <div className="col-span-1 md:col-span-3">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 pb-24 md:pb-0">
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
              <PromptDetail
                {...currentPrompt}
                onClose={handleBack}
                onEdit={handleEdit}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">加载中...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {viewType === 'list' && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed right-6 bottom-24 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
          title="新建提示词"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {viewType === 'list' && selectedIds.length > 0 && (
        <div className="fixed bottom-8 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-2 pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-300 max-w-fit">
            <BulkActions selectedIds={selectedIds} onCleared={clearSelection} onSuccess={refresh} />
          </div>
        </div>
      )}

      <CreatePromptModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleCreateSuccess}
        initialData={editingPrompt}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <LoginForm 
              onClose={() => setShowLogin(false)} 
              onSwitchToRegister={() => {
                setShowLogin(false);
                setShowRegister(true);
              }}
            />
          </div>
        </div>
      )}
      {showRegister && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <RegisterForm onClose={() => setShowRegister(false)} />
          </div>
        </div>
      )}
      {showAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <AccountProfile onClose={() => setShowAccount(false)} />
          </div>
        </div>
      )}

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>© 2025 PromptSpark. All rights reserved.</p>
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