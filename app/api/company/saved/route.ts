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
    const companyId = body?.companyId;
    const { developerUserId, tags, notes } = body;

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
