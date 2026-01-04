import { useState } from 'react';
import { Check, X, Wand2, Loader2 } from 'lucide-react';

interface OptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  onApply: (newContent: string) => void;
  isLoading: boolean;
  optimizedResult: { optimized: string; changes: string[] } | null;
  onOptimize: (goal: 'quality' | 'detail' | 'creative') => void;
}

export function OptimizeModal({ 
  isOpen, 
  onClose, 
  originalContent, 
  onApply, 
  isLoading, 
  optimizedResult,
  onOptimize 
}: OptimizeModalProps) {
  const [goal, setGoal] = useState<'quality' | 'detail' | 'creative'>('quality');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            <h2 className="text-lg font-bold">AI 智能润色</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {!optimizedResult ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-800">选择优化目标</h3>
                <p className="text-slate-500">AI 将根据您的选择重写提示词，提升生成效果</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                <button 
                  onClick={() => setGoal('quality')}
                  className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${goal === 'quality' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-100' : 'border-slate-200 bg-white hover:border-purple-300'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">✨</div>
                  <div className="font-bold text-slate-800">画质增强</div>
                  <div className="text-xs text-slate-500">添加 8k, masterpiece 等高质量修饰词</div>
                </button>
                
                <button 
                  onClick={() => setGoal('detail')}
                  className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${goal === 'detail' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">🔍</div>
                  <div className="font-bold text-slate-800">丰富细节</div>
                  <div className="text-xs text-slate-500">扩充光影、材质和环境描述</div>
                </button>
                
                <button 
                  onClick={() => setGoal('creative')}
                  className={`p-4 rounded-xl border-2 transition-all text-left space-y-2 ${goal === 'creative' ? 'border-pink-600 bg-pink-50 ring-2 ring-pink-100' : 'border-slate-200 bg-white hover:border-pink-300'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">🎨</div>
                  <div className="font-bold text-slate-800">创意重写</div>
                  <div className="text-xs text-slate-500">增加艺术风格和独特的视觉元素</div>
                </button>
              </div>

              <button
                onClick={() => onOptimize(goal)}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                {isLoading ? 'AI 正在思考...' : '开始优化'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Diff View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase">原始 Prompt</div>
                  <div className="p-4 bg-white border border-red-100 rounded-lg text-sm text-slate-600 whitespace-pre-wrap h-64 overflow-y-auto">
                    {originalContent}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    优化后
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px]">AI Generated</span>
                  </div>
                  <div className="p-4 bg-white border-2 border-green-500/20 rounded-lg text-sm text-slate-800 whitespace-pre-wrap h-64 overflow-y-auto shadow-sm ring-1 ring-green-500/10">
                    {optimizedResult.optimized}
                  </div>
                </div>
              </div>

              {/* Changes Summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-800 mb-2">优化详情</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {optimizedResult.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-blue-700">
                      <Check className="w-3 h-3 mt-0.5 shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {optimizedResult && (
          <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
            <button 
              onClick={() => onOptimize(goal)} // Re-run
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
            >
              重试
            </button>
            <button 
              onClick={() => onApply(optimizedResult.optimized)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              应用修改
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
