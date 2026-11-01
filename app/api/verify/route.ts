import { NextRequest, NextResponse } from 'next/server';
import { VerificationIntegrityEngine } from '@/services/verification/integrity';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db } from '@/lib/drizzle';
import { users, privacySettings } from '@/database/schema';
import { eq, sql } from 'drizzle-orm';
import { Logger } from '@/lib/logger';
import { withDbTimeout } from '@/lib/drizzle';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    let targetUserId: string;

    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      let userRecord: any = null;
      try {
        userRecord = await withDbTimeout(
          db.query.users.findFirst({
            where: eq(sql`lower(${users.username})`, cleanUsername),
          }),
          3000
        );
      } catch {}

      if (!userRecord) {
        return NextResponse.json({
          success: false,
          error: 'Developer not found.',
        }, { status: 404 });
      }

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
    } else {
      const auth = await AuthorizationGuard.requireAuth(req);
      if (!auth.authorized) {
        return auth.response!;
      }
      targetUserId = auth.context.user.id;
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
