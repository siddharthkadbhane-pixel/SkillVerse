// SkillVerse Audit Logging Service (Phase 40)

import { db, withDbTimeout } from '@/lib/drizzle';
import { auditLogs } from '@/database/schema';
import { Logger } from '@/lib/logger';

export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, any> | null;
  createdAt: string;
}

const inMemoryAuditLogs: AuditLogEntry[] = [];

export class AuditLogService {
  /**
   * Records a security or administrative audit event
   */
  public static async log(params: {
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    details?: Record<string, any> | null;
  }): Promise<AuditLogEntry> {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      actorId: params.actorId || null,
      actorRole: params.actorRole || 'developer',
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId || null,
      ipAddress: params.ipAddress || '127.0.0.1',
      details: params.details || {},
      createdAt: new Date().toISOString(),
    };

    inMemoryAuditLogs.unshift(entry);

    // Persist in DB with fast circuit breaker timeout
    try {
      await withDbTimeout(
        db.insert(auditLogs).values({
          actorId: params.actorId ? (params.actorId as any) : null,
          actorRole: params.actorRole || 'developer',
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          ipAddress: params.ipAddress || '127.0.0.1',
          details: params.details || {},
        }),
        3000
      );
    } catch {
      // Memory store updated safely
    }

    Logger.info(`[AUDIT] Action: "${params.action}" on ${params.resourceType}:${params.resourceId || 'global'} by ${params.actorId || 'system'}`);

    return entry;
  }

  /**
   * Retrieves recent audit logs for administrators
   */
  public static async getRecentLogs(limit = 50, actionFilter?: string): Promise<AuditLogEntry[]> {
    if (actionFilter) {
      return inMemoryAuditLogs.filter((l) => l.action.toLowerCase().includes(actionFilter.toLowerCase())).slice(0, limit);
    }
    return inMemoryAuditLogs.slice(0, limit);
  }
}
