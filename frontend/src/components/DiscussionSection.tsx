import React, { useState, useEffect } from 'react';
import {
  createDiscussion,
  getDiscussions,
  updateDiscussionStatus,
} from '../services/collaborationService';
import { CommentThread } from './CommentThread';
import { useAuthStore } from '../stores/authStore';

interface Discussion {
  id: string;
  promptId: string;
  title: string;
  description: string;
  initiatorName: string;
  commentCount: number;
  lastCommentAt: string;
  status: 'open' | 'resolved' | 'closed';
  createdAt: string;
}

interface DiscussionComponentProps {
  promptId: string;
}

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  open: '开放中',
  resolved: '已解决',
  closed: '已关闭',
};

export const DiscussionSection: React.FC<DiscussionComponentProps> = ({ promptId }) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    loadDiscussions();
  }, [promptId]);

  const loadDiscussions = async () => {
    try {
      const data = await getDiscussions(promptId);
      setDiscussions(data);
    } catch (error) {
      console.error('Failed to load discussions:', error);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    try {
      setLoading(true);
      await createDiscussion(promptId, title, description);
      setTitle('');
      setDescription('');
      setShowNewForm(false);
      loadDiscussions();
    } catch (error) {
      console.error('Failed to create discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (discussionId: string, newStatus: string) => {
    try {
      await updateDiscussionStatus(discussionId, newStatus);
      loadDiscussions();
    } catch (error) {
      console.error('Failed to update discussion status:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-xl font-bold mb-4">💬 讨论区</h3>

      {/* 新建讨论按钮 */}
      {user && !showNewForm && (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
        >
          开启新讨论
        </button>
      )}

      {/* 新建讨论表单 */}
      {user && showNewForm && (
        <form onSubmit={handleCreateDiscussion} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">讨论标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入讨论标题..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">讨论描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述您的讨论主题..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建讨论'}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {/* 讨论列表 */}
      <div className="space-y-4">
        {discussions.length === 0 ? (
          <p className="text-center text-gray-500">暂无讨论</p>
        ) : (
          discussions.map((discussion) => (
            <div key={discussion.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* 讨论头 */}
              <div className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100" onClick={() => setSelectedDiscussion(selectedDiscussion === discussion.id ? null : discussion.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{discussion.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[discussion.status]}`}>
                        {STATUS_LABELS[discussion.status]}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{discussion.description}</p>
                    <p className="text-xs text-gray-500">
                      由 {discussion.initiatorName} 发起于 {new Date(discussion.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600">{discussion.commentCount}</p>
                    <p className="text-xs text-gray-600">条评论</p>
                  </div>
                </div>
              </div>

              {/* 讨论内容 */}
              {selectedDiscussion === discussion.id && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  {/* 状态切换 */}
                  {user && (
                    <div className="mb-4 flex gap-2">
                      {(['open', 'resolved', 'closed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleChangeStatus(discussion.id, status)}
                          className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                            discussion.status === status
                              ? STATUS_COLORS[status]
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 评论线程 */}
                  <CommentThread promptId={promptId} parentId={discussion.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscussionSection;
