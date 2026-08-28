import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const result = await OpportunityEngine.saveOpportunity(userId, id);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/jobs/[id]/save:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while saving opportunity.',
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const result = await OpportunityEngine.unsaveOpportunity(userId, id);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in DELETE /api/jobs/[id]/save:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while unsaving opportunity.',
    }, { status: 500 });
  }
}
