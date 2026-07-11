import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { profileShares } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Share click logged (Mock Mode)',
      });
    }

    const { platform } = await req.json();

    try {
      await db.insert(profileShares).values({
        userId: user.id,
        platform,
      });

      return NextResponse.json({
        success: true,
        message: 'Profile share event logged.',
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
