import { NextRequest, NextResponse } from 'next/server';
import { VerificationIntegrityEngine } from '@/services/verification/integrity';
import { DCCEvidenceService } from '@/services/dcc/evidence';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const targetUserId = auth.context.user.id;

    // 1. Re-compile verified skills with updated freshness
    const updatedSkills = await DCCEvidenceService.compileVerifiedSkills(targetUserId);

    // 2. Get updated verification integrity summary
    const summary = await VerificationIntegrityEngine.getVerificationIntegritySummary(targetUserId);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        verifiedSkillsCount: updatedSkills.filter(s => s.status === 'verified').length,
        totalSkills: updatedSkills.length,
      },
      message: 'Verification integrity recalculated with server-side validation.',
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/verify/recalculate:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during verification recalculation.',
    }, { status: 500 });
  }
}
