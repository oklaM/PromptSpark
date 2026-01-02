import express from 'express';
import request from 'supertest';
import { vi, describe, beforeAll, afterAll, test, expect, beforeEach } from 'vitest';
import bodyParser from 'body-parser';
import { PermissionModel } from '../src/models/Permission';

// Hoist the mock and store definition
const mocks = vi.hoisted(() => {
  let promptsStore: any[] = [];
  let tagsStore: any[] = [];
  let promptTagsStore: any[] = [];
  let historyStore: any[] = [];

  const run = vi.fn().mockImplementation(async (sql: string, params: any[]) => {
    if (sql.startsWith('INSERT INTO prompts')) {
      const [id, title, description, content, category, author, createdAt, updatedAt, metadata] = params;
      promptsStore.push({ id, title, description, content, category, author, createdAt, updatedAt, metadata, isPublic: 0, views: 0, likes: 0, deletedAt: null });
      return { changes: 1 };
    }
    
    if (sql.startsWith('UPDATE prompts SET')) {
      const id = params[params.length - 1];
      const promptIndex = promptsStore.findIndex(p => p.id === id);
      
      if (promptIndex !== -1) {
        if (sql.includes('"deletedAt" = ?')) {
           promptsStore[promptIndex].deletedAt = params[0];
        } else if (sql.includes('views = views + 1')) {
           promptsStore[promptIndex].views += 1;
        } else if (sql.includes('title = ?')) {
           // Basic update simulation for title
           // In a real generic update, we'd map fields. Here we just know the test case.
           promptsStore[promptIndex].title = params[0];
        }
        return { changes: 1 };
      }
      return { changes: 0 };
    }

    if (sql.startsWith('INSERT INTO prompt_history')) {
      historyStore.push({ id: params[0], promptId: params[1] });
      return { changes: 1 };
    }

    if (sql.startsWith('DELETE FROM prompt_tags')) {
       const promptId = params[0];
       promptTagsStore = promptTagsStore.filter(pt => pt.promptId !== promptId);
       return { changes: 1 };
    }

    return { changes: 1 };
  });

  const get = vi.fn().mockImplementation(async (sql: string, params: any[]) => {
    if (sql.includes('FROM prompts WHERE id = ?')) {
      const id = params[0];
      const p = promptsStore.find(p => p.id === id);
      if (p && p.deletedAt) return null;
      return p || undefined;
    }
    
    if (sql.includes('FROM tags WHERE name = ?')) {
      return tagsStore.find(t => t.name === params[0]);
    }
    
    if (sql.includes('COUNT(*) as count FROM prompts')) {
       return { count: promptsStore.filter(p => !p.deletedAt).length };
    }

    if (sql.includes('FROM prompt_history')) {
        return { maxVersion: 0 };
    }

    return undefined;
  });

  const all = vi.fn().mockImplementation(async (sql: string, params: any[]) => {
    if (sql.includes('SELECT t.name FROM tags')) {
      return []; 
    }

    if (sql.includes('FROM prompts')) {
        return promptsStore.filter(p => !p.deletedAt);
    }

    return [];
  });

  return {
    database: { run, get, all },
    reset: () => {
      promptsStore = [];
      tagsStore = [];
      promptTagsStore = [];
      historyStore = [];
    },
    // Helper to seed store for tests
    seedPrompts: (prompts: any[]) => {
      prompts.forEach(p => promptsStore.push(p));
    },
    getPrompts: () => promptsStore
  };
});

vi.mock('../src/db/database', () => ({
  database: mocks.database
}));

import promptRoutes from '../src/routes/promptRoutes';

// Mock Middleware to bypass checks
vi.mock('../src/middleware/authMiddleware', () => ({
  ensureAuth: vi.fn((req, res, next) => next())
}));

vi.mock('../src/middleware/quotaMiddleware', () => ({
  checkStorageQuota: vi.fn((req, res, next) => next()),
  checkAiQuota: vi.fn((req, res, next) => next())
}));

// Create app
const app = express();
app.use(bodyParser.json());
// Mock Auth Middleware - Manually set user for controller usage
app.use((req: any, res, next) => {
  if (req.headers['x-test-user']) {
      req.user = JSON.parse(req.headers['x-test-user'] as string);
  }
  next();
});
app.use('/api', promptRoutes);


describe('Prompts API System Tests', () => {
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(PermissionModel, 'grant').mockResolvedValue();
    vi.spyOn(PermissionModel, 'check').mockResolvedValue(true);
  });

  beforeEach(() => {
      mocks.reset();
      vi.clearAllMocks();
  });

  const testUser = { id: 'user-1', username: 'tester' };
  const userHeader = JSON.stringify(testUser);

  test('CREATE: should create a new prompt', async () => {
    const res = await request(app)
      .post('/api/prompts')
      .set('x-test-user', userHeader)
      .send({
        title: 'System Test Prompt',
        content: 'Testing system robustness',
        category: 'Test',
        tags: ['system', 'test']
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('System Test Prompt');
    
    const store = mocks.getPrompts();
    expect(store.length).toBe(1);
    expect(store[0].title).toBe('System Test Prompt');
  });

  test('READ: should get a prompt by ID', async () => {
    mocks.seedPrompts([{
        id: 'p-1',
        title: 'Existing Prompt',
        content: 'Content',
        author: 'tester',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
    }]);

    const res = await request(app)
      .get('/api/prompts/p-1')
      .set('x-test-user', userHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Existing Prompt');
  });

  test('UPDATE: should update a prompt', async () => {
     mocks.seedPrompts([{
        id: 'p-update',
        title: 'Original Title',
        content: 'Content',
        author: 'tester',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
    }]);

    const res = await request(app)
      .put('/api/prompts/p-update')
      .set('x-test-user', userHeader)
      .send({
          title: 'Updated Title'
      });

    expect(res.status).toBe(200);
    const store = mocks.getPrompts();
    expect(store[0].title).toBe('Updated Title');
  });

  test('DELETE: should soft delete a prompt', async () => {
     mocks.seedPrompts([{
        id: 'p-delete',
        title: 'To Delete',
        content: 'Content',
        author: 'tester',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
    }]);

    const res = await request(app)
      .delete('/api/prompts/p-delete')
      .set('x-test-user', userHeader);

    expect(res.status).toBe(200);
    const store = mocks.getPrompts();
    expect(store[0].deletedAt).not.toBeNull();
  });

  test('SEARCH: should return prompts', async () => {
     mocks.seedPrompts([{
        id: 'p-search',
        title: 'Searchable Prompt',
        content: 'Content',
        author: 'tester',
        deletedAt: null
    }]);

    const res = await request(app)
      .get('/api/prompts/search?query=Searchable')
      .set('x-test-user', userHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});