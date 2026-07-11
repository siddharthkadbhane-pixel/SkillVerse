import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories, trustScores, skillDna, users, passports } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock profile dashboard if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          trustScore: { overallScore: 840, confidence: 85, level: 'Verified Professional' },
          skillDna: { overallLevel: 75, skillsCount: 5 },
          repositories: {
            total: 3,
            analyzed: 2,
            pending: 1,
            failed: 0,
          },
          profileCompletion: 80,
          passportStatus: 'public',
        }
      });
    }

    try {
      const trust = await db.query.trustScores.findFirst({
        where: eq(trustScores.userId, user.id),
      });

      const dna = await db.query.skillDna.findFirst({
        where: eq(skillDna.userId, user.id),
      });

      const passport = await db.query.passports.findFirst({
        where: eq(passports.userId, user.id),
      });

      const repos = await db.query.repositories.findMany({
        where: eq(repositories.userId, user.id),
      });

      const totalRepos = repos.length;
      const analyzedRepos = repos.filter(r => r.isAnalyzed).length;
      const pendingRepos = repos.filter(r => r.reviewStatus === 'running' || r.reviewStatus === 'pending').length;

      // Completion index
      let completion = 20;
      const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      if (dbUser?.bio) completion += 25;
      if (dbUser?.location) completion += 25;
      if (dbUser?.website) completion += 15;
      if (analyzedRepos > 0) completion += 15;

      return NextResponse.json({
        success: true,
        data: {
          trustScore: {
            overallScore: trust?.overallScore || 150,
            confidence: trust?.confidence || 10,
            level: (trust?.overallScore || 0) >= 700 ? 'Elite Contributor' : 'Verified Professional',
          },
          skillDna: {
            overallLevel: dna ? (dna.dnaStructure as any).overallLevel : 0,
            skillsCount: dna ? (dna.dnaStructure as any).skills.length : 0,
          },
          repositories: {
            total: totalRepos,
            analyzed: analyzedRepos,
            pending: pendingRepos,
            failed: Math.max(0, totalRepos - analyzedRepos - pendingRepos),
          },
          profileCompletion: completion,
          passportStatus: passport?.visibility || 'public',
        }
      });
    } catch {
      // Database connection fallback
      return NextResponse.json({
        success: true,
        data: {
          trustScore: { overallScore: 840, confidence: 85, level: 'Verified Professional' },
          skillDna: { overallLevel: 75, skillsCount: 5 },
          repositories: {
            total: 3,
            analyzed: 2,
            pending: 1,
            failed: 0,
          },
          profileCompletion: 80,
          passportStatus: 'public',
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
