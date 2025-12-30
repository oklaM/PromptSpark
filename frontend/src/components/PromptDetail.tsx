import { useState, useEffect } from 'react';
import { Edit, X, Play, Activity, Code } from 'lucide-react';
import { PermissionManagement } from './PermissionManagement';
import { HistoryList } from './HistoryList';
import { CommentThread } from './CommentThread';
import { RatingComponent } from './RatingComponent';
import { PromptPlayground } from './PromptPlayground';
import { PromptDiagnosis } from './PromptDiagnosis';
import { SdkIntegrationModal } from './SdkIntegrationModal';
import { useAuthStore } from '../stores/authStore';
import { aiService } from '../services/aiService';

interface PromptDetailProps {
  id?: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  onClose?: () => void;
  onEdit?: () => void;
}

export function PromptDetail({
  id = '',
  title,
  description,
  content,
  category,
  author,
  views,
  likes,
  tags,
  createdAt,
  updatedAt,
  onClose,
  onEdit,
}: PromptDetailProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);
  const [showSdk, setShowSdk] = useState(false);
  const [evalStats, setEvalStats] = useState<{ total: number, good: number, bad: number, passRate: number } | null>(null);
  const { user } = useAuthStore();
  const isOwner = user?.username === author;

  useEffect(() => {
    if (id) {
      aiService.getEvalStats(id).then(setEvalStats).catch(console.error);
    }
  }, [id, showPlayground]);

  const handleCopyContent = () => {
    navigator.clipboard.writeText(content);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              <p className="text-blue-100 text-lg">{description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPlayground(true)}
                className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors font-medium backdrop-blur-sm"
                title="在线运行"
              >
                <Play className="w-5 h-5 fill-current" />
                <span className="hidden sm:inline">运行</span>
              </button>
              <button
                onClick={() => setShowSdk(true)}
                className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors font-medium backdrop-blur-sm"
                title="开发者集成"
              >
                <Code className="w-5 h-5" />
                <span className="hidden sm:inline">SDK</span>
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 text-blue-100 hover:text-white hover:bg-blue-600/50 rounded-full transition-colors"
                  title="编辑"
                >
                  <Edit className="w-6 h-6" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-blue-100 hover:text-white hover:bg-blue-600/50 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-500 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex gap-6 text-sm">
            <span>分类: {category || '未分类'}</span>
            <span>作者: {author}</span>
            <span>创建于: {formatDate(createdAt)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 px-6 py-3 border-b flex gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            浏览: {views}
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            点赞: {likes}
          </div>
          {evalStats && evalStats.total > 0 && (
            <div className="flex items-center gap-2" title={`${evalStats.good} good / ${evalStats.bad} bad`}>
              <Activity className="w-4 h-4 text-green-600" />
              <span className={evalStats.passRate >= 0.8 ? 'text-green-600 font-medium' : evalStats.passRate >= 0.5 ? 'text-yellow-600' : 'text-red-600'}>
                通过率: {Math.round(evalStats.passRate * 100)}% ({evalStats.total} 次测试)
              </span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="p-6">
          {/* Content Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">提示词内容</h2>
            <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap break-words">
                {content}
              </pre>
              <button
                onClick={handleCopyContent}
                className="absolute top-2 right-2 p-2 bg-white rounded border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                title="复制内容"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* AI Diagnosis Section */}
          <div className="mb-8">
            <PromptDiagnosis content={content} />
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-8">
            {updatedAt && <span>最后更新: {formatDate(updatedAt)}</span>}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-500 hover:text-blue-700 hover:underline"
            >
              {showHistory ? '隐藏历史' : '查看历史记录'}
            </button>
          </div>

          {/* History Section */}
          {showHistory && id && (
            <div className="mb-8 border border-blue-100 rounded-lg p-4 bg-blue-50/30">
              <h3 className="text-lg font-bold mb-4 text-gray-800">历史版本</h3>
              <HistoryList
                promptId={id}
                onRevertSuccess={() => {
                  window.location.reload();
                }}
              />
            </div>
          )}

          {/* Permissions Section (Owner Only) */}
          {id && isOwner && (
            <div className="mb-8">
               <PermissionManagement promptId={id} isOwner={isOwner} />
            </div>
          )}

          <hr className="my-8 border-gray-200" />

          {/* Ratings Section */}
          {id && (
            <div className="mb-8">
              <RatingComponent promptId={id} />
            </div>
          )}

          <hr className="my-8 border-gray-200" />

          {/* Comments Section */}
          {id && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">评论</h3>
              <CommentThread promptId={id} />
            </div>
          )}
        </div>
      </div>

      <PromptPlayground
        isOpen={showPlayground}
        onClose={() => setShowPlayground(false)}
        initialPrompt={content}
        promptId={id}
      />

      <SdkIntegrationModal
        isOpen={showSdk}
        onClose={() => setShowSdk(false)}
        promptId={id}
      />
    </div>
  );
}