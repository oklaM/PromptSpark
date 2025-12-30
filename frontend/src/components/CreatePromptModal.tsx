import React, { useState, useEffect } from 'react';
import { promptService } from '../services/promptService';
import { aiService } from '../services/aiService';
import { usePromptStore, Prompt } from '../stores/promptStore';
import { useAuthStore } from '../stores/authStore';
import { Wand2 } from 'lucide-react';

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Prompt | null;
}

export function CreatePromptModal({ isOpen, onClose, onSuccess, initialData }: CreatePromptModalProps) {
  const { addPrompt, updatePrompt } = usePromptStore();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    author: user?.username || 'Anonymous',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        content: initialData.content,
        category: initialData.category,
        author: initialData.author,
        tags: initialData.tags.join(', '),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        category: '',
        author: user?.username || 'Anonymous',
        tags: '',
      });
    }
  }, [initialData, isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSmartAnalyze = async (targetField?: string) => {
    // Require at least one field to be present for context, unless generating from scratch (which we might allow later, but for now let's require something)
    // Actually, let's allow it if user wants to generate from Title/Description
    if (!formData.content && !formData.title && !formData.description) return;

    setIsAnalyzing(true);
    
    try {
      const result = await aiService.analyzeContent({
        content: formData.content,
        title: formData.title,
        description: formData.description
      }, targetField);
      
      setFormData(prev => {
        const newData = { ...prev };
        
        if (!targetField || targetField === 'title') {
          if (result.title) newData.title = result.title;
        }
        
        if (!targetField || targetField === 'description') {
          if (result.description) newData.description = result.description;
        }

        if (targetField === 'content' && result.content) {
             newData.content = result.content;
        }

        if (!targetField || targetField === 'category') {
           if (result.category) newData.category = result.category;
        }
        
        if (!targetField || targetField === 'tags') {
          const newTags = new Set(prev.tags.split(',').map(t => t.trim()).filter(Boolean));
          result.tags?.forEach(tag => newTags.add(tag));
          newData.tags = Array.from(newTags).join(', ');
        }

        return newData;
      });
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const AiButton = ({ field, className = "" }: { field: string, className?: string }) => (
    <button
      type="button"
      onClick={() => handleSmartAnalyze(field)}
      disabled={isAnalyzing || (!formData.content && !formData.title && !formData.description)}
      className={`text-purple-600 hover:text-purple-700 p-1 rounded hover:bg-purple-50 transition-colors ${className}`}
      title={`AI 生成${field === 'title' ? '标题' : field === 'description' ? '描述' : field === 'tags' ? '标签' : '分类'}`}
    >
      <Wand2 className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
    </button>
  );


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const payload = {
        ...formData,
        tags,
      };

      let response;
      if (initialData) {
        response = await promptService.updatePrompt(initialData.id, payload);
      } else {
        response = await promptService.createPrompt(payload);
      }

      if (response.success) {
        if (initialData) {
          updatePrompt(initialData.id, response.data);
        } else {
          addPrompt(response.data);
        }
        
        if (!initialData) {
            setFormData({
            title: '',
            description: '',
            content: '',
            category: '',
            author: 'Anonymous',
            tags: '',
            });
        }
        onClose();
        onSuccess?.();
      } else {
        setError(response.message || `Failed to ${initialData ? 'update' : 'create'} prompt`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <h2 className="text-lg sm:text-xl font-bold">{initialData ? '编辑提示词' : '创建新提示词'}</h2>
            <button
              onClick={onClose}
              className="sm:hidden text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex w-full sm:w-auto justify-end gap-2">
             <button
                type="button"
                onClick={() => handleSmartAnalyze()}
                disabled={isAnalyzing || (!formData.content && !formData.title && !formData.description)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm"
              >
                {isAnalyzing && !formData.content ? (
                   <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                   <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                <span>AI 一键生成</span>
              </button>
              <button
                onClick={onClose}
                className="hidden sm:block text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}


          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                标题 *
              </label>
              <AiButton field="title" />
            </div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="输入提示词标题"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                描述
              </label>
              <AiButton field="description" />
            </div>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="简短描述提示词的用途"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  提示词内容 *
                </label>
                <AiButton field="content" />
              </div>
            </div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="粘贴或输入完整的提示词内容"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  分类
                </label>
                <AiButton field="category" />
              </div>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">选择分类</option>
                <option value="writing">写作</option>
                <option value="coding">编程</option>
                <option value="analysis">分析</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                作者
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="作者名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                标签 (逗号分隔)
              </label>
              <AiButton field="tags" />
            </div>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="例如: AI, 创意, 实用"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm"
            >
              {isLoading ? '提交中...' : initialData ? '保存修改' : '创建提示词'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium text-sm"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
