import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { db } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DUMMY_USERS, getDummyUserById, getDummyUserByUsername } from '@/lib/dummyData';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, apiKey, username, userId } = body;

    // 1. Direct API Key or Demo User authentication
    let targetUser: any = null;

    if (apiKey || token) {
      const authKey = (apiKey || token).trim();
      // Look up user by token or fallback to matching dummy/db user
      if (authKey.startsWith('sk_demo_') || authKey === 'demo-token') {
        targetUser = DUMMY_USERS[0];
      } else {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, authKey),
        });
        targetUser = dbUser || DUMMY_USERS[0];
      }
    } else if (username) {
      targetUser = getDummyUserByUsername(username) || DUMMY_USERS[0];
    } else if (userId) {
      targetUser = getDummyUserById(userId) || DUMMY_USERS[0];
    } else {
      targetUser = await getSessionUser();
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or unauthenticated session.' },
        { status: 401 }
      );
    }

    // Fetch live DCC score & level
    const dcc = await DeveloperCapabilityCardService.getFullDCC(targetUser.id);
    const sessionToken = `sk_live_${targetUser.id}_${Date.now()}`;

    Logger.info(`IDE authenticated developer: ${targetUser.username} (${dcc.card.level})`);

    return NextResponse.json({
      success: true,
      data: {
        token: sessionToken,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          username: targetUser.username,
          avatarUrl: targetUser.avatarUrl,
          role: targetUser.role || 'developer',
        },
        dcc: {
          overallScore: dcc.card.overallScore,
          level: dcc.card.level,
          confidenceScore: dcc.card.confidenceScore,
          verificationStatus: dcc.card.verificationStatus,
          verifiedSkillsCount: dcc.dimensions.skills.verifiedSkillsList.length,
        },
      },
    });
  } catch (error: any) {
    Logger.error('IDE Auth endpoint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const user = await getSessionUser();
    const dcc = await DeveloperCapabilityCardService.getFullDCC(user.id);

    return NextResponse.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
        dcc: {
          overallScore: dcc.card.overallScore,
          level: dcc.card.level,
          confidenceScore: dcc.card.confidenceScore,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
