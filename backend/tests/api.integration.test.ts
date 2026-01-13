import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// Mock the database module BEFORE importing it via routes
const mockStore: any = {
  prompts: [],
  tags: [],
  promptTags: [],
  users: [],
  comments: [],
  permissions: [],
  subscriptions: []
};

vi.mock('../src/db/database', () => ({
  database: {
    get: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes('FROM prompts WHERE id =') || sql.includes('FROM prompts WHERE id = $1')) {
        const prompt = mockStore.prompts.find((p: any) => p.id === params[0] && !p.deletedAt);
        if (prompt) {
          console.log('[MOCK] GET prompt - id:', params[0], 'views:', prompt.views);

          // Simulate tags query like getById does
          const tagIds = mockStore.promptTags
            .filter((pt: any) => pt.promptId === prompt.id)
            .map((pt: any) => pt.tagId);
          const tags = mockStore.tags
            .filter((t: any) => tagIds.includes(t.id))
            .map((t: any) => t.name);

          console.log('[MOCK] GET prompt - returning tags:', tags);

          // Always return a tags array (even if empty)
          const result = { ...prompt, tags };
          console.log('[MOCK] GET prompt - returning views:', result.views);
          return result;
        }
        console.log('[MOCK] GET prompt - not found');
        return undefined;
      }
      if (sql.includes('FROM tags WHERE name =')) {
        return mockStore.tags.find((t: any) => t.name === params[0]);
      }
      if (sql.includes('COUNT(*) as count FROM prompts')) {
        return { count: mockStore.prompts.filter((p: any) => !p.deletedAt).length };
      }
      if (sql.includes('COUNT(DISTINCT p.id) as count FROM prompts')) {
        const searchTerm = params[0]?.replace(/%/g, '') || '';
        return {
          count: mockStore.prompts.filter((p: any) =>
            !p.deletedAt &&
            (p.title?.includes(searchTerm) || p.content?.includes(searchTerm))
          ).length
        };
      }
      if (sql.includes('SELECT * FROM permissions')) {
        return mockStore.permissions.find((p: any) => p.promptId === params[0] && p.userId === params[1]);
      }
      if (sql.includes('FROM subscriptions WHERE "userId" =') || sql.includes('FROM subscriptions WHERE userId =')) {
        // Return default subscription for quota checks
        return {
          id: 'sub-1',
          userId: params[0],
          plan: 'free',
          storageLimit: 100,
          aiLimit: 50,
          aiUsedToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return undefined;
    }),
    all: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
      if (sql.includes('SELECT t.name FROM tags')) {
        const promptId = params[0];
        const tagIds = mockStore.promptTags
          .filter((pt: any) => pt.promptId === promptId)
          .map((pt: any) => pt.tagId);
        return mockStore.tags
          .filter((t: any) => tagIds.includes(t.id))
          .map((t: any) => ({ name: t.name }));
      }
      if (sql.includes('SELECT DISTINCT p.* FROM prompts')) {
        const searchTerm = params[0]?.replace(/%/g, '') || '';
        const limit = params[3] || 20;
        const offset = params[4] || 0;
        return mockStore.prompts
          .filter((p: any) =>
            !p.deletedAt &&
            (p.title?.includes(searchTerm) || p.content?.includes(searchTerm))
          )
          .slice(offset, offset + limit);
      }
      if (sql.includes('FROM prompts') && sql.includes('"deletedAt" IS NULL') && sql.includes('ORDER BY')) {
        // This is getAll query
        const limit = params[0] || 20;
        const offset = params[1] || 0;
        return mockStore.prompts
          .filter((p: any) => !p.deletedAt)
          .slice(offset, offset + limit);
      }
      return [];
    }),
    run: vi.fn().mockImplementation(async (sql: string, params: any[]) => {
      // Debug logging for views increment
      if (sql.includes('views = views + 1')) {
        console.log('[MOCK] incrementViews SQL:', sql);
        console.log('[MOCK] incrementViews params:', params);
      }
      // Debug logging for updates
      if (sql.startsWith('UPDATE prompts SET') && !sql.includes('views = views + 1')) {
        console.log('[MOCK] UPDATE SQL:', sql);
        console.log('[MOCK] UPDATE params:', params);
      }
      if (sql.startsWith('INSERT INTO prompts')) {
        const prompt = {
          id: params[0],
          title: params[1],
          description: params[2],
          content: params[3],
          category: params[4],
          author: params[5],
          createdAt: params[6],
          updatedAt: params[7],
          metadata: params[8] || '{}',
          isPublic: 0,
          views: 0,
          likes: 0,
          deletedAt: null,
          tags: [] // Initialize with empty tags
        };
        mockStore.prompts.push(prompt);
        return { changes: 1, lastInsertRowid: prompt.id };
      }
      if (sql.startsWith('INSERT INTO tags')) {
        const tag = { id: params[0], name: params[1], count: params[2] || 0 };
        console.log('[MOCK] INSERT INTO tags - tag:', tag);
        mockStore.tags.push(tag);
        return { changes: 1 };
      }
      if (sql.startsWith('INSERT INTO prompt_tags')) {
        // The actual SQL is: INSERT INTO prompt_tags ("promptId", "tagId") VALUES (?, ?)
        // So params are [promptId, tagId], not [id, promptId, tagId]
        const pt = {
          id: uuidv4(), // Generate a mock ID
          promptId: params[0],
          tagId: params[1]
        };
        console.log('[MOCK] INSERT INTO prompt_tags - pt:', pt);

        // Find the tag name
        const tag = mockStore.tags.find((t: any) => t.id === params[1]);
        console.log('[MOCK] INSERT INTO prompt_tags - tag found:', !!tag, 'name:', tag?.name);

        mockStore.promptTags.push(pt);
        console.log('[MOCK] INSERT INTO prompt_tags - promptTags now has:', mockStore.promptTags.length, 'entries');

        return { changes: 1 };
      }
      if (sql.startsWith('UPDATE tags SET count =')) {
        const tag = mockStore.tags.find((t: any) => t.id === params[1]);
        if (tag) {
          tag.count = (tag.count || 0) + 1;
        }
        return { changes: 1 };
      }
      if (sql.startsWith('INSERT INTO prompt_history')) {
        return { changes: 1 };
      }
      if (sql.startsWith('UPDATE prompts SET')) {
        // Handle incrementViews - matches both ? and $1 placeholders
        if (sql.includes('views = views + 1') && (sql.includes('WHERE id = ?') || sql.includes('WHERE id = $'))) {
          const prompt = mockStore.prompts.find((p: any) => p.id === params[0]);
          console.log('[MOCK] incrementViews - found prompt:', !!prompt, 'id:', params[0]);
          console.log('[MOCK] incrementViews - prompt.views before:', prompt?.views);
          if (prompt) {
            if (typeof prompt.views !== 'number') {
              prompt.views = 0;
            }
            prompt.views += 1;
            console.log('[MOCK] incrementViews - prompt.views after:', prompt.views);
            return { changes: 1 };
          }
          return { changes: 0 };
        }

        // Handle regular updates - both ? and $n placeholders
        // Last parameter is always the id
        const id = params[params.length - 1];
        const prompt = mockStore.prompts.find((p: any) => p.id === id);
        console.log('[MOCK] UPDATE - found prompt:', !!prompt, 'id:', id);
        if (prompt) {
          // Ensure views is initialized
          if (typeof prompt.views !== 'number') {
            prompt.views = 0;
          }

          // Parse the SET clause to determine what fields to update
          const setClause = sql.substring('UPDATE prompts SET '.length, sql.indexOf(' WHERE'));
          const setFields = setClause.split(', ').map(f => f.split('=')[0].trim());
          console.log('[MOCK] UPDATE - setFields:', setFields);
          console.log('[MOCK] UPDATE - params:', params);

          // Map parameter indices to fields (skip last param which is id)
          let paramIndex = 0;
          setFields.forEach((field, idx) => {
            const value = params[paramIndex++];
            console.log(`[MOCK] UPDATE - setting ${field} = ${value}`);

            if (field === 'title') {
              prompt.title = value;
            } else if (field === 'description') {
              prompt.description = value;
            } else if (field === 'content') {
              prompt.content = value;
            } else if (field === '"updatedAt"') {
              prompt.updatedAt = value;
            } else if (field === '"deletedAt"') {
              prompt.deletedAt = value;
            }
          });

          return { changes: 1 };
        }
        console.log('[MOCK] UPDATE - prompt not found, returning changes: 0');
        return { changes: 0 };
      }
      if (sql.startsWith('INSERT INTO permissions')) {
        mockStore.permissions.push({
          id: params[0],
          promptId: params[1],
          userId: params[2],
          role: params[3]
        });
        return { changes: 1 };
      }
      if (sql.startsWith('INSERT INTO subscriptions')) {
        mockStore.subscriptions.push({
          userId: params[0],
          plan: params[1],
          storageLimit: params[2],
          aiLimit: params[3],
          aiUsedToday: params[4],
          lastResetDate: params[5],
          updatedAt: params[6]
        });
        return { changes: 1 };
      }
      if (sql.startsWith('UPDATE subscriptions')) {
        const sub = mockStore.subscriptions.find((s: any) => s.userId === params[2]);
        if (sub) {
          if (sql.includes('"aiUsedToday" = 0')) {
            sub.aiUsedToday = 0;
            sub.lastResetDate = params[0];
          }
          if (sql.includes('"aiUsedToday" = "aiUsedToday" + 1')) {
            sub.aiUsedToday += 1;
          }
          sub.updatedAt = params[1];
        }
        return { changes: 1 };
      }
      return { changes: 1 };
    })
  },
}));

import { database } from '../src/db/database';
import promptRoutes from '../src/routes/promptRoutes';
import authRoutes from '../src/routes/authRoutes';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

function generateToken(user: any) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

// Test app setup
const app = express();
app.use(express.json());

// Mock user middleware for testing - MUST be before routes
const mockUser = { id: 'test-user-id', username: 'testuser' };

app.use((req: any, res, next) => {
  // Auto-set user for testing
  req.user = mockUser;
  next();
});

// Setup routes - mount to /api to match app.ts configuration
app.use('/api', promptRoutes);
app.use('/api/auth', authRoutes);

describe('API Integration Tests - Core Endpoints', () => {
  let testPromptId: string;
  let authToken: string;

  beforeAll(async () => {
    authToken = generateToken(mockUser);
  });

  beforeEach(() => {
    // Clear mock store before each test
    mockStore.prompts = [];
    mockStore.tags = [];
    mockStore.promptTags = [];
    mockStore.permissions = [];
    mockStore.subscriptions = [];
  });

  describe('POST /api/prompts - Create Prompt', () => {
    test('TC-036: Should create prompt with valid data', async () => {
      const promptData = {
        title: `Integration Test Prompt ${Date.now()}`,
        description: 'Test description',
        content: 'Test content',
        category: 'Testing',
        tags: ['test', 'integration'],
        isPublic: false
      };

      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(promptData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(promptData.title);

      testPromptId = response.body.data.id;
    });

    test('TC-037: Should return 400 for missing required fields', async () => {
      const invalidData = {
        title: 'Test Prompt'
        // Missing content field
      };

      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('TC-038: Should handle tags creation automatically', async () => {
      const promptWithNewTags = {
        title: `Test with new tags ${Date.now()}`,
        content: 'Content',
        tags: ['new-tag-1', 'new-tag-2']
      };

      const response = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(promptWithNewTags);

      expect(response.status).toBe(201);
      expect(response.body.data.tags).toContain('new-tag-1');
    });
  });

  describe('GET /api/prompts/:id - Get Prompt by ID', () => {
    test('TC-039: Should return prompt with valid ID', async () => {
      // First create a prompt
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Get Test Prompt',
          content: 'Content for get test'
        });

      testPromptId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/prompts/${testPromptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', testPromptId);
      expect(response.body.data).toHaveProperty('tags');
    });

    test('TC-040: Should return 404 for non-existent prompt', async () => {
      const fakeId = uuidv4();

      const response = await request(app)
        .get(`/api/prompts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('TC-041: Should increment view count on fetch', async () => {
      // Create a prompt
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'View Count Test',
          content: 'Content'
        });

      const promptId = createResponse.body.data.id;

      // First fetch
      const response1 = await request(app)
        .get(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const views1 = response1.body.data.views;

      // Second fetch
      const response2 = await request(app)
        .get(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const views2 = response2.body.data.views;

      expect(views2).toBe(views1 + 1);
    });
  });

  describe('PUT /api/prompts/:id - Update Prompt', () => {
    test('TC-042: Should update prompt with valid data', async () => {
      // Create a prompt first
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          content: 'Content'
        });

      testPromptId = createResponse.body.data.id;

      const updateData = {
        title: `Updated Prompt ${Date.now()}`,
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/prompts/${testPromptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
    });

    test('TC-044: Should return 404 when updating non-existent prompt', async () => {
      const fakeId = uuidv4();

      const response = await request(app)
        .put(`/api/prompts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/prompts/:id - Delete Prompt', () => {
    test('TC-045: Should soft delete prompt', async () => {
      // Create a prompt to delete
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `To Delete ${Date.now()}`,
          content: 'Content'
        });

      const promptId = createResponse.body.data.id;

      // Delete it
      const deleteResponse = await request(app)
        .delete(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify it's soft deleted (deletedAt is set)
      const prompt = mockStore.prompts.find((p: any) => p.id === promptId);
      expect(prompt.deletedAt).not.toBeNull();
    });

    test('TC-046: Should return 404 when accessing deleted prompt', async () => {
      // Create and delete a prompt
      const createResponse = await request(app)
        .post('/api/prompts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Delete Test ${Date.now()}`,
          content: 'Content'
        });

      const promptId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to get it
      const response = await request(app)
        .get(`/api/prompts/${promptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/prompts/search - Search Prompts', () => {
    beforeEach(() => {
      // Seed search test data
      mockStore.prompts.push(
        {
          id: uuidv4(),
          title: 'AI Art Generation',
          content: 'Generate art with AI',
          category: 'AI',
          author: 'testuser',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          isPublic: 0,
          views: 0,
          likes: 0,
          metadata: '{}'
        },
        {
          id: uuidv4(),
          title: 'Python Code Helper',
          content: 'Help with Python code',
          category: 'Programming',
          author: 'testuser',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          isPublic: 0,
          views: 0,
          likes: 0,
          metadata: '{}'
        }
      );
    });

    test('TC-047: Should search by keyword', async () => {
      const response = await request(app)
        .get('/api/prompts/search?query=AI')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toContain('AI');
    });

    test('TC-049: Should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/prompts/search?query=nonexistentxyz123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    test('TC-050: Should support pagination', async () => {
      const response = await request(app)
        .get('/api/prompts/search?query=test&page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/prompts - List Prompts', () => {
    test('TC-051: Should return paginated list', async () => {
      // Add a test prompt
      mockStore.prompts.push({
        id: uuidv4(),
        title: 'Test Prompt',
        content: 'Content',
        category: 'Test',
        author: 'testuser',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        isPublic: 0,
        views: 0,
        likes: 0,
        metadata: '{}'
      });

      const response = await request(app)
        .get('/api/prompts?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
