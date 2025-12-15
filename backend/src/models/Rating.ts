/**
 * 评分模型
 * 用于管理提示词的评分和反馈
 */

export interface Rating {
  id: string;
  promptId: string;
  userId: string;
  userName: string;
  score: number; // 1-5
  feedback: string;
  helpfulness: number; // 0-100，有用性评分
  accuracy: number; // 0-100，准确性评分
  relevance: number; // 0-100，相关性评分
  createdAt: string;
  updatedAt: string;
}

export interface PromptStats {
  promptId: string;
  averageScore: number;
  totalRatings: number;
  averageHelpfulness: number;
  averageAccuracy: number;
  averageRelevance: number;
  ratingDistribution: {
    [key: number]: number; // 1-5 评分的数量分布
  };
  lastUpdated: string;
}
