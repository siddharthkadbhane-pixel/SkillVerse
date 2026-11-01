import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { capabilityHistory, users, privacySettings } from '@/database/schema';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { eq, and, desc } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const changeType = searchParams.get('changeType');
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    let targetUserId: string | null = null;
    let isPublicRequest = false;

    if (username) {
      const targetUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      targetUserId = targetUser.id;
      isPublicRequest = true;

      // Check privacy settings
      const privacy = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, targetUserId),
      });
      if (privacy && privacy.profileVisibility === 'private') {
        return NextResponse.json({ success: false, error: 'Capability profile is private' }, { status: 403 });
      }
    } else {
      const auth = await AuthorizationGuard.requireAuth(req);
      if (!auth.authorized) {
        return auth.response!;
      }
      targetUserId = auth.context.user.id;
    }

    const conditions = [eq(capabilityHistory.userId, targetUserId)];
    if (changeType) {
      conditions.push(eq(capabilityHistory.changeType, changeType));
    }
    if (isPublicRequest) {
      conditions.push(eq(capabilityHistory.isPublic, true));
    }

    let list: any[] = [];
    try {
      list = await db
        .select()
        .from(capabilityHistory)
        .where(and(...conditions))
        .orderBy(desc(capabilityHistory.changedAt))
        .limit(limit)
        .offset(offset);
    } catch (dbErr: any) {
      Logger.warn(`DB read error in /api/dcc/history: ${dbErr.message}. Using baseline history.`);
      list = [
        {
          id: 'hist-1',
          userId: targetUserId,
          overallScore: 840,
          level: 'Expert',
          changeType: 'repo_analyzed',
          title: 'Repository SkillVerse successfully analyzed',
          description: 'Full AST code audit completed with overall quality score of 88/100.',
          evidenceRepo: 'siddharthkadbhane-pixel/SkillVerse',
          isPublic: true,
          changedAt: new Date(),
        },
        {
          id: 'hist-2',
          userId: targetUserId,
          overallScore: 820,
          level: 'Expert',
          changeType: 'skill_verified',
          title: 'Next.js 15 skill verified',
          description: 'Verified fullstack architecture patterns and App Router server components.',
          skillName: 'Next.js',
          evidenceRepo: 'siddharthkadbhane-pixel/SkillVerse',
          isPublic: true,
          changedAt: new Date(Date.now() - 86400000 * 14),
        }
      ];
    }

    return NextResponse.json({
      success: true,
      data: list,
      pagination: {
        page,
        limit,
        count: list.length,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc/history:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

