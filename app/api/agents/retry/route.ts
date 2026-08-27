import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/services/supabase';
import { AgentOrchestratorService } from '@/services/orchestrator/service';
import { Logger } from '@/lib/logger';

const RetryRequestSchema = z.object({
  runId: z.string().uuid(),
  agentId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RetryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const { runId, agentId } = parsed.data;

    const result = await AgentOrchestratorService.retryAgent(runId, agentId, user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully executed retry for agent: ${agentId}`,
      data: result,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/agents/retry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
