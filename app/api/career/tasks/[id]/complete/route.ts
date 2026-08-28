import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CareerEngine } from '@/services/career/engine';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const body = await req.json().catch(() => ({ completed: true }));
    const completed = body.completed !== undefined ? Boolean(body.completed) : true;

    const updatedTask = await CareerEngine.completeLearningTask(userId, id, completed);

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/career/tasks/[id]/complete:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return POST(req, { params });
}
