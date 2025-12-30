import React, { useState } from 'react';
import { aiService, PromptDiagnosis as DiagnosisType } from '../services/aiService';
import { Activity, ShieldCheck, Zap, Lightbulb, Loader2 } from 'lucide-react';

interface PromptDiagnosisProps {
  content: string;
}

export const PromptDiagnosis: React.FC<PromptDiagnosisProps> = ({ content }) => {
  const [diagnosis, setDiagnosis] = useState<DiagnosisType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDiagnose = async () => {
    if (!content) return;
    setLoading(true);
    setError('');
    try {
      const result = await aiService.diagnosePrompt(content);
      setDiagnosis(result);
    } catch (err) {
      setError('无法完成诊断，请检查 AI 配置');
    } finally {
      setLoading(false);
    }
  };

  if (!diagnosis && !loading) {
    return (
      <button
        onClick={handleDiagnose}
        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors font-medium text-sm"
      >
        <Activity className="w-4 h-4" />
        AI 智能评分诊断
      </button>
    );
  }

  return (
    <div className="bg-white border border-purple-100 rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Prompt 诊断报告
        </h3>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-purple-500" />}
      </div>

      {loading && !diagnosis && (
        <div className="text-center py-8 text-gray-500">正在分析您的提示词...</div>
      )}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>
      )}

      {diagnosis && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Score Section */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * diagnosis.score) / 100}
                  className={`${
                    diagnosis.score >= 80 ? 'text-green-500' :
                    diagnosis.score >= 60 ? 'text-yellow-500' : 'text-red-500'
                  } transition-all duration-1000 ease-out`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">{diagnosis.score}</span>
                <span className="text-xs text-gray-500">分</span>
              </div>
            </div>
            
            <div className="flex-1">
              <p className="text-gray-600 text-sm">
                {diagnosis.score >= 80 ? '这是一个高质量的 Prompt，继续保持！' :
                 diagnosis.score >= 60 ? '质量尚可，但仍有优化空间。' :
                 '建议根据下方的建议进行重写。'}
              </p>
            </div>
          </div>

          {/* Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" /> 清晰度
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">{diagnosis.clarity}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 text-sm flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4" /> 安全性
              </h4>
              <p className="text-xs text-green-700 leading-relaxed">{diagnosis.safety}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800 text-sm flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" /> 逻辑性
              </h4>
              <p className="text-xs text-orange-700 leading-relaxed">{diagnosis.logic}</p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-3">💡 改进建议</h4>
            <ul className="space-y-2">
              {diagnosis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-purple-500 font-bold">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-end">
            <button onClick={() => handleDiagnose()} className="text-xs text-purple-600 hover:underline">
                重新诊断
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
