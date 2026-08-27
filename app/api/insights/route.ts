import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories, reviews } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const repos = await db.query.repositories.findMany({
      where: eq(repositories.userId, user.id),
    });

    const analyzed = repos.filter(r => r.isAnalyzed);
    const languages = repos.map(r => r.language).filter(Boolean);

    // Compute top language
    const langCounts: Record<string, number> = {};
    languages.forEach(l => {
      langCounts[l!] = (langCounts[l!] || 0) + 1;
    });
    const strongestTech = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TypeScript';

    // Mock derived developer insights metrics
    const insights = {
      strongestTech,
      growthVelocity: analyzed.length > 0 ? '+18%' : '0%',
      consistencyScore: analyzed.length > 0 ? 'High' : 'Needs Scanning',
      collaborationHabits: 'Consistent commits & branch mergers',
      learningVelocity: 'Fast adoption of Next.js and Tailwind configurations',
      mostActiveRepo: repos.sort((a, b) => (b.stars || 0) - (a.stars || 0))[0]?.name || 'No repositories active',
    };

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/insights:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
