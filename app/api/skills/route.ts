import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { skillDna } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { SkillDnaCalculatorService } from '@/services/skill-dna';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let dna = await db.query.skillDna.findFirst({
      where: eq(skillDna.userId, user.id),
    });

    // Initialize DNA if it doesn't exist
    if (!dna) {
      const details = await SkillDnaCalculatorService.calculateSkillDna(user.id);
      return NextResponse.json({ success: true, data: details });
    }

    return NextResponse.json({
      success: true,
      data: dna.dnaStructure,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Database error occurred' }, { status: 500 });
  }
}
