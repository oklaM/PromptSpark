import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/promptspark.db');

class Database {
  private db: sqlite3.Database | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connected:', DB_PATH);
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    // Prompts 表
    await run(`
      CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        category TEXT,
        author TEXT,
        isPublic BOOLEAN DEFAULT 0,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT
      )
    `);

    // Tags 表
    await run(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        count INTEGER DEFAULT 0
      )
    `);

    // Prompt_Tags 关联表
    await run(`
      CREATE TABLE IF NOT EXISTS prompt_tags (
        promptId TEXT NOT NULL,
        tagId TEXT NOT NULL,
        PRIMARY KEY (promptId, tagId),
        FOREIGN KEY (promptId) REFERENCES prompts(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Categories 表
    await run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT
      )
    `);

    // Prompt History 版本控制表
    await run(`
      CREATE TABLE IF NOT EXISTS prompt_history (
        id TEXT PRIMARY KEY,
        promptId TEXT NOT NULL,
        content TEXT NOT NULL,
        version INTEGER NOT NULL,
        changedBy TEXT,
        changeLog TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (promptId) REFERENCES prompts(id) ON DELETE CASCADE
      )
    `);

    // Favorites 收藏表
    await run(`
      CREATE TABLE IF NOT EXISTS favorites (
        id TEXT PRIMARY KEY,
        promptId TEXT NOT NULL,
        userId TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (promptId) REFERENCES prompts(id) ON DELETE CASCADE
      )
    `);

    // Users 表（简单用户账户系统）
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        passwordHash TEXT NOT NULL,
        displayName TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // 创建索引
    await run(`CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_prompts_author ON prompts(author)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_prompts_createdAt ON prompts(createdAt)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_prompt_history_promptId ON prompt_history(promptId)`);
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database closed');
          resolve();
        }
      });
    });
  }
}

export const database = new Database();
