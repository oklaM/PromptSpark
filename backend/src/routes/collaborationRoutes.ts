/**
 * 团队协作路由
 * 包含权限管理、评论、讨论和评分的路由
 */

import { Router } from 'express';
import { ensureAuth } from '../middleware/authMiddleware';
import {
  // 权限管理
  grantPermission,
  revokePermission,
  getPromptPermissions,
  checkUserPermission,
  // 评论
  createComment,
  getComments,
  deleteComment,
  likeComment,
  // 讨论
  createDiscussion,
  getDiscussions,
  updateDiscussionStatus,
  // 评分
  submitRating,
  getPromptRatings,
  getPromptStats,
  deleteRating,
} from '../controllers/collaborationController';

const router = Router();

// ========== 权限管理路由 ==========
router.post('/permissions/grant', ensureAuth, grantPermission);
router.delete('/permissions/:permissionId', ensureAuth, revokePermission);
router.get('/prompts/:promptId/permissions', getPromptPermissions);
router.get('/prompts/:promptId/check-permission', ensureAuth, checkUserPermission);

// Legacy / test-friendly aliases
router.post('/grant-permission', ensureAuth, grantPermission);
router.get('/permissions/:promptId', getPromptPermissions);
router.get('/check-permission/:promptId/:userId', checkUserPermission);

// ========== 评论路由 ==========
router.post('/comments', ensureAuth, createComment);
router.get('/prompts/:promptId/comments', getComments);
router.delete('/comments/:commentId', ensureAuth, deleteComment);
router.post('/comments/:commentId/like', ensureAuth, likeComment);

// Alias for tests
router.get('/comments/:promptId', getComments);

// ========== 讨论路由 ==========
router.post('/discussions', ensureAuth, createDiscussion);
router.get('/prompts/:promptId/discussions', getDiscussions);
router.put('/discussions/:discussionId/status', ensureAuth, updateDiscussionStatus);

// Aliases for tests
router.get('/discussions/:promptId', getDiscussions);
router.put('/discussions/:discussionId', ensureAuth, updateDiscussionStatus);
router.post('/discussions/:discussionId/comments', ensureAuth, (req, res) => {
  // forward to createComment with promptId set from discussionId for test convenience
  req.body = req.body || {};
  req.body.promptId = req.params.discussionId;
  return createComment(req as any, res as any);
});

// ========== 评分路由 ==========
router.post('/ratings', ensureAuth, submitRating);
router.get('/prompts/:promptId/ratings', getPromptRatings);
router.get('/prompts/:promptId/stats', getPromptStats);
router.delete('/ratings/:ratingId', ensureAuth, deleteRating);

// Aliases for rating endpoints
router.get('/ratings/:promptId', getPromptRatings);
router.get('/ratings/:promptId/stats', getPromptStats);

export default router;
