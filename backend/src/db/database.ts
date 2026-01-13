import { Pool, type PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: false | { rejectUnauthorized: boolean };
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promptspark',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

function normalizePlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function addColumnIfNotExists(client: PoolClient, table: string, column: string, definition: string): Promise<void> {
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='${table}' AND column_name='${column}'
      ) THEN
        ALTER TABLE ${table} ADD COLUMN "${column}" ${definition};
      END IF;
    END $$;
  `);
}

async function createIndexIfNotExists(client: PoolClient, indexName: string, table: string, columns: string): Promise<void> {
  await client.query(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table}(${columns})`);
}

const SCHEMA_DEFINITIONS = {
  prompts: `
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category TEXT,
      author TEXT,
      "isPublic" BOOLEAN DEFAULT false,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      "deletedAt" TEXT,
      metadata JSONB
    )
  `,
  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0
    )
  `,
  promptTags: `
    CREATE TABLE IF NOT EXISTS prompt_tags (
      "promptId" TEXT NOT NULL,
      "tagId" TEXT NOT NULL,
      PRIMARY KEY ("promptId", "tagId"),
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY ("tagId") REFERENCES tags(id) ON DELETE CASCADE
    )
  `,
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT
    )
  `,
  promptHistory: `
    CREATE TABLE IF NOT EXISTS prompt_history (
      id TEXT PRIMARY KEY,
      "promptId" TEXT NOT NULL,
      version INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      "changedBy" TEXT,
      "changeLog" TEXT,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE
    )
  `,
  favorites: `
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      "promptId" TEXT NOT NULL,
      "userId" TEXT,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE
    )
  `,
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "displayName" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )
  `,
  permissions: `
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      "promptId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      "grantedBy" TEXT,
      "grantedAt" TEXT NOT NULL,
      "revokedAt" TEXT,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE("promptId", "userId")
    )
  `,
  comments: `
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      "promptId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "userName" TEXT,
      content TEXT NOT NULL,
      "parentId" TEXT,
      likes INTEGER DEFAULT 0,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      "deletedAt" TEXT,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY ("parentId") REFERENCES comments(id) ON DELETE CASCADE
    )
  `,
  commentLikes: `
    CREATE TABLE IF NOT EXISTS comment_likes (
      "commentId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      PRIMARY KEY ("commentId", "userId"),
      FOREIGN KEY ("commentId") REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  discussions: `
    CREATE TABLE IF NOT EXISTS discussions (
      id TEXT PRIMARY KEY,
      "promptId" TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      "initiatorId" TEXT,
      "initiatorName" TEXT,
      "commentCount" INTEGER DEFAULT 0,
      "lastCommentAt" TEXT,
      status TEXT DEFAULT 'open',
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY ("initiatorId") REFERENCES users(id) ON DELETE SET NULL
    )
  `,
  ratings: `
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      "promptId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "userName" TEXT,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      feedback TEXT,
      helpfulness INTEGER DEFAULT 0,
      accuracy INTEGER DEFAULT 0,
      relevance INTEGER DEFAULT 0,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE("promptId", "userId")
    )
  `,
  evalLogs: `
    CREATE TABLE IF NOT EXISTS eval_logs (
      id TEXT PRIMARY KEY,
      "promptId" TEXT,
      "modelId" TEXT NOT NULL,
      variables TEXT,
      content TEXT NOT NULL,
      output TEXT,
      score INTEGER,
      latency INTEGER,
      tokens INTEGER,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE SET NULL
    )
  `,
  apiTokens: `
    CREATE TABLE IF NOT EXISTS api_tokens (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      "lastUsedAt" TEXT,
      "createdAt" TEXT NOT NULL,
      "expiresAt" TEXT,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  subscriptions: `
    CREATE TABLE IF NOT EXISTS subscriptions (
      "userId" TEXT PRIMARY KEY,
      plan TEXT DEFAULT 'free',
      "storageLimit" INTEGER DEFAULT 50,
      "aiLimit" INTEGER DEFAULT 5,
      "aiUsedToday" INTEGER DEFAULT 0,
      "lastResetDate" TEXT,
      "updatedAt" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  auditLogs: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      "userId" TEXT,
      action TEXT NOT NULL,
      "resourceType" TEXT NOT NULL,
      "resourceId" TEXT,
      details JSONB,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
    )
  `,
} as const;

async function createTables(client: PoolClient): Promise<void> {
  for (const [, schema] of Object.entries(SCHEMA_DEFINITIONS)) {
    await client.query(schema);
  }

  await addColumnIfNotExists(client, 'prompts', 'metadata', 'JSONB');
  await addColumnIfNotExists(client, 'prompts', 'deletedAt', 'TEXT');
  await addColumnIfNotExists(client, 'comments', 'deletedAt', 'TEXT');
}

async function createIndexes(client: PoolClient): Promise<void> {
  const indexes = [
    ['idx_prompts_category', 'prompts', 'category'],
    ['idx_prompts_author', 'prompts', 'author'],
    ['idx_prompts_created_at', 'prompts', '"createdAt"'],
    ['idx_prompt_history_prompt_id', 'prompt_history', '"promptId"'],
    ['idx_permissions_user_id', 'permissions', '"userId"'],
    ['idx_permissions_prompt_id', 'permissions', '"promptId"'],
    ['idx_comments_prompt_id', 'comments', '"promptId"'],
    ['idx_comments_user_id', 'comments', '"userId"'],
    ['idx_discussions_prompt_id', 'discussions', '"promptId"'],
    ['idx_ratings_prompt_id', 'ratings', '"promptId"'],
    ['idx_ratings_user_id', 'ratings', '"userId"'],
    ['idx_eval_logs_prompt_id', 'eval_logs', '"promptId"'],
    ['idx_api_tokens_user_id', 'api_tokens', '"userId"'],
    ['idx_api_tokens_token', 'api_tokens', 'token'],
    ['idx_audit_logs_user_id', 'audit_logs', '"userId"'],
    ['idx_audit_logs_resource', 'audit_logs', '"resourceType", "resourceId"'],
    ['idx_audit_logs_action', 'audit_logs', 'action'],
    ['idx_audit_logs_created_at', 'audit_logs', '"createdAt"'],
  ] as const;

  for (const [name, table, columns] of indexes) {
    await createIndexIfNotExists(client, name, table, columns);
  }
}

class Database {
  private pool: Pool;

  constructor() {
    this.pool = new Pool(dbConfig);

    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log(`Database connected to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
      await createTables(client);
      await createIndexes(client);
      client.release();
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    if (!this.pool) await this.initialize();
    const normalizedSql = normalizePlaceholders(sql);
    const client = await this.pool.connect();
    try {
      const res = await client.query(normalizedSql, params);
      return { changes: res.rowCount || 0 };
    } finally {
      client.release();
    }
  }

  async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    if (!this.pool) await this.initialize();
    const normalizedSql = normalizePlaceholders(sql);
    const client = await this.pool.connect();
    try {
      const res = await client.query(normalizedSql, params);
      return res.rows[0] as T | undefined;
    } finally {
      client.release();
    }
  }

  async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.pool) await this.initialize();
    const normalizedSql = normalizePlaceholders(sql);
    const client = await this.pool.connect();
    try {
      const res = await client.query(normalizedSql, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    console.log('Database pool closed');
  }
}

export const database = new Database();