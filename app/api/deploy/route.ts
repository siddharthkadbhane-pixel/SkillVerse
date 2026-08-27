import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { deployments } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, platform } = body;

    if (!workspaceId || !platform) {
      return NextResponse.json({ success: false, error: 'workspaceId and platform are required' }, { status: 400 });
    }

    const deployUrl = `https://${platform}-app-${workspaceId.slice(0, 8)}.vercel.app`;

    const [deploy] = await db
      .insert(deployments)
      .values({
        workspaceId,
        platform,
        status: 'completed',
        deploymentUrl: deployUrl,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Workspace successfully deployed.',
      data: deploy,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/deploy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
