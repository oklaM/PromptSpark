import { useState } from 'react';
import { usePrompts, usePromptDetail } from './hooks/usePrompts';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { PromptCard } from './components/PromptCard';
import { PromptDetail } from './components/PromptDetail';
import { CreatePromptModal } from './components/CreatePromptModal';
import { usePromptStore } from './stores/promptStore';

type ViewType = 'list' | 'detail';

function App() {
  const [viewType, setViewType] = useState<ViewType>('list');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">✨</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PromptSpark</h1>
              <span className="text-sm text-gray-500 ml-2">提示词管理系统</span>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建提示词
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewType === 'list' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="mb-6">
                <SearchBar />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      {...prompt}
                      onClick={() => handleSelectPrompt(prompt.id)}
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
              className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
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

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm">
          <p>© 2024 PromptSpark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
