import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService, DEFAULT_COMPANY_ID } from '@/services/company/workspace';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || DEFAULT_COMPANY_ID;

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
    const companyId = body.companyId || DEFAULT_COMPANY_ID;
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email address is required for member invitation.',
      }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    const inviterId = sessionUser?.id || '00000000-0000-0000-0000-000000000002';

    const result = await CompanyWorkspaceService.inviteMember(companyId, email, role || 'recruiter', inviterId);

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
    const companyId = searchParams.get('companyId') || DEFAULT_COMPANY_ID;
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({
        success: false,
        error: 'Member ID is required.',
      }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    const requesterId = sessionUser?.id || '00000000-0000-0000-0000-000000000002';

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
