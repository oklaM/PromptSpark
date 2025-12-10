import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database.js';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  author: string;
  isPublic: boolean;
  views: number;
  likes: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptDTO {
  title: string;
  description?: string;
  content: string;
  category?: string;
  author?: string;
  tags?: string[];
}

export class PromptModel {
  static async create(data: CreatePromptDTO): Promise<Prompt> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO prompts (id, title, description, content, category, author, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.description || '', data.content, data.category || '', data.author || 'Anonymous', now, now]
    );

    // 添加标签
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        await this.addTag(id, tagName);
      }
    }

    // 创建初始版本历史
    await database.run(
      `INSERT INTO prompt_history (id, promptId, content, version, changedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, data.content, 1, data.author || 'Anonymous', now]
    );

    return this.getById(id) as Promise<Prompt>;
  }

  static async getById(id: string): Promise<Prompt | null> {
    const prompt = await database.get(
      `SELECT * FROM prompts WHERE id = ? AND deletedAt IS NULL`,
      [id]
    );

    if (!prompt) return null;

    const tags = await database.all(
      `SELECT t.name FROM tags t
       JOIN prompt_tags pt ON t.id = pt.tagId
       WHERE pt.promptId = ?`,
      [id]
    );

    return {
      ...prompt,
      tags: tags.map(t => t.name),
      isPublic: Boolean(prompt.isPublic)
    };
  }

  static async getAll(page: number = 1, limit: number = 20): Promise<{data: Prompt[], total: number}> {
    const offset = (page - 1) * limit;

    const total = await database.get(
      `SELECT COUNT(*) as count FROM prompts WHERE deletedAt IS NULL`
    );

    const prompts = await database.all(
      `SELECT * FROM prompts WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // 获取每个提示词的标签
    const promptsWithTags = await Promise.all(
      prompts.map(async (prompt) => {
        const tags = await database.all(
          `SELECT t.name FROM tags t
           JOIN prompt_tags pt ON t.id = pt.tagId
           WHERE pt.promptId = ?`,
          [prompt.id]
        );
        return {
          ...prompt,
          tags: tags.map(t => t.name),
          isPublic: Boolean(prompt.isPublic)
        };
      })
    );

    return { data: promptsWithTags, total: total.count };
  }

  static async update(id: string, data: Partial<CreatePromptDTO>, changedBy?: string): Promise<Prompt> {
    const now = new Date().toISOString();
    const prompt = await this.getById(id);

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.title) {
      updateFields.push('title = ?');
      updateValues.push(data.title);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }
    if (data.content) {
      updateFields.push('content = ?');
      updateValues.push(data.content);
      // 创建版本历史
      const history = await database.get(
        `SELECT MAX(version) as maxVersion FROM prompt_history WHERE promptId = ?`,
        [id]
      );
      const newVersion = (history.maxVersion || 0) + 1;
      await database.run(
        `INSERT INTO prompt_history (id, promptId, content, version, changedBy, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), id, data.content, newVersion, changedBy || 'Unknown', now]
      );
    }
    if (data.category) {
      updateFields.push('category = ?');
      updateValues.push(data.category);
    }

    updateFields.push('updatedAt = ?');
    updateValues.push(now);
    updateValues.push(id);

    if (updateFields.length > 1) {
      await database.run(
        `UPDATE prompts SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }

    return this.getById(id) as Promise<Prompt>;
  }

  static async delete(id: string): Promise<void> {
    const now = new Date().toISOString();
    await database.run(
      `UPDATE prompts SET deletedAt = ? WHERE id = ?`,
      [now, id]
    );
  }

  static async search(query: string, category?: string, tags?: string[]): Promise<Prompt[]> {
    let sql = `SELECT DISTINCT p.* FROM prompts p
               LEFT JOIN prompt_tags pt ON p.id = pt.promptId
               LEFT JOIN tags t ON pt.tagId = t.id
               WHERE p.deletedAt IS NULL AND (p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?)`;
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (tags && tags.length > 0) {
      sql += ` AND t.name IN (${tags.map(() => '?').join(',')})`;
      params.push(...tags);
    }

    sql += ` ORDER BY p.createdAt DESC`;

    const results = await database.all(sql, params);

    return Promise.all(
      results.map(r => this.getById(r.id))
    ).then(prompts => prompts.filter((p): p is Prompt => p !== null));
  }

  private static async addTag(promptId: string, tagName: string): Promise<void> {
    const tag = await database.get(`SELECT id FROM tags WHERE name = ?`, [tagName]);

    let tagId = tag?.id;
    if (!tagId) {
      tagId = uuidv4();
      await database.run(
        `INSERT INTO tags (id, name, count) VALUES (?, ?, ?)`,
        [tagId, tagName, 1]
      );
    } else {
      await database.run(`UPDATE tags SET count = count + 1 WHERE id = ?`, [tagId]);
    }

    await database.run(
      `INSERT OR IGNORE INTO prompt_tags (promptId, tagId) VALUES (?, ?)`,
      [promptId, tagId]
    );
  }

  static async incrementViews(id: string): Promise<void> {
    await database.run(
      `UPDATE prompts SET views = views + 1 WHERE id = ?`,
      [id]
    );
  }

  static async toggleLike(id: string, liked: boolean): Promise<void> {
    const change = liked ? 1 : -1;
    await database.run(
      `UPDATE prompts SET likes = MAX(0, likes + ?) WHERE id = ?`,
      [change, id]
    );
  }
}
