import { NextRequest, NextResponse } from 'next/server';
import { VerificationIntegrityEngine } from '@/services/verification/integrity';
import { DCCEvidenceService } from '@/services/dcc/evidence';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    const targetUserId = sessionUser?.id || '00000000-0000-0000-0000-000000000001';

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
