import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { agentOutputs, agentLogs, agentMetrics, aiAgents } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');
    if (!runId) {
      return NextResponse.json({ success: false, error: 'Missing runId param' }, { status: 400 });
    }

    // Fetch outputs
    const outputs = await db
      .select({
        agentId: agentOutputs.agentId,
        output: agentOutputs.output,
        status: agentOutputs.status,
        errorMessage: agentOutputs.errorMessage,
        createdAt: agentOutputs.createdAt,
        agentName: aiAgents.name,
      })
      .from(agentOutputs)
      .leftJoin(aiAgents, eq(agentOutputs.agentId, aiAgents.id))
      .where(eq(agentOutputs.runId, runId));

    // Fetch metrics
    const metrics = await db
      .select()
      .from(agentMetrics)
      .where(eq(agentMetrics.runId, runId));

    // Fetch logs
    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.runId, runId));

    return NextResponse.json({
      success: true,
      data: {
        outputs,
        metrics,
        logs,
      }
    });
  } catch (error: any) {
    Logger.error('API Error in /api/agents/output:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
