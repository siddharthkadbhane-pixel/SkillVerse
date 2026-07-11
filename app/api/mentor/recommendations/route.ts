import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { getSessionUser } from '@/services/supabase';
import { skillDna } from '@/database/schema';
import { SkillDnaCalculatorService } from '@/services/skill-dna';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock learning recommendations if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          technologies: [
            { name: 'TypeScript Strict Mode', reason: 'To build bulletproof, type-safe API boundaries.' },
            { name: 'Vitest / Jest Testing Frameworks', reason: 'To establish unit testing pipelines.' }
          ],
          weeklyPlan: [
            'Day 1-2: Add tsconfig strict flags to one project.',
            'Day 3-5: Install Vitest and write 5 test cases.',
            'Day 6-7: Refactor folder components into separate modules.'
          ]
        }
      });
    }

    try {
      const dna = await db.query.skillDna.findFirst({
        where: eq(skillDna.userId, user.id),
      });

      if (!dna) {
        return NextResponse.json({
          success: true,
          data: {
            technologies: [{ name: 'Git & GitHub Rest API integration', reason: 'To connect codebases and verify DNA.' }],
            weeklyPlan: ['Connect a repository on the dashboard to build your Skill DNA.']
          }
        });
      }

      const recs = SkillDnaCalculatorService.getLearningRecommendations(dna.dnaStructure as any);
      const mappedTech = recs.map(r => ({
        name: r.title,
        reason: r.description,
      }));

      return NextResponse.json({
        success: true,
        data: {
          technologies: mappedTech.slice(0, 3),
          weeklyPlan: [
            `Day 1-2: Address ${recs[0]?.title || 'code validation'} concepts.`,
            'Day 3-5: Configure basic test suites.',
            'Day 6-7: Refactor complexity metrics.'
          ]
        }
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: {
          technologies: [
            { name: 'TypeScript Strict Mode', reason: 'To build bulletproof, type-safe API boundaries.' }
          ],
          weeklyPlan: [
            'Day 1-2: Add tsconfig strict flags.'
          ]
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
