import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService } from '@/services/company/workspace';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const developerUserId = searchParams.get('developerUserId');

    if (!companyId || !developerUserId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Both companyId and developerUserId query parameters are required.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId);
    if (!auth.authorized) {
      return auth.response!;
    }

    const notes = await CompanyWorkspaceService.getRecruiterNotes(companyId, developerUserId);

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company/notes:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching recruiter notes.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyId = body?.companyId;
    const { developerUserId, content } = body;

    if (!companyId || !developerUserId || !content) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'companyId, developerUserId, and content are required.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId);
    if (!auth.authorized) {
      return auth.response!;
    }

    const recruiterId = auth.context.user.id;

    const result = await CompanyWorkspaceService.addRecruiterNote(
      companyId,
      recruiterId,
      developerUserId,
      content
    );

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/company/notes:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while saving recruiter note.',
    }, { status: 500 });
  }
}
