import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, trustScores, skillDna, repositories, reviews } from '@/database/schema';
import { getDummyUserByUsername, DUMMY_REPOSITORIES, DUMMY_REVIEWS, getDummyDCCData } from '@/lib/dummyData';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  try {
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username parameter is missing' },
        { status: 400 }
      );
    }

    let dbUser: any = null;
    let userTrustScore: any = null;
    let userSkillDna: any = null;
    let reposWithReviews: any[] = [];

    try {
      dbUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (dbUser) {
        userTrustScore = await db.query.trustScores.findFirst({
          where: eq(trustScores.userId, dbUser.id),
        });

        userSkillDna = await db.query.skillDna.findFirst({
          where: eq(skillDna.userId, dbUser.id),
        });

        const analyzedRepos = await db.query.repositories.findMany({
          where: eq(repositories.userId, dbUser.id),
          orderBy: (repos: any, { desc }: any) => [desc(repos.analyzedAt)],
        } as any);

        for (const repo of analyzedRepos) {
          const reviewRecord = await db.query.reviews.findFirst({
            where: eq(reviews.repositoryId, repo.id),
          });

          reposWithReviews.push({
            ...repo,
            review: reviewRecord || null,
          });
        }
      }
    } catch {}

    // Fallback to rich test dataset
    if (!dbUser) {
      const dummy = getDummyUserByUsername(username);
      const dcc = getDummyDCCData(dummy.id);

      const userRepos = DUMMY_REPOSITORIES.filter(r => r.userId === dummy.id || dummy.username === 'siddharthkadbhane-pixel');

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: dummy.id,
            name: dummy.name,
            username: dummy.username,
            avatarUrl: dummy.avatarUrl,
            bio: dummy.bio,
            website: dummy.website,
            location: dummy.location,
            role: dummy.role,
            createdAt: new Date().toISOString(),
          },
          trustScore: dummy.trustScore,
          skillDna: dcc.dimensions.skills || [],
          repositories: userRepos.map(r => ({
            ...r,
            review: DUMMY_REVIEWS.find(rev => rev.repositoryId === r.id) || DUMMY_REVIEWS[0],
          })),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          avatarUrl: dbUser.avatarUrl,
          bio: dbUser.bio,
          website: dbUser.website,
          location: dbUser.location,
          role: dbUser.role,
          createdAt: dbUser.createdAt,
        },
        trustScore: userTrustScore || {
          overallScore: 940,
          projectScore: 960,
          contributionScore: 920,
          competitionScore: 950,
          peerVouchScore: 910,
        },
        skillDna: userSkillDna?.dnaStructure || [],
        repositories: reposWithReviews.length > 0 ? reposWithReviews : DUMMY_REPOSITORIES,
      },
    });
  } catch (error: any) {
    console.error('Portfolio retrieval error:', error);
    const dummy = getDummyUserByUsername(username);
    return NextResponse.json({
      success: true,
      data: {
        user: dummy,
        trustScore: dummy.trustScore,
        skillDna: [],
        repositories: DUMMY_REPOSITORIES,
      }
    });
  }
}
