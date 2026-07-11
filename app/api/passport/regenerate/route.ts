import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { TrustCalculatorService } from '@/services/trust';
import { SkillDnaCalculatorService } from '@/services/skill-dna';
import { db } from '@/lib/drizzle';
import { passports } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock response if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Passport details regenerated (Mock Mode)',
      });
    }

    try {
      // 1. Recalculate Trust Score
      await TrustCalculatorService.calculateUserTrustScore(user.id);

      // 2. Recalculate Skill DNA
      await SkillDnaCalculatorService.calculateSkillDna(user.id);

      // 3. Update Passport timestamp
      await db
        .update(passports)
        .set({ lastGeneratedAt: new Date() })
        .where(eq(passports.userId, user.id));

      return NextResponse.json({
        success: true,
        message: 'Passport metrics and achievements regenerated successfully.',
      });
    } catch (err: any) {
      console.error('Passport regeneration database error:', err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
