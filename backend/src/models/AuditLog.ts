import { v4 as uuidv4 } from 'uuid';
import { database } from '../db/database';

export type AuditEventType =
  | 'user.created'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'prompt.created'
  | 'prompt.updated'
  | 'prompt.deleted'
  | 'prompt.viewed'
  | 'prompt.exported'
  | 'permission.granted'
  | 'permission.revoked'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.cancelled'
  | 'api_token.created'
  | 'api_token.deleted'
  | 'team.user_added'
  | 'team.user_removed'
  | 'team.role_changed';

export interface AuditLog {
  id: string;
  userId?: string;
  action: AuditEventType;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface CreateAuditLogData {
  userId?: string;
  action: AuditEventType;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

interface GetAllFilters {
  userId?: string;
  action?: AuditEventType;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}

function parseDetails(log: AuditLog): AuditLog {
  return {
    ...log,
    details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
  };
}

export class AuditLogModel {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly DEFAULT_RETENTION_DAYS = 90;

  static async create(data: CreateAuditLogData): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await database.run(
      `INSERT INTO audit_logs (id, "userId", action, "resourceType", "resourceId", details, "ipAddress", "userAgent", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        data.userId ?? null,
        data.action,
        data.resourceType,
        data.resourceId ?? null,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress ?? null,
        data.userAgent ?? null,
        now
      ]
    );
  }

  static async getByUser(
    userId: string,
    page: number = AuditLogModel.DEFAULT_PAGE,
    limit: number = AuditLogModel.DEFAULT_LIMIT
  ): Promise<PaginatedResult<AuditLog>> {
    const offset = (page - 1) * limit;

    const totalResult = await database.get<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE "userId" = $1`,
      [userId]
    );
    const total = parseInt(totalResult?.count || '0');

    const logs = await database.all<AuditLog>(
      `SELECT * FROM audit_logs WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      data: logs.map(parseDetails),
      total
    };
  }

  static async getByResource(
    resourceType: string,
    resourceId: string,
    page: number = AuditLogModel.DEFAULT_PAGE,
    limit: number = AuditLogModel.DEFAULT_LIMIT
  ): Promise<PaginatedResult<AuditLog>> {
    const offset = (page - 1) * limit;

    const totalResult = await database.get<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE "resourceType" = $1 AND "resourceId" = $2`,
      [resourceType, resourceId]
    );
    const total = parseInt(totalResult?.count || '0');

    const logs = await database.all<AuditLog>(
      `SELECT * FROM audit_logs WHERE "resourceType" = $1 AND "resourceId" = $2 ORDER BY "createdAt" DESC LIMIT $3 OFFSET $4`,
      [resourceType, resourceId, limit, offset]
    );

    return {
      data: logs.map(parseDetails),
      total
    };
  }

  static async getAll(
    page: number = AuditLogModel.DEFAULT_PAGE,
    limit: number = AuditLogModel.DEFAULT_LIMIT,
    filters?: GetAllFilters
  ): Promise<PaginatedResult<AuditLog>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.userId) {
      conditions.push(`"userId" = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters?.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters?.resourceType) {
      conditions.push(`"resourceType" = $${paramIndex++}`);
      params.push(filters.resourceType);
    }

    if (filters?.startDate) {
      conditions.push(`"createdAt" >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      conditions.push(`"createdAt" <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalResult = await database.get<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(totalResult?.count || '0');

    params.push(limit, offset);
    const logs = await database.all<AuditLog>(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY "createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return {
      data: logs.map(parseDetails),
      total
    };
  }

  static async cleanup(retentionDays: number = AuditLogModel.DEFAULT_RETENTION_DAYS): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await database.run(
      `DELETE FROM audit_logs WHERE "createdAt" < $1`,
      [cutoffDate.toISOString()]
    );

    return result.changes || 0;
  }
}
