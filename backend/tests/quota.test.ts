import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { checkStorageQuota, checkAiQuota } from '../src/middleware/quotaMiddleware';
import { database } from '../src/db/database';
import { SubscriptionModel } from '../src/models/Subscription';

// Mock dependencies
vi.mock('../src/db/database');
vi.mock('../src/models/Subscription');

describe('Quota Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 'test-user-id',
        username: 'testuser'
      }
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
  });

  describe('checkStorageQuota', () => {
    it('should call next when user has storage available', async () => {
      const mockSub = {
        plan: 'free',
        storageLimit: 50,
        aiLimit: 5,
        aiUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      };

      vi.mocked(database.get).mockResolvedValue({ count: '10' });
      vi.mocked(SubscriptionModel.getByUserId).mockResolvedValue(mockSub);

      await checkStorageQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when storage quota is exceeded', async () => {
      const mockSub = {
        plan: 'free',
        storageLimit: 50,
        aiLimit: 5,
        aiUsedToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0]
      };

      vi.mocked(database.get).mockResolvedValue({ count: '50' });
      vi.mocked(SubscriptionModel.getByUserId).mockResolvedValue(mockSub);

      await checkStorageQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'QUOTA_EXCEEDED',
          data: expect.objectContaining({
            current: 50,
            limit: 50,
            plan: 'free'
          })
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await checkStorageQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(database.get).mockRejectedValue(new Error('Database error'));

      await checkStorageQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to check storage quota'
        })
      );
    });
  });

  describe('checkAiQuota', () => {
    it('should call next when user has AI quota available', async () => {
      const mockSub = {
        plan: 'free',
        storageLimit: 50,
        aiLimit: 5,
        aiUsedToday: 3,
        lastResetDate: new Date().toISOString().split('T')[0]
      };

      vi.mocked(SubscriptionModel.getByUserId).mockResolvedValue(mockSub);

      await checkAiQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when AI quota is exceeded', async () => {
      const mockSub = {
        plan: 'free',
        storageLimit: 50,
        aiLimit: 5,
        aiUsedToday: 5,
        lastResetDate: new Date().toISOString().split('T')[0]
      };

      vi.mocked(SubscriptionModel.getByUserId).mockResolvedValue(mockSub);

      await checkAiQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'AI_QUOTA_EXCEEDED',
          data: expect.objectContaining({
            used: 5,
            limit: 5,
            plan: 'free'
          })
        })
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await checkAiQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on error', async () => {
      vi.mocked(SubscriptionModel.getByUserId).mockRejectedValue(new Error('Database error'));

      await checkAiQuota(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to check AI quota'
        })
      );
    });
  });
});
