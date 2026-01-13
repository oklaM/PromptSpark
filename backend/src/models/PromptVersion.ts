import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';
import type { PromptRow } from '../types/database';

export interface PromptVersion {
  id: string;
  promptId: string;
  version: number;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  changedBy: string;
  changeLog: string;
  createdAt: string;
}

interface PromptHistoryRow {
  id: string;
  promptid: string;
  version: number;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string;
  changedby: string;
  changelog?: string;
  createdat: string;
}

export class PromptVersionModel {
  static async getHistory(promptId: string): Promise<PromptVersion[]> {
    const rows = await database.all<PromptHistoryRow>(
      `SELECT * FROM prompt_history WHERE "promptId" = ? ORDER BY version DESC`,
      [promptId]
    );

    return rows.map(row => ({
      id: row.id,
      promptId: row.promptid,
      version: row.version,
      title: row.title,
      description: row.description,
      content: row.content,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      changedBy: row.changedby,
      changeLog: row.changelog || '',
      createdAt: row.createdat
    }));
  }

  static async getVersion(promptId: string, version: number): Promise<PromptVersion | null> {
    const row = await database.get<PromptHistoryRow>(
      `SELECT * FROM prompt_history WHERE "promptId" = ? AND version = ?`,
      [promptId, version]
    );

    if (!row) return null;

    return {
      id: row.id,
      promptId: row.promptid,
      version: row.version,
      title: row.title,
      description: row.description,
      content: row.content,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      changedBy: row.changedby,
      changeLog: row.changelog || '',
      createdAt: row.createdat
    };
  }

  static async create(data: {
    promptId: string;
    version: number;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    changedBy: string;
    changeLog?: string;
  }): Promise<PromptVersion> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO prompt_history (id, "promptId", version, title, description, content, category, tags, "changedBy", "changeLog", "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.promptId,
        data.version,
        data.title,
        data.description || '',
        data.content,
        data.category || '',
        JSON.stringify(data.tags || []),
        data.changedBy || 'System',
        data.changeLog || '',
        now
      ]
    );

    return (await this.getVersion(data.promptId, data.version))!;
  }
}
