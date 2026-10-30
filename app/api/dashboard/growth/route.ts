import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { CapabilityGrowthService } from '@/services/dcc/growth';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;

    const summary = await CapabilityGrowthService.getDashboardGrowthSummary(userId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dashboard/growth:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching growth summary.',
    }, { status: 500 });
  }
}
