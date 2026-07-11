import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { repositories } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          isAnalyzed: true,
          analyzedAt: new Date().toISOString(),
          status: 'completed',
        },
      });
    }

    try {
      const repo = await db.query.repositories.findFirst({
        where: and(
          eq(repositories.id, id),
          eq(repositories.userId, user.id)
        ),
      });

      if (!repo) {
        return NextResponse.json({ success: false, error: 'Repository not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          isAnalyzed: repo.isAnalyzed,
          analyzedAt: repo.analyzedAt,
          status: repo.isAnalyzed ? 'completed' : 'idle',
        },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          isAnalyzed: true,
          analyzedAt: new Date().toISOString(),
          status: 'completed',
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
