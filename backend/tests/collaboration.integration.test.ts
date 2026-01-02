import express from 'express';
import request from 'supertest';
import { vi, describe, beforeAll, afterAll, test, expect } from 'vitest';
import collaborationRoutes from '../src/routes/collaborationRoutes';

// Mock the database module BEFORE importing it via routes
vi.mock('../src/db/database', () => ({
  database: {
    initialize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    all: vi.fn(),
    run: vi.fn().mockResolvedValue({ changes: 1, id: 'mock-id' }),
  },
}));

import { database } from '../src/db/database';

describe('Collaboration API Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Setup default mock implementations
    (database.get as any).mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM permissions WHERE id = ?')) {
             return Promise.resolve({ id: 'perm-1', promptId: '1', userId: 'user-1', role: 'viewer' });
        }
        if (sql.includes('SELECT * FROM permissions')) {
             return Promise.resolve({ role: 'owner' }); // Default owner check pass
        }
        if (sql.includes('SELECT * FROM comments WHERE id = ?')) {
             return Promise.resolve({ id: 'comment-1', userId: 'test-user-1' });
        }
        if (sql.includes('SELECT * FROM ratings WHERE id = ?')) {
             return Promise.resolve({ id: 'rating-1', userId: 'test-user-1' });
        }
        // Check permission route mock
        if (sql.includes('SELECT * FROM permissions') && sql.includes('WHERE "promptId" = ? AND "userId" = ?')) {
            return Promise.resolve({ role: 'editor' });
        }
        return Promise.resolve(null);
    });

    (database.all as any).mockImplementation(() => {
        return Promise.resolve([]);
    });

    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Mock authentication middleware for tests
    app.use((req: any, res, next) => {
      req.user = { id: 'test-user-1', username: 'test-user' };
      next();
    });

    // Register routes
    app.use('/api/collaboration', collaborationRoutes);
  });

  afterAll(async () => {
    vi.clearAllMocks();
  });

  describe('API Route Structure', () => {
    test('collaboration routes should be registered', () => {
      expect(app._router).toBeDefined();
    });

    test('POST /grant-permission route should exist', async () => {
      const response = await request(app)
        .post('/api/collaboration/grant-permission')
        .send({
          promptId: 1,
          userId: 'user-2',
          role: 'editor'
        });

      // We expect a response (error or success) not 404
      expect(response.status).not.toBe(404);
    });

    test('GET /permissions/:promptId route should exist', async () => {
      const response = await request(app)
        .get('/api/collaboration/permissions/1');

      expect(response.status).not.toBe(404);
    });

    test('GET /check-permission/:promptId/:userId route should exist', async () => {
      const response = await request(app)
        .get('/api/collaboration/check-permission/1/test-user-1');

      expect(response.status).not.toBe(404);
    });
  });

  describe('Comments Endpoints Structure', () => {
    test('POST /comments route should exist', async () => {
      const response = await request(app)
        .post('/api/collaboration/comments')
        .send({
          promptId: 1,
          content: 'Test comment',
          parentId: null
        });

      expect(response.status).not.toBe(404);
    });

    test('GET /comments/:promptId route should exist', async () => {
      const response = await request(app)
        .get('/api/collaboration/comments/1');

      expect(response.status).not.toBe(404);
    });

    test('DELETE /comments/:commentId route should exist', async () => {
      const response = await request(app)
        .delete('/api/collaboration/comments/1');

      expect(response.status).not.toBe(404);
    });

    test('POST /comments/:commentId/like route should exist', async () => {
      const response = await request(app)
        .post('/api/collaboration/comments/1/like');

      expect(response.status).not.toBe(404);
    });
  });

  describe('Discussions Endpoints Structure', () => {
    test('POST /discussions route should exist', async () => {
      const response = await request(app)
        .post('/api/collaboration/discussions')
        .send({
          promptId: 1,
          title: 'Test discussion',
          content: 'Test content'
        });

      expect(response.status).not.toBe(404);
    });

    test('GET /discussions/:promptId route should exist', async () => {
      const response = await request(app)
        .get('/api/collaboration/discussions/1');

      expect(response.status).not.toBe(404);
    });

    test('PUT /discussions/:discussionId route should exist', async () => {
      const response = await request(app)
        .put('/api/collaboration/discussions/1')
        .send({ status: 'resolved' });

      expect(response.status).not.toBe(404);
    });

    test('POST /discussions/:discussionId/comments route should exist', async () => {
      const response = await request(app)
        .post('/api/collaboration/discussions/1/comments')
        .send({ content: 'Discussion comment' });

      expect(response.status).not.toBe(404);
    });
  });

  describe('Ratings Endpoints Structure', () => {
    test('POST /ratings route should exist', async () => {
      const response = await request(app)
        .post('/api/collaboration/ratings')
        .send({
          promptId: 1,
          score: 5,
          helpfulness: 90,
          accuracy: 85,
          relevance: 95
        });

      expect(response.status).not.toBe(404);
    });

    test('GET /ratings/:promptId route should exist', async () => {
      const response = await request(app)
        .get('/api/collaboration/ratings/1');

      expect(response.status).not.toBe(404);
    });

    test('GET /ratings/:promptId/stats route should exist', async () => {
      const response = await request(app)
        .get('/api/collaboration/ratings/1/stats');

      expect(response.status).not.toBe(404);
    });

    test('DELETE /ratings/:ratingId route should exist', async () => {
      const response = await request(app)
        .delete('/api/collaboration/ratings/1');

      expect(response.status).not.toBe(404);
    });
  });

  describe('Middleware Integration', () => {
    test('should include user in request context', async () => {
      const response = await request(app)
        .get('/api/collaboration/check-permission/1/test-user-1');

      // Just verify the request goes through without auth errors
      expect(response.status).not.toBe(401);
    });

    test('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/api/collaboration/comments')
        .set('Content-Type', 'application/json')
        .send({
          promptId: 1,
          content: 'Test comment'
        });

      expect(response.status).not.toBe(400);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/collaboration/grant-permission')
        .send({
          promptId: 1
          // Missing userId and role
        });

      expect([400, 401]).toContain(response.status);
    });

    test('should handle invalid data types', async () => {
      const response = await request(app)
        .post('/api/collaboration/ratings')
        .send({
          promptId: 'invalid',
          score: 'not-a-number',
          helpfulness: 'invalid'
        });

      expect([400, 401]).toContain(response.status);
    });

    test('should return proper error responses', async () => {
      const response = await request(app)
        .get('/api/collaboration/ratings/999999');

      expect(response.status).toBeLessThan(500);
      expect(response.body).toBeInstanceOf(Object);
    });
  });
});
