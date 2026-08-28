import { NextRequest, NextResponse } from 'next/server';
import { VerificationIntegrityEngine } from '@/services/verification/integrity';
import { getSessionUser } from '@/services/supabase';
import { db } from '@/lib/drizzle';
import { users, privacySettings } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    let targetUserId = '00000000-0000-0000-0000-000000000001';

    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      let userRecord: any = null;
      try {
        const allUsers = await db.query.users.findMany();
        userRecord = allUsers.find(u => u.username.toLowerCase() === cleanUsername);
      } catch {}

      if (userRecord) {
        // Privacy check
        try {
          const privacy = await db.query.privacySettings.findFirst({
            where: eq(privacySettings.userId, userRecord.id),
          });
          if (privacy && privacy.profileVisibility === 'private') {
            return NextResponse.json({
              success: false,
              error: 'Developer verification profile is private.',
            }, { status: 404 });
          }
        } catch {}
        targetUserId = userRecord.id;
      }
    } else {
      const sessionUser = await getSessionUser();
      if (sessionUser) targetUserId = sessionUser.id;
    }

    const summary = await VerificationIntegrityEngine.getVerificationIntegritySummary(targetUserId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/verify:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching verification integrity metrics.',
    }, { status: 500 });
  }
}
