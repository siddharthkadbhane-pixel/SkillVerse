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

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/career/goals:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const body = await req.json();
    const updatedGoal = await CareerEngine.setCareerGoal(userId, body);

    // Also trigger roadmap refresh for the new goal
    const newRoadmap = await CareerEngine.getOrGenerateRoadmap(userId, updatedGoal);

    return NextResponse.json({
      success: true,
      data: {
        goal: updatedGoal,
        roadmap: newRoadmap,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/career/goals:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
