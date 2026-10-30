import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { postComments } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, content } = await req.json();

    try {
      const [newComment] = await db
        .insert(postComments)
        .values({
          postId,
          userId: user.id,
          content,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newComment,
      });
    } catch (dbErr: any) {
      console.error('[API Comments] Database insert error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to add comment' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
