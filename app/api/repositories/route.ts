import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories, users } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Lookup user in DB to fetch GitHub token
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    // In a real environment, we fetch gitToken from dbUser.githubToken.
    // Fallback to local GITHUB_ACCESS_TOKEN for testing/scans.
    const gitToken = dbUser?.githubToken || process.env.GITHUB_ACCESS_TOKEN || '';
    if (!gitToken) {
      return NextResponse.json({
        success: false,
        error: 'GitHub access token not configured. Please link your GitHub account in settings.',
      }, { status: 400 });
    }

    // Query GitHub API to list user's repositories
    const response = await fetch('https://api.github.com/user/repos?per_page=50&sort=updated', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${gitToken}`,
        'User-Agent': 'SkillVerse-AI-Agent',
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `GitHub API error: ${response.statusText}`,
      }, { status: response.status });
    }

    const gitRepos = await response.json();
    if (!Array.isArray(gitRepos)) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch already analyzed repositories from DB
    const analyzedRepos = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, user.id));

    const analyzedMap = new Map(analyzedRepos.map(r => [r.githubRepoId, r]));

    // Map GitHub repos with their SkillVerse analysis status
    const formattedRepos = gitRepos.map((repo: any) => {
      const dbRepo = analyzedMap.get(repo.id);
      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        isAnalyzed: !!dbRepo?.isAnalyzed,
        analyzedAt: dbRepo?.analyzedAt || null,
        reviewId: dbRepo?.id || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRepos,
    });
  } catch (error: any) {
    console.error('API Error in repositories fetch:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch repositories',
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const githubRepoIdStr = searchParams.get('githubRepoId');
    if (!githubRepoIdStr) {
      return NextResponse.json({ success: false, error: 'githubRepoId is required' }, { status: 400 });
    }

    const githubRepoId = parseInt(githubRepoIdStr, 10);
    if (isNaN(githubRepoId)) {
      return NextResponse.json({ success: false, error: 'Invalid githubRepoId' }, { status: 400 });
    }

    // Delete the repository record (which will cascade delete the review in PostgreSQL)
    const deleted = await db
      .delete(repositories)
      .where(
        and(
          eq(repositories.githubRepoId, githubRepoId),
          eq(repositories.userId, user.id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, error: 'Repository not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Repository analysis deleted successfully',
    });
  } catch (error: any) {
    console.error('API Error in repository delete:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
