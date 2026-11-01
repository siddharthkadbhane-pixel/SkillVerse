import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionUser, isDemoAuthEnabled } from '@/services/supabase';
import { PersonalAccessTokenService } from '@/services/api/tokens';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { db } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DUMMY_USERS, getDummyUserById, getDummyUserByUsername } from '@/lib/dummyData';
import { Logger } from '@/lib/logger';
import { DistributedRateLimiter } from '@/services/security/distributedRateLimiter';

export async function POST(req: NextRequest) {
  // Rate limit protection against credential brute-forcing
  const clientIp = DistributedRateLimiter.getClientIp(req);
  const rateLimit = await DistributedRateLimiter.check(clientIp, 'auth_sensitive');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too Many Requests', message: 'Too many authentication attempts. Please retry later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { token, apiKey, username, userId } = body;

    let targetUser: any = null;

    if (apiKey || token) {
      const authKey = (apiKey || token).trim();

      // Check for valid Personal Access Token
      const validation = await PersonalAccessTokenService.validateToken(authKey);
      if (validation.isValid && validation.tokenData) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, validation.tokenData.userId),
        });
        targetUser = dbUser || (isDemoAuthEnabled() ? getDummyUserById(validation.tokenData.userId) : null);
      } else if (isDemoAuthEnabled() && (authKey.startsWith('sk_demo_') || authKey === 'demo-token')) {
        // Only allow demo token in non-production/demo-enabled environments
        targetUser = DUMMY_USERS[0];
      }
    } else if (username || userId) {
      // Demo impersonation parameters - strictly forbidden in production
      if (!isDemoAuthEnabled()) {
        return NextResponse.json(
          { success: false, error: 'Demo user impersonation is disabled in production.' },
          { status: 403 }
        );
      }
      if (username) {
        targetUser = getDummyUserByUsername(username);
      } else if (userId) {
        targetUser = getDummyUserById(userId);
      }
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
    const sessionToken = `sk_live_${targetUser.id}_${crypto.randomBytes(16).toString('hex')}`;

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

    let user: any = null;

    if (token) {
      const validation = await PersonalAccessTokenService.validateToken(token);
      if (validation.isValid && validation.tokenData) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, validation.tokenData.userId),
        });
        user = dbUser || (isDemoAuthEnabled() ? getDummyUserById(validation.tokenData.userId) : null);
      }
    }

    if (!user) {
      user = await getSessionUser();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please provide a valid Bearer token or session cookie.' },
        { status: 401 }
      );
    }

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

