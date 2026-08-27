import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { DeveloperGraphService } from '@/services/graph/service';
import { RecommendationEngineService } from '@/services/recommendation/service';
import { ReputationService } from '@/services/reputation/service';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Sync graph node/edges
    await DeveloperGraphService.syncDeveloperGraph(user.id);
    
    // 2. Generate matches/opportunities
    await RecommendationEngineService.generateRecommendations(user.id);

    // 3. Compute reputation categories
    await ReputationService.calculateReputation(user.id);

    return NextResponse.json({
      success: true,
      message: 'Developer Intelligence Graph synchronization complete.',
    });
  } catch (error: any) {
    Logger.error('API Error in /api/graph/sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
