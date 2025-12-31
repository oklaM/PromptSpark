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
    
    this.pool.on('error', (err) => {
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
          "deletedAt" TEXT
        )
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

      // 创建索引 (Postgres 语法略有不同，但 CREATE INDEX 基本上通用)
      await client.query(`CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_prompts_author ON prompts(author)`);
      // Postgres 区分大小写，列名如果是驼峰需要加引号，这里统一处理了
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

  // 适配 SQLite 的 run 方法 (用于 INSERT, UPDATE, DELETE)
  async run(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) await this.initialize();
    
    const convertedSql = this.convertSql(sql);
    
    // Postgres 的 INSERT/UPDATE 不会自动返回 lastID，除非使用 RETURNING
    // 这里为了适配，我们尽力模拟。如果是 INSERT，我们可能需要修改 SQL 添加 RETURNING id
    // 但为了不破坏原有 SQL 结构，且大部分业务逻辑可能依赖 id (UUID) 而不是自增 ID
    // 我们只返回 changes (rowCount)
    
    const client = await this.pool.connect();
    try {
      const res = await client.query(convertedSql, params);
      return { 
        id: null, // Postgres 不支持 lastID (除非是 SERIAL 且用了 RETURNING)，但这在 UUID 场景下通常无用
        changes: res.rowCount 
      };
    } finally {
      client.release();
    }
  }

  // 适配 SQLite 的 get 方法 (返回单行)
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

  // 适配 SQLite 的 all 方法 (返回多行)
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