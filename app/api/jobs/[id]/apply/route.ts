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

    let coverLetter: string | undefined;
    try {
      const body = await req.json();
      coverLetter = body.coverLetter;
    } catch {}

    const result = await OpportunityEngine.applyToOpportunity(userId, id, coverLetter);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.application,
      message: result.message,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/jobs/[id]/apply:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while applying to opportunity.',
    }, { status: 500 });
  }
}
