import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CareerEngine } from '@/services/career/engine';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const data = await CareerEngine.getCareerOverview(userId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/career:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
