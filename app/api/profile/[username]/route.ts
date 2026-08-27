import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, passports, passportViews, repositories, reviews, trustScores, skillDna } from '@/database/schema';
import { PassportBadgeService } from '@/services/passport/badge';
import { PassportTimelineService } from '@/services/passport/timeline';
import { getDummyUserByUsername } from '@/lib/dummyData';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const url = new URL(req.url);
    const viewerRole = url.searchParams.get('role') || 'anonymous';

    // 1. Resolve user from DB or Dummy Users
    let userRecord: any = await db.query.users.findFirst({
      where: eq(users.username, username),
    }).catch(() => null);

    if (!userRecord) {
      const dummy = getDummyUserByUsername(username);
      userRecord = {
        id: dummy.id,
        email: dummy.email,
        name: dummy.name,
        username: dummy.username,
        avatarUrl: dummy.avatarUrl,
        bio: dummy.bio,
        website: dummy.website,
        location: dummy.location,
        role: dummy.role,
        githubToken: null,
        githubId: dummy.githubId,
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const resolvedUser = userRecord!;

    // 2. Fetch passport config
    let passportRecord: any = null;
    try {
      passportRecord = await db.query.passports.findFirst({
        where: eq(passports.userId, resolvedUser.id),
      });

      if (!passportRecord) {
        const [newPassport] = await db
          .insert(passports)
          .values({
            userId: resolvedUser.id,
            visibility: 'public',
            theme: 'dark',
            viewCount: 1,
            generatedSummary: resolvedUser.bio,
          })
          .returning();
        passportRecord = newPassport;
      } else {
        await db
          .update(passports)
          .set({ viewCount: (passportRecord.viewCount || 0) + 1 })
          .where(eq(passports.id, passportRecord.id));

        await db.insert(passportViews).values({
          passportId: passportRecord.id,
          viewerRole: viewerRole === 'recruiter' ? 'recruiter' : 'anonymous',
        });
      }
    } catch {}

    let trustScore: any = null;
    let skillDnaRecord: any = null;
    let repos: any[] = [];

    try {
      trustScore = await db.query.trustScores.findFirst({
        where: eq(trustScores.userId, resolvedUser.id),
      });

      skillDnaRecord = await db.query.skillDna.findFirst({
        where: eq(skillDna.userId, resolvedUser.id),
      });

      repos = await db.query.repositories.findMany({
        where: and(
          eq(repositories.userId, resolvedUser.id),
          eq(repositories.isAnalyzed, true)
        ),
      });
    } catch {}

    const verifiedRepos = [];
    for (const repo of repos) {
      try {
        const reviewRecord = await db.query.reviews.findFirst({
          where: eq(reviews.repositoryId, repo.id),
        });

        verifiedRepos.push({
          id: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          htmlUrl: repo.htmlUrl,
          language: repo.language,
          stars: repo.stars,
          forks: repo.forks,
          analyzedAt: repo.analyzedAt ? repo.analyzedAt.toISOString() : null,
          review: reviewRecord ? {
            overallScore: reviewRecord.overallScore,
            summary: reviewRecord.summary,
            strengths: reviewRecord.strengths,
            weaknesses: reviewRecord.weaknesses,
            architecture: reviewRecord.architecture,
            codeQuality: reviewRecord.codeQuality,
            documentation: reviewRecord.documentation,
            bestPractices: reviewRecord.bestPractices,
          } : null,
        });
      } catch {}
    }

    const badges = await PassportBadgeService.calculateBadgesForUser(resolvedUser.id).catch(() => []);
    const timeline = await PassportTimelineService.compileTimelineForUser(resolvedUser.id).catch(() => []);

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          ...resolvedUser,
          createdAt: resolvedUser.createdAt?.toISOString ? resolvedUser.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: resolvedUser.updatedAt?.toISOString ? resolvedUser.updatedAt.toISOString() : new Date().toISOString(),
        },
        passport: passportRecord || { visibility: 'public', theme: 'dark', viewCount: 128 },
        trustScore: trustScore || {
          overallScore: 940,
          projectScore: 960,
          contributionScore: 920,
          competitionScore: 950,
          peerVouchScore: 910,
        },
        skillDna: skillDnaRecord?.dnaStructure || [],
        repositories: verifiedRepos,
        badges,
        timeline,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
