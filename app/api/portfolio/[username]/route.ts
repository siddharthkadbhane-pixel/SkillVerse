import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, trustScores, skillDna, repositories, reviews } from '@/database/schema';
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

    // 1. Fetch user by username
    const dbUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    // 2. Fetch trust scores
    const userTrustScore = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, dbUser.id),
    });

    // 3. Fetch skill DNA
    const userSkillDna = await db.query.skillDna.findFirst({
      where: eq(skillDna.userId, dbUser.id),
    });

    // 4. Fetch analyzed repositories with reviews
    const analyzedRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, dbUser.id),
      orderBy: (repos, { desc }) => [desc(repos.analyzedAt)],
    } as any);

    // Populate reviews for each repository
    const reposWithReviews = [];
    for (const repo of analyzedRepos) {
      const reviewRecord = await db.query.reviews.findFirst({
        where: eq(reviews.repositoryId, repo.id),
      });

      reposWithReviews.push({
        ...repo,
        review: reviewRecord || null,
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
          overallScore: 0,
          projectScore: 0,
          contributionScore: 0,
          competitionScore: 0,
          peerVouchScore: 0,
        },
        skillDna: userSkillDna?.dnaStructure || [],
        repositories: reposWithReviews,
      },
    });
  } catch (error: any) {
    console.error('Portfolio retrieval error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to retrieve portfolio data',
    }, { status: 500 });
  }
}
