import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { ApplicationStatus } from '@/types/opportunity';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const opportunityId = searchParams.get('opportunityId') || undefined;

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

    const apps = await OpportunityEngine.getCompanyApplications(companyId, opportunityId);

    return NextResponse.json({
      success: true,
      data: apps,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/company/applications:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching company applications.',
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, status, companyId } = body;

    if (!companyId || !applicationId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'companyId, applicationId, and status are required.',
      }, { status: 400 });
    }

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = await OpportunityEngine.updateApplicationStatus(
      companyId,
      applicationId,
      status as ApplicationStatus
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/company/applications:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while updating application status.',
    }, { status: 500 });
  }
}
