import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService } from '@/services/company/workspace';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { CompanyRole } from '@/types/company';
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

    const members = await CompanyWorkspaceService.getCompanyMembers(companyId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company/members:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching company members.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = body?.companyId;
    const { email, role } = body;

    if (!companyId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'companyId is required in request body.',
      }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'A valid email address is required for member invitation.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId, 'company_admin');
    if (!auth.authorized) {
      return auth.response!;
    }

    const targetRole: CompanyRole = role === 'company_admin' ? 'company_admin' : 'recruiter';
    const inviterId = auth.context.user.id;

    const result = await CompanyWorkspaceService.inviteMember(companyId, email, targetRole, inviterId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/company/members:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while inviting member.',
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const memberId = searchParams.get('memberId');

    if (!companyId || !memberId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Both companyId and memberId query parameters are required.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId, 'company_admin');
    if (!auth.authorized) {
      return auth.response!;
    }

    const requesterId = auth.context.user.id;
    const result = await CompanyWorkspaceService.removeMember(companyId, memberId, requesterId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in DELETE /api/company/members:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while removing member.',
    }, { status: 500 });
  }
}
