import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { SkillDnaCalculatorService } from '@/services/skill-dna';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock evidence if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [
          {
            skillName: 'TypeScript',
            repoName: 'nextjs-ai-agent',
            fullName: 'siddharthkadbhane-pixel/nextjs-ai-agent',
            htmlUrl: 'https://github.com/siddharthkadbhane-pixel/nextjs-ai-agent',
            evidenceSource: 'ai_review',
            qualityScore: 84,
            lastVerified: new Date().toISOString(),
          },
          {
            skillName: 'React',
            repoName: 'nextjs-ai-agent',
            fullName: 'siddharthkadbhane-pixel/nextjs-ai-agent',
            htmlUrl: 'https://github.com/siddharthkadbhane-pixel/nextjs-ai-agent',
            evidenceSource: 'ai_review',
            qualityScore: 84,
            lastVerified: new Date().toISOString(),
          }
        ]
      });
    }

    try {
      const evidence = await SkillDnaCalculatorService.collectSkillsEvidence(user.id);
      return NextResponse.json({
        success: true,
        data: evidence,
      });
    } catch (dbErr: any) {
      console.error('[API Skills Evidence] Database read error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to fetch skills evidence' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
