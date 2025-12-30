import { describe, test, expect, beforeAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import evalRoutes from '../src/routes/evalRoutes';

// Mock database to prevent actual DB writes/reads during route testing
vi.mock('../src/db/database', () => ({
  database: {
    run: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    get: vi.fn().mockResolvedValue({ total: 10, good: 8, bad: 2 }),
    all: vi.fn().mockResolvedValue([]),
  }
}));

describe('Eval API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', evalRoutes);
  });

  describe('Eval Routes', () => {
    test('POST /api/evals should create a log', async () => {
      const response = await request(app)
        .post('/api/evals')
        .send({
          modelId: 'gpt-4',
          content: 'test prompt',
          output: 'test output',
          score: 1
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/prompts/:promptId/evals should return logs', async () => {
      const response = await request(app)
        .get('/api/prompts/test-id/evals');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('GET /api/prompts/:promptId/evals/stats should return stats', async () => {
      const response = await request(app)
        .get('/api/prompts/test-id/evals/stats');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('passRate');
    });
  });
});
