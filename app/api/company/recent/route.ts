import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService, DEFAULT_COMPANY_ID } from '@/services/company/workspace';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || DEFAULT_COMPANY_ID;

    const recent = await CompanyWorkspaceService.getRecentlyViewed(companyId);

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
    const companyId = body.companyId || DEFAULT_COMPANY_ID;
    const { developerUserId } = body;

    if (!developerUserId) {
      return NextResponse.json({
        success: false,
        error: 'Developer User ID is required.',
      }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    const recruiterId = sessionUser?.id || '00000000-0000-0000-0000-000000000002';

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
