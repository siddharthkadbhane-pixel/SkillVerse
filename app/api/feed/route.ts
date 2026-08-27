import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { posts, users, postComments } from '@/database/schema';
import { DUMMY_POSTS } from '@/lib/dummyData';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    let list: any[] = [];
    try {
      const feedPosts = await db.query.posts.findMany({
        orderBy: [desc(posts.createdAt)],
      });

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
          likesCount: 12,
        });
      }
    } catch {}

    if (list.length === 0) {
      return NextResponse.json({
        success: true,
        data: DUMMY_POSTS,
      });
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      data: DUMMY_POSTS,
    });
  }
}
