import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { passportExports, trustScores, userSkills, users } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    // 1. Log passport export transaction (Module 1)
    await db.insert(passportExports).values({
      userId: user.id,
      format,
    });

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    const trust = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, user.id),
    });

    const skills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, user.id),
    });

    const exportPayload = {
      title: 'SkillVerse Certified Developer Passport',
      issuedBy: 'SkillVerse Network Inc.',
      verifiedBadge: 'Verified Developer DNA Standard (v1.0)',
      timestamp: new Date().toISOString(),
      developer: {
        username: dbUser?.username,
        name: dbUser?.name,
      },
      trustScore: trust?.overallScore || 0,
      skills: (skills as any[]).map((s: any) => ({ skillId: s.skillId, level: s.proficiencyLevel || 85 })),
    };

    if (format === 'pdf') {
      // Simulate binary PDF payload response
      return new NextResponse(JSON.stringify(exportPayload, null, 2), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=passport-${dbUser?.username || 'developer'}.pdf`,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: exportPayload,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/passport:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
