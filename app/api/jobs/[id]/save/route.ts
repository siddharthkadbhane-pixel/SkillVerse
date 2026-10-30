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
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id } = await params;
    const userId = auth.context.user.id;

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
