import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CapabilityGrowthService } from '@/services/dcc/growth';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Default dummy ID if unauthenticated dev session
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    const summary = await CapabilityGrowthService.getDashboardGrowthSummary(userId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dashboard/growth:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
