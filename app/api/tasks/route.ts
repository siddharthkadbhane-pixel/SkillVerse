import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { workspaceTasks } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, title, status } = await req.json();

    try {
      const [newTask] = await db
        .insert(workspaceTasks)
        .values({
          projectId,
          title,
          status: status || 'todo',
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newTask,
      });
    } catch (dbErr: any) {
      console.error('[API Tasks] Database insert error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to create task' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
