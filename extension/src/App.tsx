import { useState, useEffect } from 'react';
import { Search, Settings, Copy, Check, ExternalLink, Sparkles, AlertCircle, LogOut } from 'lucide-react';
import axios from 'axios';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export default function App() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [localPrompts, setLocalPrompts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [config, setConfig] = useState({ 
    token: '', 
    baseUrl: 'http://localhost:5000' 
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [view, setView] = useState<'login' | 'list' | 'settings'>('list');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load config and local prompts from Chrome Storage
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['token', 'baseUrl', 'sparkPrompts'], (result) => {
        const hasToken = !!result.token;
        setConfig({ 
          token: result.token || '', 
          baseUrl: result.baseUrl || 'http://localhost:5000' 
        });
        setLocalPrompts(result.sparkPrompts || []);
        
        if (!hasToken) {
          setView('login');
        } else {
          setView('list');
        }
      });
    }
  }, []);

  // Fetch prompts when view changes to list
  useEffect(() => {
    if (config.token && view === 'list') {
      fetchPrompts();
    }
  }, [config.token, view]);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${config.baseUrl}/api/prompts`, {
        headers: { Authorization: `Bearer ${config.token}` }
      });
      setPrompts(res.data.data || []);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setView('login');
      }
      setError(err.response?.data?.message || '无法获取提示词，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (localPrompts.length === 0 || !config.token) return;
    
    setSyncing(true);
    setError(null);
    try {
      await axios.post(`${config.baseUrl}/api/prompts/sync`, 
        { items: localPrompts },
        { headers: { Authorization: `Bearer ${config.token}` } }
      );
      
      // Clear local storage on success
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ sparkPrompts: [] }, () => {
          setLocalPrompts([]);
          fetchPrompts(); // Refresh cloud list
        });
      }
    } catch (err: any) {
      setError('同步失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${config.baseUrl}/api/auth/login`, loginData);
      const token = res.data.token;
      if (token) {
        const newConfig = { ...config, token };
        setConfig(newConfig);
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set(newConfig, () => {
            setView('list');
          });
        } else {
          setView('list');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请检查用户名或密码');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const cleared = { ...config, token: '' };
    setConfig(cleared);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set(cleared, () => setView('login'));
    } else {
      setView('login');
    }
  };

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white fill-current" />
          </div>
          <span className="font-bold text-slate-800">PromptSpark</span>
        </div>
        {view !== 'login' && (
          <button 
            onClick={() => setView(view === 'settings' ? 'list' : 'settings')}
            className={`p-1.5 rounded-lg transition-colors ${view === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        )}
      </header>

      {/* Sync Banner */}
      {view === 'list' && localPrompts.length > 0 && (
        <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-current" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              发现 {localPrompts.length} 个新采集项
            </span>
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-white text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            {syncing ? '同步中...' : '立即上云'}
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {view === 'login' ? (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">欢迎回来</h2>
              <p className="text-xs text-slate-400 mt-1">登录以同步您的提示词库</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">用户名</label>
                <input 
                  type="text" 
                  required
                  value={loginData.username}
                  onChange={e => setLoginData({...loginData, username: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="输入用户名"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">密码</label>
                <input 
                  type="password" 
                  required
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {loading ? '正在登录...' : '立即登录'}
              </button>
            </form>
            <div className="pt-4 border-t text-center">
              <button 
                onClick={() => setView('settings')}
                className="text-[10px] text-slate-400 hover:text-blue-600 font-bold uppercase tracking-wider"
              >
                修改服务器地址
              </button>
            </div>
          </div>
        ) : view === 'settings' ? (
          <div className="space-y-6 py-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">偏好设置</h2>
              <button onClick={() => setView('list')} className="text-xs text-blue-600 font-bold">返回</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">服务器地址</label>
                <input 
                  type="text" 
                  value={config.baseUrl}
                  onChange={e => setConfig({...config, baseUrl: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="http://localhost:5000"
                />
              </div>
              <div className="pt-4 border-t">
                <button 
                  onClick={handleLogout}
                  className="w-full py-2 border border-red-100 text-red-500 bg-red-50/50 hover:bg-red-50 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出当前账户
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative sticky top-0 bg-slate-50 pb-2 z-10">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜索提示词..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
              />
            </div>

            {/* List */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-slate-400">正在同步...</p>
                </div>
              ) : filteredPrompts.length > 0 ? (
                filteredPrompts.map(prompt => (
                  <div key={prompt.id} className="group p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-bold text-slate-800 text-sm truncate pr-2">{prompt.title}</h3>
                      <button 
                        onClick={() => handleCopy(prompt)}
                        className={`p-1.5 rounded-lg transition-all ${copiedId === prompt.id ? 'bg-green-50 text-green-600 scale-110' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                      >
                        {copiedId === prompt.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {prompt.content}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm text-slate-400 italic">未找到相关提示词</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {view === 'list' && (
        <footer className="px-4 py-3 border-t bg-white shrink-0 flex justify-between items-center z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{prompts.length} 个同步项</span>
          </div>
          <a 
            href={config.baseUrl} 
            target="_blank" 
            className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline bg-blue-50 px-2 py-1 rounded-lg transition-colors"
          >
            主站 <ExternalLink className="w-3 h-3" />
          </a>
        </footer>
      )}
    </div>
  );
}