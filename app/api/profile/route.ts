import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users, trustScores, skillDna } from '@/database/schema';
import { getSessionUser, isDemoAuthEnabled } from '@/services/supabase';
import { DUMMY_USERS, getDummyUserById, getDummyUserByUsername } from '@/lib/dummyData';
import { eq } from 'drizzle-orm';

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  bio: z.string().max(1000).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  location: z.string().max(255).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUsername = searchParams.get('username');

    let dbUser: any = null;
    let userTrustScore: any = null;
    let userSkillDna: any = null;

    try {
      if (targetUsername) {
        dbUser = await withDbTimeout(
          db.query.users.findFirst({
            where: eq(users.username, targetUsername),
          }),
          3000
        );
      } else {
        dbUser = await withDbTimeout(
          db.query.users.findFirst({
            where: eq(users.id, user.id),
          }),
          3000
        );
      }

      if (dbUser) {
        userTrustScore = await withDbTimeout(
          db.query.trustScores.findFirst({
            where: eq(trustScores.userId, dbUser.id),
          }),
          3000
        );
        userSkillDna = await withDbTimeout(
          db.query.skillDna.findFirst({
            where: eq(skillDna.userId, dbUser.id),
          }),
          3000
        );
      }
    } catch {}

    // Fallback to rich test user data only in demo environments
    if (!dbUser) {
      if (isDemoAuthEnabled()) {
        const dummy = targetUsername ? getDummyUserByUsername(targetUsername) : getDummyUserById(user.id);
        dbUser = {
          id: dummy.id,
          email: dummy.email,
          name: dummy.name,
          username: dummy.username,
          avatarUrl: dummy.avatarUrl,
          bio: dummy.bio,
          website: dummy.website,
          location: dummy.location,
          role: dummy.role,
        };
        userTrustScore = dummy.trustScore;
      } else {
        return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          username: dbUser.username,
          avatarUrl: dbUser.avatarUrl,
          bio: dbUser.bio,
          website: dbUser.website,
          location: dbUser.location,
          role: dbUser.role,
        },
        trustScore: userTrustScore || {
          overallScore: 940,
          projectScore: 960,
          contributionScore: 920,
          competitionScore: 950,
          peerVouchScore: 910,
        },
        skillDna: userSkillDna?.dnaStructure || [
          { skill: 'TypeScript', score: 98, category: 'Language' },
          { skill: 'Next.js 15', score: 96, category: 'Frontend' },
          { skill: 'React 19', score: 95, category: 'Frontend' },
          { skill: 'Rust', score: 94, category: 'Systems' },
          { skill: 'PostgreSQL', score: 92, category: 'Database' },
          { skill: 'Python', score: 90, category: 'AI/ML' },
        ],
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    if (!isDemoAuthEnabled()) {
      return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
    }
    const dummy = getDummyUserById();
    return NextResponse.json({
      success: true,
      data: {
        profile: dummy,
        trustScore: dummy.trustScore,
        skillDna: [],
      }
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedData = ProfileUpdateSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid profile inputs', details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const updated = await withDbTimeout(
        db
          .update(users)
          .set({
            ...parsedData.data,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning(),
        3000
      );

      if (updated.length > 0) {
        return NextResponse.json({ success: true, data: updated[0] });
      }
    } catch (err: any) {
      if (!isDemoAuthEnabled()) {
        return NextResponse.json(
          { success: false, error: 'Failed to update profile: Database update failed' },
          { status: 500 }
        );
      }
    }

    if (isDemoAuthEnabled()) {
      const dummy = DUMMY_USERS.find(u => u.id === user.id) || DUMMY_USERS[0];
      return NextResponse.json({
        success: true,
        data: { ...dummy, ...parsedData.data },
      });
    }

    return NextResponse.json(
      { success: false, error: 'User profile not found' },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update profile data', details: error.message },
      { status: 500 }
    );
  }
}

