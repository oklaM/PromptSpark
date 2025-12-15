/**
 * 评论模型
 * 用于管理提示词的评论和讨论
 */

export interface Comment {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  content: string;
  parentId: string | null; // 用于回复的父评论 ID
  likes: number;
  likedBy: string[]; // 点赞用户列表
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Discussion {
  id: string;
  promptId: string;
  title: string;
  description: string;
  initiatorId: string;
  initiatorName: string;
  commentCount: number;
  lastCommentAt: string;
  status: 'open' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}
