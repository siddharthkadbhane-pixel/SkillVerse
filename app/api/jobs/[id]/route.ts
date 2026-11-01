import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || undefined;

    const opportunity = await OpportunityEngine.getOpportunityById(id, userId);

    if (!opportunity) {
      return NextResponse.json({
        success: false,
        error: 'Opportunity not found.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: opportunity,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/jobs/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching opportunity details.',
    }, { status: 500 });
  }
}
