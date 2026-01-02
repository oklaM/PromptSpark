import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promptspark',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

class Database {
  private pool: pkg.Pool;

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
      client.release();
      await this.createTables();
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }

  /**
   * Helper to convert SQLite '?' placeholders to PostgreSQL '$1', '$2', etc.
   */
  private convertSql(sql: string): string {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Prompts 表
      await client.query(`
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
      `);

      // 自动迁移：检查 metadata 列是否存在，不存在则添加
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='metadata') THEN 
            ALTER TABLE prompts ADD COLUMN metadata JSONB; 
          END IF; 
        END $$;
      `);

      // 自动迁移：检查 deletedAt 列是否存在 (prompts)
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='prompts' AND column_name='deletedAt') THEN 
            ALTER TABLE prompts ADD COLUMN "deletedAt" TEXT; 
          END IF; 
        END $$;
      `);

      // Tags 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          count INTEGER DEFAULT 0
        )
      `);

      // Prompt_Tags 关联表
      await client.query(`
        CREATE TABLE IF NOT EXISTS prompt_tags (
          "promptId" TEXT NOT NULL,
          "tagId" TEXT NOT NULL,
          PRIMARY KEY ("promptId", "tagId"),
          FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE,
          FOREIGN KEY ("tagId") REFERENCES tags(id) ON DELETE CASCADE
        )
      `);

      // Categories 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          color TEXT
        )
      `);

      // Prompt History 版本控制表
      await client.query(`
        CREATE TABLE IF NOT EXISTS prompt_history (
          id TEXT PRIMARY KEY,
          "promptId" TEXT NOT NULL,
          version INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          content TEXT NOT NULL,
          category TEXT,
          tags TEXT, -- JSON array string
          "changedBy" TEXT,
          "changeLog" TEXT,
          "createdAt" TEXT NOT NULL,
          FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE
        )
      `);

      // Favorites 收藏表
      await client.query(`
        CREATE TABLE IF NOT EXISTS favorites (
          id TEXT PRIMARY KEY,
          "promptId" TEXT NOT NULL,
          "userId" TEXT,
          "createdAt" TEXT NOT NULL,
          FOREIGN KEY ("promptId") REFERENCES prompts(id) ON DELETE CASCADE
        )
      `);

      // Users 表
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "displayName" TEXT,
          "createdAt" TEXT NOT NULL,
          "updatedAt" TEXT NOT NULL
        )
      `);

      // 权限管理表
      await client.query(`
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
      `);

      // 评论表
      await client.query(`
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
      `);

      // 自动迁移：检查 deletedAt 列是否存在 (comments)
      await client.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='deletedAt') THEN 
            ALTER TABLE comments ADD COLUMN "deletedAt" TEXT; 
          END IF; 
        END $$;
      `);

      // 评论点赞表
      await client.query(`
        CREATE TABLE IF NOT EXISTS comment_likes (
          "commentId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL,
          PRIMARY KEY ("commentId", "userId"),
          FOREIGN KEY ("commentId") REFERENCES comments(id) ON DELETE CASCADE,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 讨论表
      await client.query(`
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
      `);

      // 评分表
      await client.query(`
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
      `);

      // Eval Logs 评测记录表
      await client.query(`
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
      `);

      // API Tokens 表
      await client.query(`
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
      `);

      // Subscriptions 表 (商业化核心)
      await client.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          "userId" TEXT PRIMARY KEY,
          plan TEXT DEFAULT 'free', -- 'free', 'pro', 'team'
          "storageLimit" INTEGER DEFAULT 50,
          "aiLimit" INTEGER DEFAULT 5, -- 每日优化次数
          "aiUsedToday" INTEGER DEFAULT 0,
          "lastResetDate" TEXT,
          "updatedAt" TEXT NOT NULL,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 创建索引
      await client.query(`CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_prompts_author ON prompts(author)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts("createdAt")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_prompt_history_prompt_id ON prompt_history("promptId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions("userId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_permissions_prompt_id ON permissions("promptId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_prompt_id ON comments("promptId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments("userId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_discussions_prompt_id ON discussions("promptId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ratings_prompt_id ON ratings("promptId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings("userId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_eval_logs_prompt_id ON eval_logs("promptId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens("userId")`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token)`);

    } finally {
      client.release();
    }
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) await this.initialize();
    const convertedSql = this.convertSql(sql);
    const client = await this.pool.connect();
    try {
      const res = await client.query(convertedSql, params);
      return { changes: res.rowCount };
    } finally {
      client.release();
    }
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) await this.initialize();
    const convertedSql = this.convertSql(sql);
    const client = await this.pool.connect();
    try {
      const res = await client.query(convertedSql, params);
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.pool) await this.initialize();
    const convertedSql = this.convertSql(sql);
    const client = await this.pool.connect();
    try {
      const res = await client.query(convertedSql, params);
      return res.rows;
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