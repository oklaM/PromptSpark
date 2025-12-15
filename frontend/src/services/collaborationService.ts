/**
 * 协作服务
 * 处理权限、评论、讨论和评分的 API 调用
 */

import axiosClient from './axiosClient';

// ========== 权限管理 API ==========

export const grantPermission = async (promptId: string, userId: string, role: string) => {
  const response = await axiosClient.post('/collaboration/permissions/grant', {
    promptId,
    userId,
    role,
  });
  return response.data;
};

export const revokePermission = async (permissionId: string) => {
  const response = await axiosClient.delete(`/collaboration/permissions/${permissionId}`);
  return response.data;
};

export const getPromptPermissions = async (promptId: string) => {
  const response = await axiosClient.get(`/collaboration/prompts/${promptId}/permissions`);
  return response.data;
};

export const checkUserPermission = async (promptId: string) => {
  const response = await axiosClient.get(`/collaboration/prompts/${promptId}/check-permission`);
  return response.data;
};

// ========== 评论 API ==========

export const createComment = async (promptId: string, content: string, parentId?: string) => {
  const response = await axiosClient.post('/collaboration/comments', {
    promptId,
    content,
    parentId: parentId || null,
  });
  return response.data;
};

export const getComments = async (promptId: string, parentId?: string) => {
  const response = await axiosClient.get(`/collaboration/prompts/${promptId}/comments`, {
    params: { parentId },
  });
  return response.data;
};

export const deleteComment = async (commentId: string) => {
  const response = await axiosClient.delete(`/collaboration/comments/${commentId}`);
  return response.data;
};

export const likeComment = async (commentId: string) => {
  const response = await axiosClient.post(`/collaboration/comments/${commentId}/like`);
  return response.data;
};

// ========== 讨论 API ==========

export const createDiscussion = async (promptId: string, title: string, description: string) => {
  const response = await axiosClient.post('/collaboration/discussions', {
    promptId,
    title,
    description,
  });
  return response.data;
};

export const getDiscussions = async (promptId: string) => {
  const response = await axiosClient.get(`/collaboration/prompts/${promptId}/discussions`);
  return response.data;
};

export const updateDiscussionStatus = async (discussionId: string, status: string) => {
  const response = await axiosClient.put(`/collaboration/discussions/${discussionId}/status`, {
    status,
  });
  return response.data;
};

// ========== 评分 API ==========

export const submitRating = async (
  promptId: string,
  score: number,
  feedback?: string,
  helpfulness?: number,
  accuracy?: number,
  relevance?: number
) => {
  const response = await axiosClient.post('/collaboration/ratings', {
    promptId,
    score,
    feedback,
    helpfulness,
    accuracy,
    relevance,
  });
  return response.data;
};

export const getPromptRatings = async (promptId: string) => {
  const response = await axiosClient.get(`/collaboration/prompts/${promptId}/ratings`);
  return response.data;
};

export const getPromptStats = async (promptId: string) => {
  const response = await axiosClient.get(`/collaboration/prompts/${promptId}/stats`);
  return response.data;
};

export const deleteRating = async (ratingId: string) => {
  const response = await axiosClient.delete(`/collaboration/ratings/${ratingId}`);
  return response.data;
};
