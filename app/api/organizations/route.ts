import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { organizations, organizationMembers } from '@/database/schema';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    let list: any[] = [];

    try {
      list = await withDbTimeout(
        db
          .select({
            id: organizations.id,
            name: organizations.name,
            type: organizations.type,
            createdAt: organizations.createdAt,
          })
          .from(organizations)
          .innerJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
          .where(eq(organizationMembers.userId, userId)),
        1000
      );
    } catch {}

    // Return user's actual organization affiliations; do not leak mock organizations
    return NextResponse.json({
      success: true,
      data: list || [],
    });
  } catch (error: any) {
    Logger.error('API Error in /api/organizations:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching organizations.',
    }, { status: 500 });
  }
}
