import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { getSessionUser } from '@/services/supabase';
import { passports, passportViews, profileBookmarks, profileShares } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const passport = await db.query.passports.findFirst({
      where: eq(passports.userId, user.id),
    });

    if (!passport) {
      return NextResponse.json({
        success: true,
        data: {
          totalViews: 0,
          totalBookmarks: 0,
          totalShares: 0,
          viewsBreakdown: { recruiter: 0, anonymous: 0 }
        }
      });
    }

    const bookmarksCount = await db
      .select()
      .from(profileBookmarks)
      .where(eq(profileBookmarks.userId, user.id));

    const sharesCount = await db
      .select()
      .from(profileShares)
      .where(eq(profileShares.userId, user.id));

    const views = await db
      .select()
      .from(passportViews)
      .where(eq(passportViews.passportId, passport.id));

    const recruiterCount = views.filter(v => v.viewerRole === 'recruiter').length;

    return NextResponse.json({
      success: true,
      data: {
        totalViews: passport.viewCount,
        totalBookmarks: bookmarksCount.length,
        totalShares: sharesCount.length,
        viewsBreakdown: {
          recruiter: recruiterCount,
          anonymous: Math.max(0, passport.viewCount - recruiterCount),
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Database error occurred' }, { status: 500 });
  }
}
