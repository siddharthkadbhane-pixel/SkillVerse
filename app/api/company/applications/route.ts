import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { getSessionUser } from '@/services/supabase';
import { ApplicationStatus } from '@/types/opportunity';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || '00000000-0000-0000-0000-000000000001';
    const opportunityId = searchParams.get('opportunityId') || undefined;

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

    if (!applicationId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Application ID and new status are required.',
      }, { status: 400 });
    }

    const result = await OpportunityEngine.updateApplicationStatus(
      companyId || '00000000-0000-0000-0000-000000000001',
      applicationId,
      status as ApplicationStatus
    );

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/company/applications:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while updating application status.',
    }, { status: 500 });
  }
}
