import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService } from '@/services/company/workspace';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'companyId query parameter is required.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId);
    if (!auth.authorized) {
      return auth.response!;
    }

    const recent = await CompanyWorkspaceService.getRecentlyViewed(companyId, auth.context.user.id);

    return NextResponse.json({
      success: true,
      data: recent,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company/recent:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching recently viewed developers.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = body?.companyId;
    const { developerUserId } = body;

    if (!companyId || !developerUserId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Both companyId and developerUserId are required.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId);
    if (!auth.authorized) {
      return auth.response!;
    }

    const recruiterId = auth.context.user.id;

    await CompanyWorkspaceService.recordRecentlyViewed(companyId, recruiterId, developerUserId);

    return NextResponse.json({
      success: true,
      message: 'Recorded recently viewed profile.',
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/company/recent:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while recording recently viewed developer.',
    }, { status: 500 });
  }
}
