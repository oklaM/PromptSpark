import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';
import type { ApiTokenRow } from '../types/database';

export interface ApiToken {
  id: string;
  userId: string;
  name: string;
  token: string; // In a real app, this should be hashed. Storing plain for MVP convenience.
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

export class ApiTokenModel {
  static async create(userId: string, name: string): Promise<ApiToken> {
    const id = uuidv4();
    const token = `sk-ps-${uuidv4().replace(/-/g, '')}`;
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO api_tokens (id, "userId", name, token, "createdAt")
       VALUES (?, ?, ?, ?, ?)`,
      [id, userId, name, token, now]
    );

    return (await this.getById(id))!;
  }

  static async getById(id: string): Promise<ApiToken | null> {
    const row = await database.get<ApiTokenRow>(`SELECT * FROM api_tokens WHERE id = ?`, [id]);
    if (!row) return null;

    return {
      id: row.id,
      userId: row.userid,
      name: row.name,
      token: row.token,
      createdAt: row.createdat,
      lastUsedAt: row.lastused,
      expiresAt: row.expiresat
    };
  }

  static async getByUser(userId: string): Promise<ApiToken[]> {
    const rows = await database.all<ApiTokenRow>(
      `SELECT * FROM api_tokens WHERE "userId" = ? ORDER BY "createdAt" DESC`,
      [userId]
    );

    return rows.map(row => ({
      id: row.id,
      userId: row.userid,
      name: row.name,
      token: row.token,
      createdAt: row.createdat,
      lastUsedAt: row.lastused,
      expiresAt: row.expiresat
    }));
  }

  static async revoke(id: string, userId: string): Promise<boolean> {
    // Ensure user owns the token
    const result = await database.run(
      `DELETE FROM api_tokens WHERE id = ? AND "userId" = ?`,
      [id, userId]
    );
    return result.changes > 0;
  }

  static async validate(token: string): Promise<{ userId: string } | null> {
    const row = await database.get<ApiTokenRow>(`SELECT * FROM api_tokens WHERE token = ?`, [token]);

    if (!row) return null;

    // Update last used
    const now = new Date().toISOString();
    await database.run(`UPDATE api_tokens SET "lastUsedAt" = ? WHERE id = ?`, [now, row.id]);

    return { userId: row.userid };
  }
}
