import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { SkillDnaCalculatorService } from '@/services/skill-dna';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock recalculation if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          overallLevel: 75,
          skills: [
            { name: 'TypeScript', category: 'Programming Languages', level: 85, confidence: 90, evidenceCount: 5, repositoryCount: 2, lastVerified: new Date().toISOString(), growthTrend: 15, verificationStatus: 'verified' },
            { name: 'React', category: 'Frontend', level: 82, confidence: 90, evidenceCount: 4, repositoryCount: 2, lastVerified: new Date().toISOString(), growthTrend: 10, verificationStatus: 'verified' }
          ],
          categorySummaries: [
            { name: 'Frontend', averageLevel: 83, skillsCount: 3 },
            { name: 'Programming Languages', averageLevel: 85, skillsCount: 1 }
          ],
          lastUpdated: new Date().toISOString(),
          engineVersion: '1.0.0',
        }
      });
    }

    try {
      const updatedProfile = await SkillDnaCalculatorService.calculateSkillDna(user.id);
      return NextResponse.json({
        success: true,
        data: updatedProfile,
      });
    } catch (err: any) {
      console.error('Recalculation error:', err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
