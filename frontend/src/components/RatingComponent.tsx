import React, { useState, useEffect } from 'react';
import {
  submitRating,
  getPromptRatings,
  getPromptStats,
  deleteRating,
} from '../services/collaborationService';
import { useAuthStore } from '../stores/authStore';

interface RatingData {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  score: number;
  feedback: string;
  helpfulness: number;
  accuracy: number;
  relevance: number;
  createdAt: string;
}

interface PromptStats {
  promptId: string;
  averageScore: number;
  totalRatings: number;
  averageHelpfulness: number;
  averageAccuracy: number;
  averageRelevance: number;
  ratingDistribution: Record<number, number>;
  lastUpdated: string;
}

interface RatingComponentProps {
  promptId: string;
}

export const RatingComponent: React.FC<RatingComponentProps> = ({ promptId }) => {
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [stats, setStats] = useState<PromptStats | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [helpfulness, setHelpfulness] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [relevance, setRelevance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadRatings();
    loadStats();
  }, [promptId]);

  const loadRatings = async () => {
    try {
      const data = await getPromptRatings(promptId);
      setRatings(data);
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getPromptStats(promptId);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userRating === 0) return;

    try {
      setLoading(true);
      await submitRating(promptId, userRating, feedback, helpfulness, accuracy, relevance);
      setUserRating(0);
      setFeedback('');
      setHelpfulness(0);
      setAccuracy(0);
      setRelevance(0);
      setShowForm(false);
      loadRatings();
      loadStats();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId: string) => {
    if (!confirm('确定要删除此评分吗？')) return;

    try {
      await deleteRating(ratingId);
      loadRatings();
      loadStats();
    } catch (error) {
      console.error('Failed to delete rating:', error);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= score ? 'text-yellow-400' : 'text-gray-300'}>
            ⭐
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold mb-4">评分和反馈</h3>

      {/* 评分统计 */}
      {stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}</div>
              <div>
                <div>{renderStars(Math.round(stats.averageScore))}</div>
                <p className="text-sm text-gray-600">{stats.totalRatings} 个评分</p>
              </div>
            </div>
          </div>

          {/* 评分分布 */}
          <div className="space-y-2 text-sm">
            {[5, 4, 3, 2, 1].map((score) => (
              <div key={score} className="flex items-center gap-2">
                <span className="w-8">{score} ⭐</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats.totalRatings > 0
                          ? (stats.ratingDistribution[score] / stats.totalRatings) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right">{stats.ratingDistribution[score] || 0}</span>
              </div>
            ))}
          </div>

          {/* 详细分析 */}
          <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">有用性</p>
              <p className="font-semibold">{stats.averageHelpfulness.toFixed(1)}/100</p>
            </div>
            <div>
              <p className="text-gray-600">准确性</p>
              <p className="font-semibold">{stats.averageAccuracy.toFixed(1)}/100</p>
            </div>
            <div>
              <p className="text-gray-600">相关性</p>
              <p className="font-semibold">{stats.averageRelevance.toFixed(1)}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* 评分输入表单 */}
      {user && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          📝 发表评分
        </button>
      )}

      {user && showForm && (
        <form onSubmit={handleSubmitRating} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">您的评分</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setUserRating(i)}
                  className={`text-3xl transition-transform ${
                    i <= userRating ? 'scale-125 text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">反馈意见</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="分享您的使用体验..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* 详细评分 */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: '有用性', value: helpfulness, setter: setHelpfulness },
              { label: '准确性', value: accuracy, setter: setAccuracy },
              { label: '相关性', value: relevance, setter: setRelevance },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label className="block text-sm font-semibold mb-2">{label}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => setter(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-600 mt-1">{value}/100</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={userRating === 0 || loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '提交评分'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* 评分列表 */}
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">最近的评分</h4>
        {ratings.length === 0 ? (
          <p className="text-center text-gray-500">暂无评分</p>
        ) : (
          ratings.slice(0, 5).map((rating) => (
            <div key={rating.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{rating.userName}</p>
                  <div className="mt-1">{renderStars(rating.score)}</div>
                </div>
                {user?.id === rating.userId && (
                  <button
                    onClick={() => handleDeleteRating(rating.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
              {rating.feedback && <p className="text-gray-700 text-sm mb-2">{rating.feedback}</p>}
              <p className="text-xs text-gray-500">
                {new Date(rating.createdAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RatingComponent;
