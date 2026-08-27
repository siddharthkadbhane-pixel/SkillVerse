import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { DCCInsightsService } from '@/services/dcc/insights';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await DeveloperCapabilityCardService.recalculateDCC(user.id);
    await DCCInsightsService.generateInsights(user.id);

    return NextResponse.json({
      success: true,
      message: 'Developer Capability Card successfully regenerated.',
      data: payload,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/dcc/regenerate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
