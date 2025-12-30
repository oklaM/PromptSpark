import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';

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
      `INSERT INTO prompt_history (id, promptId, version, title, description, content, category, tags, changedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, 1, data.title, data.description || '', data.content, data.category || '', JSON.stringify(data.tags || []), data.author || 'Anonymous', now]
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
    }
    if (data.category) {
      updateFields.push('category = ?');
      updateValues.push(data.category);
    }
    if ((data as any).isPublic !== undefined) {
      updateFields.push('isPublic = ?');
      updateValues.push((data as any).isPublic ? 1 : 0);
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
    // 更新标签（替换式）
    let currentTags = prompt.tags; // Default to existing
    if (data.tags) {
      // Remove existing prompt_tags entries
      await database.run(`DELETE FROM prompt_tags WHERE promptId = ?`, [id]);
      for (const tagName of data.tags) {
        await this.addTag(id, tagName);
      }
      currentTags = data.tags;
    }

    // Create new version history if content or core metadata changed
    // We assume any update via this method triggers a version if valuable fields changed.
    // Let's just do it for now.
    const history = await database.get(
      `SELECT MAX(version) as maxVersion FROM prompt_history WHERE promptId = ?`,
      [id]
    );
    const newVersion = (history.maxVersion || 0) + 1;
    
    // Construct full state for history
    const newState = {
        title: data.title !== undefined ? data.title : prompt.title,
        description: data.description !== undefined ? data.description : prompt.description,
        content: data.content !== undefined ? data.content : prompt.content,
        category: data.category !== undefined ? data.category : prompt.category,
        tags: currentTags
    };

    await database.run(
      `INSERT INTO prompt_history (id, promptId, version, title, description, content, category, tags, changedBy, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, newVersion, newState.title, newState.description || '', newState.content, newState.category || '', JSON.stringify(newState.tags || []), changedBy || 'Unknown', now]
    );

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

  // 批量删除（软删除）
  static async bulkDelete(ids: string[]): Promise<void> {
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    await database.run(
      `UPDATE prompts SET deletedAt = ? WHERE id IN (${placeholders})`,
      [now, ...ids]
    );
  }

  // 批量更新公开状态
  static async bulkUpdatePublish(ids: string[], isPublic: boolean): Promise<void> {
    const val = isPublic ? 1 : 0;
    const placeholders = ids.map(() => '?').join(',');
    await database.run(
      `UPDATE prompts SET isPublic = ?, updatedAt = ? WHERE id IN (${placeholders})`,
      [val, new Date().toISOString(), ...ids]
    );
  }

  // 复制提示词
  static async duplicate(promptId: string, author?: string): Promise<Prompt> {
    const prompt = await this.getById(promptId);
    if (!prompt) throw new Error('Prompt not found');

    const data: CreatePromptDTO = {
      title: `${prompt.title} (Copy)`,
      description: prompt.description,
      content: prompt.content,
      category: prompt.category,
      author: author || prompt.author,
      tags: prompt.tags || []
    };

    return this.create(data);
  }

  // 批量导入提示词（接收数组）
  static async importPrompts(items: CreatePromptDTO[]): Promise<Prompt[]> {
    const created: Prompt[] = [];
    for (const item of items) {
      const p = await this.create(item);
      created.push(p);
    }
    return created;
  }

  // 导出提示词（根据 ids 或全部），返回纯数据数组
  static async exportPrompts(ids?: string[]): Promise<Prompt[]> {
    if (ids && ids.length > 0) {
      const results = await Promise.all(ids.map(id => this.getById(id)));
      return results.filter((p): p is Prompt => p !== null);
    }
    const all = await this.getAll(1, 10000);
    return all.data;
  }

  // 认领提示词
  static async claim(id: string, username: string): Promise<void> {
    await database.run(
      `UPDATE prompts SET author = ? WHERE id = ? AND author = 'Anonymous'`,
      [username, id]
    );
  }
}
