import { NextRequest, NextResponse } from 'next/server';
import { TeamEngine } from '@/services/team/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { TaskStatus } from '@/types/team';
import { Logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id } = await params;
    const userId = auth.context.user.id;
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
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id } = await params;
    const body = await req.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Both taskId and status are required.',
      }, { status: 400 });
    }

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
