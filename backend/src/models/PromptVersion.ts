import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';

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

export class PromptVersionModel {
  static async getHistory(promptId: string): Promise<PromptVersion[]> {
    const rows = await database.all(
      `SELECT * FROM prompt_history WHERE promptId = ? ORDER BY version DESC`,
      [promptId]
    );

    return rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  }

  static async getVersion(promptId: string, version: number): Promise<PromptVersion | null> {
    const row = await database.get(
      `SELECT * FROM prompt_history WHERE promptId = ? AND version = ?`,
      [promptId, version]
    );

    if (!row) return null;

    return {
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
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
      `INSERT INTO prompt_history (id, promptId, version, title, description, content, category, tags, changedBy, changeLog, createdAt)
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
