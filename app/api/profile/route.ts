import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle';
import { users, trustScores, skillDna } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
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

    // Fetch user details
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User profile not found in database' }, { status: 404 });
    }

    // Fetch trust score
    const userTrustScore = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, dbUser.id),
    });

    // Fetch skill DNA
    const userSkillDna = await db.query.skillDna.findFirst({
      where: eq(skillDna.userId, dbUser.id),
    });

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
          overallScore: 0,
          projectScore: 0,
          contributionScore: 0,
          competitionScore: 0,
          peerVouchScore: 0,
        },
        skillDna: userSkillDna?.dnaStructure || [],
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch profile' }, { status: 500 });
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

    const updated = await db
      .update(users)
      .set({
        ...parsedData.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update profile data', details: error.message },
      { status: 500 }
    );
  }
}
