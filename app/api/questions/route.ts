import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { questions, notifications } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tags } = await req.json();

    try {
      const [newQuestion] = await db
        .insert(questions)
        .values({
          userId: user.id,
          title,
          content,
          tags: tags || [],
        })
        .returning();

      // Trigger user alert
      try {
        await db.insert(notifications).values({
          userId: user.id,
          title: 'Question Shared',
          content: `Your programming question "${title}" has been published to the Q&A boards.`,
          type: 'question',
        });
      } catch {}

      return NextResponse.json({
        success: true,
        data: newQuestion,
      });
    } catch (dbErr: any) {
      console.error('[API Questions] Database insert error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to submit question' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
