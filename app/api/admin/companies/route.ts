import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db, withDbTimeout } from '@/lib/drizzle';
import { companies, companyMembers } from '@/database/schema';
import { eq, ilike, desc, count, sql, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const whereClause = q ? ilike(companies.name, `%${q}%`) : undefined;

    const companyRows = await withDbTimeout(
      db.query.companies.findMany({
        where: whereClause,
        orderBy: [desc(companies.createdAt)],
        limit,
        offset,
      }),
      3000
    );

    const totalCountRes = await withDbTimeout(
      db.select({ count: count() }).from(companies).where(whereClause),
      3000
    );
    const totalCount = Number(totalCountRes[0]?.count || 0);

    // Annotate with member counts
    const annotatedCompanies = await Promise.all(
      (companyRows || []).map(async (comp) => {
        let memberCount = 0;
        try {
          const mRes = await withDbTimeout(
            db.select({ count: count() })
              .from(companyMembers)
              .where(eq(companyMembers.companyId, comp.id)),
            2000
          );
          memberCount = Number(mRes[0]?.count || 0);
        } catch {}

        return {
          id: comp.id,
          name: comp.name,
          logoUrl: comp.logoUrl,
          website: comp.website,
          description: comp.description,
          verified: comp.verified,
          createdAt: comp.createdAt,
          memberCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        companies: annotatedCompanies,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/admin/companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company workspaces' },
      { status: 500 }
    );
  }
}

