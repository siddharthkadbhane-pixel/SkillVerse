import { NextRequest, NextResponse } from 'next/server';
import { ContributionIntelligenceService } from '@/services/activity/intelligence';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (username) {
      const publicIntelligence = await ContributionIntelligenceService.getPublicContributionIntelligence(username);
      if (!publicIntelligence) {
        return NextResponse.json({
          success: false,
          error: 'Developer activity is private or not found.',
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: publicIntelligence,
      });
    }

    // Authenticated profile activity
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const targetUserId = auth.context.user.id;

    const intelligence = await ContributionIntelligenceService.getContributionIntelligence(targetUserId);

    return NextResponse.json({
      success: true,
      data: intelligence,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/activity:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching activity intelligence.',
    }, { status: 500 });
  }
}
