import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService, DEFAULT_COMPANY_ID } from '@/services/company/workspace';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || DEFAULT_COMPANY_ID;

    const saved = await CompanyWorkspaceService.getSavedDevelopers(companyId);

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company/saved:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching saved developers.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = body.companyId || DEFAULT_COMPANY_ID;
    const { developerUserId, tags, notes } = body;

    if (!developerUserId) {
      return NextResponse.json({
        success: false,
        error: 'Developer User ID is required.',
      }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    const recruiterId = sessionUser?.id || '00000000-0000-0000-0000-000000000002';

    const result = await CompanyWorkspaceService.saveDeveloper(
      companyId,
      recruiterId,
      developerUserId,
      tags || ['Shortlisted'],
      notes
    );

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/company/saved:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while saving developer.',
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || DEFAULT_COMPANY_ID;
    const developerUserId = searchParams.get('developerUserId');

    if (!developerUserId) {
      return NextResponse.json({
        success: false,
        error: 'Developer User ID is required.',
      }, { status: 400 });
    }

    const result = await CompanyWorkspaceService.removeSavedDeveloper(companyId, developerUserId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in DELETE /api/company/saved:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while removing saved developer.',
    }, { status: 500 });
  }
}
