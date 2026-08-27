import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { SandboxedExecutionService } from '@/services/containers/service';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, language, code } = body;

    if (!workspaceId || !language || !code) {
      return NextResponse.json({ success: false, error: 'workspaceId, language, and code are required' }, { status: 400 });
    }

    const result = await SandboxedExecutionService.runScript(workspaceId, language, code);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/execution/run:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
