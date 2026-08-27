import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { WorkspaceBuildService } from '@/services/build/service';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, commitHash } = body;

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: 'workspaceId is required' }, { status: 400 });
    }

    const result = await WorkspaceBuildService.triggerBuild(workspaceId, commitHash || 'main-head');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/build:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
