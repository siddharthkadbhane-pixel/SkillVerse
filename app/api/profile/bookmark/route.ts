import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { profileBookmarks } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Developer profile bookmarked (Mock Mode)',
      });
    }

    const { username } = await req.json();

    try {
      await db.insert(profileBookmarks).values({
        userId: user.id,
        username,
      });

      return NextResponse.json({
        success: true,
        message: `Profile @${username} bookmarked successfully.`,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
