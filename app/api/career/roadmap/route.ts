import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CareerEngine } from '@/services/career/engine';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const goal = await CareerEngine.getCareerGoal(userId);
    const roadmap = await CareerEngine.getOrGenerateRoadmap(userId, goal);

    return NextResponse.json({
      success: true,
      data: roadmap,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/career/roadmap:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const goal = await CareerEngine.getCareerGoal(userId);
    const roadmap = await CareerEngine.getOrGenerateRoadmap(userId, goal);

    return NextResponse.json({
      success: true,
      data: roadmap,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/career/roadmap:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
