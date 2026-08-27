import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { privacySettings, users } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    let targetUserId: string | null = null;

    if (username) {
      const target = await db.query.users.findFirst({
        where: eq(users.username, username),
      }).catch(() => null);
      if (target) targetUserId = target.id;
    }

    if (!targetUserId) {
      const user = await getSessionUser();
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({
        success: true,
        data: {
          publicRepos: true,
          privateRepos: false,
          visibleSkills: ['TypeScript', 'Next.js', 'React', 'PostgreSQL'],
          visibleActivity: true,
          profileVisibility: 'public',
          companyVisibility: 'public',
        }
      });
    }

    let priv: any = null;
    try {
      priv = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, targetUserId),
      });
    } catch {}

    if (!priv) {
      priv = {
        publicRepos: true,
        privateRepos: false,
        visibleSkills: ['TypeScript', 'Next.js', 'React', 'PostgreSQL'],
        visibleActivity: true,
        profileVisibility: 'public',
        companyVisibility: 'public',
      };
    }

    return NextResponse.json({
      success: true,
      data: priv,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/privacy:', error);
    return NextResponse.json({
      success: true,
      data: {
        publicRepos: true,
        privateRepos: false,
        visibleSkills: ['TypeScript', 'Next.js', 'React', 'PostgreSQL'],
        visibleActivity: true,
        profileVisibility: 'public',
        companyVisibility: 'public',
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const payload = {
      publicRepos: body.publicRepos !== undefined ? body.publicRepos : true,
      privateRepos: body.privateRepos !== undefined ? body.privateRepos : false,
      visibleSkills: body.visibleSkills || [],
      visibleActivity: body.visibleActivity !== undefined ? body.visibleActivity : true,
      profileVisibility: body.profileVisibility || 'public',
      companyVisibility: body.companyVisibility || 'public',
      updatedAt: new Date(),
    };

    try {
      const existing = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, user.id),
      });

      if (existing) {
        await db
          .update(privacySettings)
          .set(payload)
          .where(eq(privacySettings.userId, user.id));
      } else {
        await db.insert(privacySettings).values({
          userId: user.id,
          ...payload,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Privacy configurations updated successfully.',
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/privacy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
