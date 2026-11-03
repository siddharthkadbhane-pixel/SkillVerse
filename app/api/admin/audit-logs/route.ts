import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db, withDbTimeout } from '@/lib/drizzle';
import { auditLogs, users } from '@/database/schema';
import { eq, desc, count, ilike, and } from 'drizzle-orm';
import { AuditLogService } from '@/services/security/audit';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const actionFilter = searchParams.get('action')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
    const offset = (page - 1) * limit;

    const whereClause = actionFilter ? ilike(auditLogs.action, `%${actionFilter}%`) : undefined;

    try {
      const logs = await withDbTimeout(
        db.query.auditLogs.findMany({
          where: whereClause,
          orderBy: [desc(auditLogs.createdAt)],
          limit,
          offset,
        }),
        3000
      );

      const countRes = await withDbTimeout(
        db.select({ count: count() }).from(auditLogs).where(whereClause),
        2000
      );
      const total = Number(countRes[0]?.count || 0);

      return NextResponse.json({
        success: true,
        data: {
          logs: logs || [],
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch {
      // In-memory fallback if database query times out
      const fallbackLogs = await AuditLogService.getRecentLogs(limit, actionFilter);
      return NextResponse.json({
        success: true,
        data: {
          logs: fallbackLogs,
          pagination: {
            page: 1,
            limit,
            total: fallbackLogs.length,
            totalPages: 1,
          },
        },
      });
    }
  } catch (error: any) {
    Logger.error('API Error in GET /api/admin/audit-logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

