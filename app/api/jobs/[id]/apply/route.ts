import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id } = await params;
    const userId = auth.context.user.id;

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
