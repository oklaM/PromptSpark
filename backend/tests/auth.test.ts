import express from 'express';
import request from 'supertest';
import { vi, describe, beforeAll, afterAll, test, expect } from 'vitest';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';

// Hoist mocks to allow usage in vi.mock
const mocks = vi.hoisted(() => {
  return {
    run: vi.fn(),
    get: vi.fn(),
  }
});

vi.mock('../src/db/database', () => ({
  database: mocks
}));

import authRoutes from '../src/routes/authRoutes';

// Create app for testing
const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Authentication API', () => {
  beforeAll(() => {
    // Silence console.error during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      // Mock: No existing user
      mocks.get.mockResolvedValueOnce(null);
      // Mock: Insert successful
      mocks.run.mockResolvedValueOnce({ changes: 1 });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'password123',
          email: 'new@example.com'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.username).toBe('newuser');
    });

    test('should fail if user already exists', async () => {
      // Mock: User exists
      mocks.get.mockResolvedValueOnce({ id: 'existing-id' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test('should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user'
          // missing password
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Mock: Fetch user returns record (PostgreSQL uses lowercase column names)
      mocks.get.mockResolvedValueOnce({
        id: 'user-id',
        username: 'testuser',
        passwordhash: hashedPassword,
        displayname: 'Test User'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    test('should fail login with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Mock: Fetch user returns record (PostgreSQL uses lowercase column names)
      mocks.get.mockResolvedValueOnce({
        id: 'user-id',
        username: 'testuser',
        passwordhash: hashedPassword
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('should fail login if user does not exist', async () => {
      // Mock: User not found
      mocks.get.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(res.status).toBe(401);
    });
  });
});
