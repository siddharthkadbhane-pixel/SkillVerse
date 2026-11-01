import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { getSessionUser } from '@/services/supabase';
import { OpportunityFilter, OpportunityType, WorkplaceType } from '@/types/opportunity';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

    const filter: OpportunityFilter = {
      q: searchParams.get('q') || undefined,
      skill: searchParams.get('skill') || undefined,
      capability: searchParams.get('capability') || undefined,
      type: (searchParams.get('type') as OpportunityType) || undefined,
      workplaceType: (searchParams.get('workplaceType') as WorkplaceType) || undefined,
      location: searchParams.get('location') || undefined,
      companyId: searchParams.get('companyId') || undefined,
    };

    const result = await OpportunityEngine.getOpportunities(filter, userId);

    return NextResponse.json({
      success: true,
      data: result.opportunities,
      totalCount: result.totalCount,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching opportunities.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const auth = await AuthorizationGuard.requireCompanyMembership(req, companyId);
    if (!auth.authorized) {
      return auth.response!;
    }

    const recruiterId = auth.context.user.id;
    const result = await OpportunityEngine.createOpportunity(companyId, recruiterId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating opportunity.',
    }, { status: 500 });
  }
}
