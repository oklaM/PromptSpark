import React, { useState, useEffect } from 'react';
import { getComments, createComment, deleteComment, likeComment } from '../services/collaborationService';
import { useAuthStore } from '../stores/authStore';

interface Comment {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null;
  likes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface CommentThreadProps {
  promptId: string;
  parentId?: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ promptId, parentId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuthStore();

  useEffect(() => {
    loadComments();
  }, [promptId, parentId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(promptId, parentId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await createComment(promptId, newComment, parentId);
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除此评论吗？')) return;

    try {
      await deleteComment(commentId);
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await likeComment(commentId);
      loadComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    setReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  if (loading) {
    return <div className="text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 评论输入框 */}
      {user && (
        <form onSubmit={handleSubmitComment} className="bg-gray-50 p-4 rounded-lg">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="添加您的评论..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            发布评论
          </button>
        </form>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">暂无评论</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{comment.userName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                {user?.id === comment.userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    删除
                  </button>
                )}
              </div>
              <p className="mt-2 text-gray-700">{comment.content}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  👍 {comment.likes}
                </button>
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="text-gray-500 hover:text-blue-500"
                >
                  💬 回复
                </button>
              </div>

              {/* 回复框 */}
              {replies[comment.id] && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-300">
                  <CommentThread promptId={promptId} parentId={comment.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentThread;
