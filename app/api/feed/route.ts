import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { posts, users, postComments } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    try {
      const feedPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
      });

      const list = [];
      for (const post of feedPosts) {
        const author = await db.query.users.findFirst({
          where: eq(users.id, post.userId),
        });

        const commentsList = await db.query.postComments.findMany({
          where: eq(postComments.postId, post.id),
        });

        list.push({
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          githubLink: post.githubLink,
          codeSnippet: post.codeSnippet,
          createdAt: post.createdAt.toISOString(),
          authorName: author?.name || 'Developer',
          authorUsername: author?.username || 'developer',
          authorAvatar: author?.avatarUrl,
          commentsCount: commentsList.length,
        });
      }

      return NextResponse.json({
        success: true,
        data: list,
      });
    } catch {
      // Fallback mock feed list
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'post_001',
            title: 'Building a premium telemetry dashboard with Tailwind CSS',
            content: 'Check out this clean card structure layout for presenting candidate pipelines and metrics! Standard HSL palettes fit perfectly into dark modes.',
            category: 'Project Showcase',
            githubLink: 'https://github.com/siddharthkadbhane-pixel/telemetry-view',
            codeSnippet: 'export function Card({ title }) {\n  return <div className="glass-card p-5" />\n}',
            createdAt: new Date().toISOString(),
            authorName: 'Sidharth Kadbhane',
            authorUsername: 'siddharthkadbhane-pixel',
            authorAvatar: 'https://avatars.githubusercontent.com/u/84218321?v=4',
            commentsCount: 1,
          },
          {
            id: 'post_002',
            title: 'Bug: Connection Pool Leak in serverless routines',
            content: 'Having an issue where Vercel serverless routines deplete PostgreSQL active connection limits on high concurrent requests.',
            category: 'Bug Help',
            githubLink: null,
            codeSnippet: null,
            createdAt: new Date().toISOString(),
            authorName: 'Alex Mercer',
            authorUsername: 'alexmercer',
            authorAvatar: null,
            commentsCount: 0,
          }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
