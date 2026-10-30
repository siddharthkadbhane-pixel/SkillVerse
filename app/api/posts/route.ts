import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { posts, notifications } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, category, githubLink, codeSnippet } = await req.json();

    try {
      const [newPost] = await db
        .insert(posts)
        .values({
          userId: user.id,
          title,
          content,
          category: category || 'General',
          githubLink,
          codeSnippet,
        })
        .returning();

      // Trigger user notification
      try {
        await db.insert(notifications).values({
          userId: user.id,
          title: 'Post Published',
          content: `Your post "${title}" was shared in the community feed.`,
          type: 'post',
        });
      } catch {}

      return NextResponse.json({
        success: true,
        data: newPost,
      });
    } catch (dbErr: any) {
      console.error('[API Posts] Database insert error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to create post' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
