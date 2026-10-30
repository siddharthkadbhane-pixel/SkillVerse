import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { knowledgeBase } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const articles = await db.query.knowledgeBase.findMany({
        orderBy: (knowledgeBase, { desc }) => [desc(knowledgeBase.createdAt)],
      });

      return NextResponse.json({
        success: true,
        data: articles,
      });
    } catch (dbErr: any) {
      console.error('[API Knowledge] Database read error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to fetch knowledge articles' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
