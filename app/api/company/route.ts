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

    const profile = await CompanyWorkspaceService.getCompanyProfile(companyId);
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Not Found',
        message: 'Company workspace not found.',
      }, { status: 404 });
    }

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
    const companyId = body?.companyId;

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'companyId is required in request body.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId, 'company_admin');
    if (!auth.authorized) {
      return auth.response!;
    }

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
