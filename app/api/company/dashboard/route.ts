import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { companyMembers, companies, challenges } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get('companyId');

    if (companyId) {
      const membershipCheck = await AuthorizationGuard.requireCompanyMembership(req, companyId);
      if (!membershipCheck.authorized) {
        return membershipCheck.response!;
      }
    } else {
      // Find user's active company membership
      try {
        const member = await withDbTimeout(
          db.query.companyMembers.findFirst({
            where: and(
              eq(companyMembers.userId, auth.context.user.id),
              eq(companyMembers.status, 'active')
            ),
          }),
          250
        );
        if (member) {
          companyId = member.companyId;
        }
      } catch {}
    }

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden',
        message: 'No active company workspace associated with this user.',
      }, { status: 403 });
    }

    let companyName = 'Company Workspace';
    let isVerified = false;

    try {
      const company = await withDbTimeout(
        db.query.companies.findFirst({
          where: eq(companies.id, companyId),
        }),
        250
      );
      if (company) {
        companyName = company.name;
        isVerified = !!company.verified;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: {
        companyId,
        companyName,
        isVerified,
        challengesPublished: 0,
        totalSubmissions: 0,
        averageScore: 0,
        topTechnologies: [],
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company/dashboard:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching dashboard statistics.',
    }, { status: 500 });
  }
}
