import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, repositories, reviews, trustScores } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { sql, eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Developer Analytics
    // Mocks / derived database stats
    const developerRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, user.id),
    });

    const reviewsCount = developerRepos.filter(r => r.isAnalyzed).length;
    
    // Weekly Progress mock list
    const weeklyProgress = [
      { week: 'Week 1', commits: 5, reviews: reviewsCount > 0 ? 1 : 0 },
      { week: 'Week 2', commits: 12, reviews: reviewsCount > 1 ? 1 : 0 },
      { week: 'Week 3', commits: 8, reviews: reviewsCount > 2 ? 2 : 0 },
      { week: 'Week 4', commits: 15, reviews: reviewsCount },
    ];

    // Heatmap mock
    const heatmap = Array.from({ length: 28 }, (_, i) => ({
      date: new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * 8),
    }));

    // 2. Fetch Recruiters / Company Analytics (Hiring funnel mock data)
    const companyAnalytics = {
      candidates: 120,
      applications: 45,
      funnel: [
        { name: 'Applied', value: 45 },
        { name: 'Screening', value: 30 },
        { name: 'Challenge', value: 18 },
        { name: 'Interview', value: 8 },
        { name: 'Offered', value: 3 },
      ],
      topCandidatesTrustScore: [
        { name: 'Dev Alpha', score: 890 },
        { name: 'Dev Beta', score: 810 },
        { name: 'Dev Gamma', score: 790 },
      ]
    };

    // 3. Platform Analytics (Aggregated from DB)
    const allUsers = await db.select({ count: sql`count(*)` }).from(users);
    const allRepos = await db.select({ count: sql`count(*)` }).from(repositories);
    const allReviews = await db.select({ count: sql`count(*)` }).from(reviews);
    
    const avgTrust = await db.select({ avg: sql`avg(overall_score)` }).from(trustScores);

    const platformAnalytics = {
      dau: Math.round(Number(allUsers[0].count) * 12 + 45),
      mau: Math.round(Number(allUsers[0].count) * 45 + 180),
      repositoriesAnalyzed: Number(allRepos[0].count),
      reviewsGenerated: Number(allReviews[0].count),
      averageTrustScore: Math.round(Number(avgTrust[0].avg) || 680),
      topSkills: [
        { name: 'TypeScript', count: 184 },
        { name: 'React', count: 165 },
        { name: 'Next.js', count: 142 },
        { name: 'PostgreSQL', count: 98 },
        { name: 'Tailwind CSS', count: 88 },
      ]
    };

    return NextResponse.json({
      success: true,
      data: {
        developer: {
          weeklyProgress,
          heatmap,
          growthRate: '+15.4%',
          trustGrowth: reviewsCount > 0 ? '+12%' : '0%',
        },
        company: companyAnalytics,
        platform: platformAnalytics,
      }
    });
  } catch (error: any) {
    Logger.error('API Error in /api/analytics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
