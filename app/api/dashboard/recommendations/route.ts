import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { getSessionUser } from '@/services/supabase';
import { skillDna } from '@/database/schema';
import { SkillDnaCalculatorService } from '@/services/skill-dna';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dna = await db.query.skillDna.findFirst({
      where: eq(skillDna.userId, user.id),
    });

    if (!dna) {
      return NextResponse.json({
        success: true,
        data: [
          { title: 'Connect a repository to verify skill DNA', description: 'Trigger analysis on codebases to map skill profiles and suggestions.', category: 'Software Engineering', difficulty: 'Beginner', priority: 'High' }
        ]
      });
    }

    const recs = SkillDnaCalculatorService.getLearningRecommendations(dna.dnaStructure as any);
    return NextResponse.json({
      success: true,
      data: recs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Database error occurred' }, { status: 500 });
  }
}
