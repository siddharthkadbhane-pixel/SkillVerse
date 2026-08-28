import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CareerEngine } from '@/services/career/engine';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';
import { CareerRoleId } from '@/types/career';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const { searchParams } = new URL(req.url);
    let roleId = searchParams.get('roleId') as CareerRoleId | null;

    if (!roleId) {
      const goal = await CareerEngine.getCareerGoal(userId);
      roleId = goal.targetRoleId;
    }

    const recommendations = await CareerEngine.getCareerRecommendations(userId, roleId);

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/career/recommendations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
