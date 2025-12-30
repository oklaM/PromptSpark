import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';

export interface EvalLog {
  id: string;
  promptId?: string;
  modelId: string;
  variables?: Record<string, string>;
  content: string;
  output?: string;
  score?: number; // 1 = Good, 0 = Bad
  latency?: number;
  tokens?: number;
  createdAt: string;
}

export interface CreateEvalLogDTO {
  promptId?: string;
  modelId: string;
  variables?: Record<string, string>;
  content: string;
  output?: string;
  score?: number;
  latency?: number;
  tokens?: number;
}

export class EvalLogModel {
  static async create(data: CreateEvalLogDTO): Promise<EvalLog> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const variablesStr = data.variables ? JSON.stringify(data.variables) : null;

    await database.run(
      `INSERT INTO eval_logs (id, promptId, modelId, variables, content, output, score, latency, tokens, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        data.promptId || null, 
        data.modelId, 
        variablesStr, 
        data.content, 
        data.output || '', 
        data.score !== undefined ? data.score : null,
        data.latency || 0,
        data.tokens || 0,
        now
      ]
    );

    return this.getById(id) as Promise<EvalLog>;
  }

  static async getById(id: string): Promise<EvalLog | null> {
    const row = await database.get(`SELECT * FROM eval_logs WHERE id = ?`, [id]);
    if (!row) return null;
    return this.mapRow(row);
  }

  static async getByPromptId(promptId: string, limit: number = 50): Promise<EvalLog[]> {
    const rows = await database.all(
      `SELECT * FROM eval_logs WHERE promptId = ? ORDER BY createdAt DESC LIMIT ?`,
      [promptId, limit]
    );
    return rows.map(this.mapRow);
  }

  static async getStats(promptId: string): Promise<{ total: number, good: number, bad: number, passRate: number }> {
    const row = await database.get(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN score = 1 THEN 1 ELSE 0 END) as good,
         SUM(CASE WHEN score = 0 THEN 1 ELSE 0 END) as bad
       FROM eval_logs 
       WHERE promptId = ? AND score IS NOT NULL`,
      [promptId]
    );
    
    const total = row.total || 0;
    const good = row.good || 0;
    const bad = row.bad || 0;
    
    return {
      total,
      good,
      bad,
      passRate: total > 0 ? (good / total) : 0
    };
  }

  private static mapRow(row: any): EvalLog {
    return {
      ...row,
      variables: row.variables ? JSON.parse(row.variables) : {},
      score: row.score // SQLite returns null as null, int as int
    };
  }
}
