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

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await req.json();
    const { name, website, description, logoUrl } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Company name is required.' },
        { status: 400 }
      );
    }

    const result = await CompanyWorkspaceService.registerCompany(auth.context.user.id, {
      name,
      website,
      description,
      logoUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Registration Failed', message: result.error || 'Failed to register company.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.company,
        message: 'Company workspace successfully registered and administrative ownership established.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    Logger.error('API Error in POST /api/company:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while registering company workspace.' },
      { status: 500 }
    );
  }
}
