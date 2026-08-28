import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
import { getSessionUser } from '@/services/supabase';
import { TaskStatus } from '@/types/team';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    const userId = sessionUser?.id || '00000000-0000-0000-0000-000000000000';

    const body = await req.json();
    const result = await TeamEngine.createTask(id, userId, body);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in POST /api/teams/[id]/tasks:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating team task.',
    }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { taskId, status } = body;

    const result = await TeamEngine.updateTaskStatus(id, taskId, status as TaskStatus);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/teams/[id]/tasks:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while updating task status.',
    }, { status: 500 });
  }
}
