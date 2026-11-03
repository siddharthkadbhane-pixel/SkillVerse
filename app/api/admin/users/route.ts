import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users, auditLogs } from '@/database/schema';
import { eq, or, ilike, desc, count, sql, and, inArray } from 'drizzle-orm';
import { UserStatusService } from '@/services/admin/userStatus';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const roleFilter = searchParams.get('role')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (q) {
      conditions.push(
        or(
          ilike(users.name, `%${q}%`),
          ilike(users.email, `%${q}%`),
          ilike(users.username, `%${q}%`)
        )
      );
    }

    if (roleFilter && ['developer', 'recruiter', 'company_admin', 'admin'].includes(roleFilter)) {
      conditions.push(eq(users.role, roleFilter as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch user rows
    const userRows = await withDbTimeout(
      db.query.users.findMany({
        where: whereClause,
        orderBy: [desc(users.createdAt)],
        limit,
        offset,
        columns: {
          id: true,
          email: true,
          name: true,
          username: true,
          avatarUrl: true,
          role: true,
          companyId: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      4000
    );

    // Fetch total count for pagination
    const totalCountRes = await withDbTimeout(
      db.select({ count: count() }).from(users).where(whereClause),
      3000
    );
    const totalCount = Number(totalCountRes[0]?.count || 0);

    // Annotate users with real suspension status
    const annotatedUsers = await Promise.all(
      (userRows || []).map(async (u) => {
        const isSuspended = await UserStatusService.isUserSuspended(u.id);
        return {
          id: u.id,
          email: u.email,
          name: u.name || u.username,
          username: u.username,
          avatarUrl: u.avatarUrl,
          role: u.role,
          companyId: u.companyId,
          emailVerified: u.emailVerified,
          status: isSuspended ? 'suspended' : 'active',
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      })
    );

    // Apply status filter if specified
    const filteredUsers = statusFilter
      ? annotatedUsers.filter((u) => u.status === statusFilter)
      : annotatedUsers;

    return NextResponse.json({
      success: true,
      data: {
        users: filteredUsers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registered users' },
      { status: 500 }
    );
  }
}

