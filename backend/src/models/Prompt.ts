import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';
import { cacheService, CacheKeys } from '../services/cacheService';
import type { PromptRow, TagRow } from '../types/database';

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
  metadata?: any; // 存储结构化生成参数 (Seed, Model, etc.)
}

export interface CreatePromptDTO {
  title: string;
  description?: string;
  content: string;
  category?: string;
  author?: string;
  tags?: string[];
  metadata?: any;
}

export class PromptModel {
  static async create(data: CreatePromptDTO): Promise<Prompt> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO prompts (id, title, description, content, category, author, "createdAt", "updatedAt", metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title, data.description || '', data.content, data.category || '', data.author || 'Anonymous', now, now, data.metadata ? JSON.stringify(data.metadata) : null]
    );

    // 添加标签
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        await this.addTag(id, tagName);
      }
    }

    // 创建初始版本历史
    await database.run(
      `INSERT INTO prompt_history (id, "promptId", version, title, description, content, category, tags, "changedBy", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, 1, data.title, data.description || '', data.content, data.category || '', JSON.stringify(data.tags || []), data.author || 'Anonymous', now]
    );

    return this.getById(id) as Promise<Prompt>;
  }

  static async getById(id: string): Promise<Prompt | null> {
    // Check cache first
    const cacheKey = CacheKeys.PROMPT_BY_ID(id);
    const cached = cacheService.get<Prompt>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = await database.get<PromptRow>(
      `SELECT * FROM prompts WHERE id = $1 AND "deletedAt" IS NULL`,
      [id]
    );

    if (!prompt) return null;

    const tags = await database.all<Pick<TagRow, 'name'>>(
      `SELECT t.name FROM tags t
       JOIN prompt_tags pt ON t.id = pt."tagId"
       WHERE pt."promptId" = $1`,
      [id]
    );

    const result: Prompt = {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description || '',
      content: prompt.content,
      category: prompt.category || '',
      author: prompt.author || '',
      isPublic: Boolean(prompt.ispublic),
      views: prompt.views,
      likes: prompt.likes,
      tags: tags.map((t) => t.name),
      createdAt: prompt.createdat,
      updatedAt: prompt.updatedat,
      metadata: typeof prompt.metadata === 'string' ? JSON.parse(prompt.metadata) : prompt.metadata
    };

    // Cache for 5 minutes
    cacheService.set(cacheKey, result, 5 * 60 * 1000);

    return result;
  }

  static async getAll(page: number = 1, limit: number = 20): Promise<{data: Prompt[], total: number}> {
    const offset = (page - 1) * limit;

    const total = await database.get<{ count: string }>(
      `SELECT COUNT(*) as count FROM prompts WHERE "deletedAt" IS NULL`
    );

    const prompts = await database.all<PromptRow>(
      `SELECT * FROM prompts WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // 获取每个提示词的标签
    const promptsWithTags = await Promise.all(
      prompts.map(async (prompt) => {
        const tags = await database.all<Pick<TagRow, 'name'>>(
          `SELECT t.name FROM tags t
           JOIN prompt_tags pt ON t.id = pt."tagId"
           WHERE pt."promptId" = $1`,
          [prompt.id]
        );
        return {
          id: prompt.id,
          title: prompt.title,
          description: prompt.description || '',
          content: prompt.content,
          category: prompt.category || '',
          author: prompt.author || '',
          isPublic: Boolean(prompt.ispublic),
          views: prompt.views,
          likes: prompt.likes,
          tags: tags.map((t) => t.name),
          createdAt: prompt.createdat,
          updatedAt: prompt.updatedat,
          metadata: typeof prompt.metadata === 'string' ? JSON.parse(prompt.metadata) : prompt.metadata
        };
      })
    );

    return { data: promptsWithTags, total: parseInt(total?.count || '0') };
  }

  static async update(id: string, data: Partial<CreatePromptDTO>, changedBy?: string): Promise<Prompt> {
    const now = new Date().toISOString();
    const prompt = await this.getById(id);

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Invalidate cache for this prompt
    cacheService.delete(CacheKeys.PROMPT_BY_ID(id));
    cacheService.clearPattern(`prompt:list:*`);
    cacheService.clearPattern(`prompt:search:*`);

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.title) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(data.title);
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(data.description);
    }
    if (data.content) {
      updateFields.push(`content = $${paramIndex++}`);
      updateValues.push(data.content);
    }
    if (data.category) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(data.category);
    }
    if ((data as any).isPublic !== undefined) {
      updateFields.push(`"isPublic" = $${paramIndex++}`);
      updateValues.push((data as any).isPublic ? 1 : 0);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    updateValues.push(now);
    updateValues.push(id);

    if (updateFields.length > 1) {
      await database.run(
        `UPDATE prompts SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );
    }
    // 更新标签（替换式）
    let currentTags = prompt.tags; // Default to existing
    if (data.tags) {
      // Remove existing prompt_tags entries
      await database.run(`DELETE FROM prompt_tags WHERE "promptId" = ?`, [id]);
      for (const tagName of data.tags) {
        await this.addTag(id, tagName);
      }
      currentTags = data.tags;
    }

    // Create new version history if content or core metadata changed
    // We assume any update via this method triggers a version if valuable fields changed.
    // Let's just do it for now.
    const history = await database.get<{ maxversion: string }>(
      `SELECT MAX(version) as "maxVersion" FROM prompt_history WHERE "promptId" = ?`,
      [id]
    );
    const newVersion = parseInt(history?.maxversion || '0') + 1;
    
    // Construct full state for history
    const newState = {
        title: data.title !== undefined ? data.title : prompt.title,
        description: data.description !== undefined ? data.description : prompt.description,
        content: data.content !== undefined ? data.content : prompt.content,
        category: data.category !== undefined ? data.category : prompt.category,
        tags: currentTags
    };

    await database.run(
      `INSERT INTO prompt_history (id, "promptId", version, title, description, content, category, tags, "changedBy", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, newVersion, newState.title, newState.description || '', newState.content, newState.category || '', JSON.stringify(newState.tags || []), changedBy || 'Unknown', now]
    );

    return this.getById(id) as Promise<Prompt>;
  }

  static async delete(id: string): Promise<void> {
    const now = new Date().toISOString();

    // Invalidate cache for this prompt
    cacheService.delete(CacheKeys.PROMPT_BY_ID(id));
    cacheService.clearPattern(`prompt:list:*`);
    cacheService.clearPattern(`prompt:search:*`);

    await database.run(
      `UPDATE prompts SET "deletedAt" = $1 WHERE id = $2`,
      [now, id]
    );
  }

  static async search(
    query: string,
    category?: string,
    tags?: string[],
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Prompt[]; total: number }> {
    const offset = (page - 1) * limit;

    // Count query
    let countSql = `SELECT COUNT(DISTINCT p.id) as count FROM prompts p
                    LEFT JOIN prompt_tags pt ON p.id = pt."promptId"
                    LEFT JOIN tags t ON pt."tagId" = t.id
                    WHERE p."deletedAt" IS NULL AND (p.title LIKE $1 OR p.description LIKE $2 OR p.content LIKE $3)`;
    const countParams: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      countSql += ` AND p.category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (tags && tags.length > 0) {
      countSql += ` AND t.name IN (${tags.map((_, i) => `$${countParams.length + 1 + i}`).join(',')})`;
      countParams.push(...tags);
    }

    const totalResult = await database.get<{ count: string }>(countSql, countParams);
    const total = parseInt(totalResult?.count || '0');

    // Data query
    let dataSql = `SELECT DISTINCT p.* FROM prompts p
                   LEFT JOIN prompt_tags pt ON p.id = pt."promptId"
                   LEFT JOIN tags t ON pt."tagId" = t.id
                   WHERE p."deletedAt" IS NULL AND (p.title LIKE $1 OR p.description LIKE $2 OR p.content LIKE $3)`;
    const dataParams: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];

    if (category) {
      dataSql += ` AND p.category = $${dataParams.length + 1}`;
      dataParams.push(category);
    }

    if (tags && tags.length > 0) {
      dataSql += ` AND t.name IN (${tags.map((_, i) => `$${dataParams.length + 1 + i}`).join(',')})`;
      dataParams.push(...tags);
    }

    dataSql += ` ORDER BY p."createdAt" DESC LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
    dataParams.push(limit, offset);

    const results = await database.all<PromptRow>(dataSql, dataParams);

    const data = await Promise.all(
      results.map(r => this.getById(r.id))
    ).then(prompts => prompts.filter((p): p is Prompt => p !== null));

    return { data, total };
  }

  /**
   * Advanced search with metadata filtering
   * Allows searching by model, seed, and other Civitai parameters stored in metadata
   */
  static async advancedSearch(
    filters: {
      query?: string;
      category?: string;
      tags?: string[];
      model?: string;
      sampler?: string;
      minSeed?: number;
      maxSeed?: number;
      author?: string;
      isPublic?: boolean;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Prompt[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Base condition - no deleted prompts
    conditions.push('p."deletedAt" IS NULL');

    // Text search (title, description, content)
    if (filters.query) {
      conditions.push(`(p.title LIKE $${paramIndex++} OR p.description LIKE $${paramIndex++} OR p.content LIKE $${paramIndex++})`);
      params.push(`%${filters.query}%`, `%${filters.query}%`, `%${filters.query}%`);
    }

    // Category filter
    if (filters.category) {
      conditions.push(`p.category = $${paramIndex++}`);
      params.push(filters.category);
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`t.name IN (${filters.tags.map(() => `$${paramIndex++}`).join(',')})`);
      params.push(...filters.tags);
    }

    // Model filter (from metadata)
    if (filters.model) {
      conditions.push(`p.metadata->>'Model' LIKE $${paramIndex++}`);
      params.push(`%${filters.model}%`);
    }

    // Sampler filter (from metadata)
    if (filters.sampler) {
      conditions.push(`p.metadata->>'Sampler' LIKE $${paramIndex++}`);
      params.push(`%${filters.sampler}%`);
    }

    // Seed range filter (from metadata)
    if (filters.minSeed !== undefined) {
      conditions.push(`CAST(p.metadata->>'Seed' AS INTEGER) >= $${paramIndex++}`);
      params.push(filters.minSeed);
    }

    if (filters.maxSeed !== undefined) {
      conditions.push(`CAST(p.metadata->>'Seed' AS INTEGER) <= $${paramIndex++}`);
      params.push(filters.maxSeed);
    }

    // Author filter
    if (filters.author) {
      conditions.push(`p.author = $${paramIndex++}`);
      params.push(filters.author);
    }

    // Public/private filter
    if (filters.isPublic !== undefined) {
      conditions.push(`p."isPublic" = $${paramIndex++}`);
      params.push(filters.isPublic);
    }

    // Count query
    const countSql = `SELECT COUNT(DISTINCT p.id) as count FROM prompts p
                    LEFT JOIN prompt_tags pt ON p.id = pt."promptId"
                    LEFT JOIN tags t ON pt."tagId" = t.id
                    WHERE ${conditions.join(' AND ')}`;

    const totalResult = await database.get<{ count: string }>(countSql, params);
    const total = parseInt(totalResult?.count || '0');

    // Data query
    const dataSql = `SELECT DISTINCT p.* FROM prompts p
                   LEFT JOIN prompt_tags pt ON p.id = pt."promptId"
                   LEFT JOIN tags t ON pt."tagId" = t.id
                   WHERE ${conditions.join(' AND ')}
                   ORDER BY p."createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const results = await database.all<PromptRow>(dataSql, params);

    const data = await Promise.all(
      results.map(r => this.getById(r.id))
    ).then(prompts => prompts.filter((p): p is Prompt => p !== null));

    return { data, total };
  }

  private static async addTag(promptId: string, tagName: string): Promise<void> {
    const tag = await database.get<Pick<TagRow, 'id'>>(`SELECT id FROM tags WHERE name = ?`, [tagName]);

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
      `INSERT INTO prompt_tags ("promptId", "tagId") VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [promptId, tagId]
    );
  }

  static async incrementViews(id: string): Promise<void> {
    // Invalidate cache before incrementing
    cacheService.delete(CacheKeys.PROMPT_BY_ID(id));

    await database.run(
      `UPDATE prompts SET views = views + 1 WHERE id = ?`,
      [id]
    );
  }

  static async toggleLike(id: string, liked: boolean): Promise<void> {
    const change = liked ? 1 : -1;
    await database.run(
      `UPDATE prompts SET likes = GREATEST(0, likes + ?) WHERE id = ?`,
      [change, id]
    );
  }

  // 批量删除（软删除）
  static async bulkDelete(ids: string[]): Promise<void> {
    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    await database.run(
      `UPDATE prompts SET "deletedAt" = ? WHERE id IN (${placeholders})`,
      [now, ...ids]
    );
  }

  // 批量更新公开状态
  static async bulkUpdatePublish(ids: string[], isPublic: boolean): Promise<void> {
    const val = isPublic ? 1 : 0;
    const placeholders = ids.map(() => '?').join(',');
    await database.run(
      `UPDATE prompts SET "isPublic" = ?, "updatedAt" = ? WHERE id IN (${placeholders})`,
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
