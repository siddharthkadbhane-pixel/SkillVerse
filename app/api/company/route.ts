import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService, DEFAULT_COMPANY_ID } from '@/services/company/workspace';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || DEFAULT_COMPANY_ID;

    const profile = await CompanyWorkspaceService.getCompanyProfile(companyId);
    const members = await CompanyWorkspaceService.getCompanyMembers(companyId);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        membersCount: members.length,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching company workspace details.',
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = body.companyId || DEFAULT_COMPANY_ID;

    const updatedProfile = await CompanyWorkspaceService.updateCompanyProfile(companyId, body);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Company profile updated successfully.',
    });
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/company:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while updating company profile.',
    }, { status: 500 });
  }
}
