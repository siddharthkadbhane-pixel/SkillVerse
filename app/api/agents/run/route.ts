import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/services/supabase';
import { AgentOrchestratorService } from '@/services/orchestrator/service';
import { Logger } from '@/lib/logger';

const RunRequestSchema = z.object({
  repositoryId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RunRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid repositoryId' }, { status: 400 });
    }

    const { repositoryId } = parsed.data;

    // Trigger Orchestrator Pipeline asynchronously
    // Using process.nextTick / setTimeout to return immediate response to prevent HTTP timeouts
    setTimeout(async () => {
      try {
        await AgentOrchestratorService.runPipeline(repositoryId, user.id);
      } catch (err) {
        Logger.error(`Asynchronous Agent Orchestrator pipeline failed for repo ${repositoryId}`, err);
      }
    }, 50);

    return NextResponse.json({
      success: true,
      message: 'Agent Orchestration pipeline successfully triggered.',
    });
  } catch (error: any) {
    Logger.error('API Error in /api/agents/run:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
