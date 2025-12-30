import React, { useState, useEffect } from 'react';
import { useSettingsStore, AiProvider } from '../stores/settingsStore';
import { Settings, Save, Key, Plus, Trash2, Copy } from 'lucide-react';
import { tokenService, ApiToken } from '../services/tokenService';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../context/ToastContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'ai' | 'api';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { config, setConfig } = useSettingsStore();
  const [formData, setFormData] = useState(config);
  const [activeTab, setActiveTab] = useState<Tab>('ai');
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const { user } = useAuthStore();
  const { show } = useToast();
  
  useEffect(() => {
    if (isOpen) {
        setFormData(config);
        // Reset to AI tab usually, or keep last? Let's reset.
        setActiveTab('ai');
    }
  }, [isOpen, config]);

  useEffect(() => {
    if (isOpen && activeTab === 'api' && user) {
        loadTokens();
    }
  }, [isOpen, activeTab, user]);

  const loadTokens = async () => {
      try {
          const list = await tokenService.listTokens();
          setTokens(list);
      } catch (err) {
          console.error('Failed to load tokens', err);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'provider' ? value as AiProvider : value 
    }));
  };

  const handleSave = () => {
    setConfig(formData);
    onClose();
  };

  const handleCreateToken = async () => {
      if (!newTokenName.trim()) return;
      try {
          const token = await tokenService.createToken(newTokenName);
          setTokens([token, ...tokens]);
          setNewTokenName('');
          show('Token created', 'success');
      } catch (err) {
          show('Failed to create token', 'error');
      }
  };

  const handleRevokeToken = async (id: string) => {
      try {
          await tokenService.revokeToken(id);
          setTokens(tokens.filter(t => t.id !== id));
          show('Token revoked', 'success');
      } catch (err) {
          show('Failed to revoke token', 'error');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            设置
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b mb-4">
            <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('ai')}
            >
                AI 模型配置
            </button>
            <button
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'api' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('api')}
            >
                开发者 API
            </button>
        </div>

        {activeTab === 'ai' ? (
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                AI 提供商
                </label>
                <select
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="auto">自动 (默认)</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="custom">自定义 (OpenAI 兼容)</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
                </label>
                <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                您的 Key 仅存储在本地浏览器中，用于调用 AI 服务。
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                模型名称
                </label>
                <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. gpt-4, gemini-pro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL (可选)
                </label>
                <input
                type="text"
                name="baseUrl"
                value={formData.baseUrl || ''}
                onChange={handleChange}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.provider === 'deepseek' && !formData.baseUrl && (
                <p className="text-xs text-gray-500 mt-1">默认为: https://api.deepseek.com</p>
                )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    取消
                </button>
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    保存配置
                </button>
            </div>
            </div>
        ) : (
            <div>
                {!user ? (
                    <div className="text-center py-8 text-gray-500">
                        <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>请先登录以管理 API Tokens</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                placeholder="Token 名称 (e.g. Test App)"
                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                                onClick={handleCreateToken}
                                disabled={!newTokenName.trim()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                生成
                            </button>
                        </div>

                        <div className="space-y-3">
                            {tokens.map(token => (
                                <div key={token.id} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-gray-900">{token.name}</span>
                                        <button
                                            onClick={() => handleRevokeToken(token.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="撤销"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white border p-2 rounded">
                                        <code className="text-xs text-gray-600 flex-1 truncate font-mono">{token.token}</code>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(token.token);
                                                show('Copied', 'success');
                                            }}
                                            className="text-gray-400 hover:text-blue-600"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400 flex justify-between">
                                        <span>Created: {new Date(token.createdAt).toLocaleDateString()}</span>
                                        {token.lastUsedAt && <span>Last used: {new Date(token.lastUsedAt).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            ))}
                            {tokens.length === 0 && (
                                <p className="text-center text-gray-500 py-4 text-sm">暂无 API Tokens</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
