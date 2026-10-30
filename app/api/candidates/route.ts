import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, trustScores, skillDna } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Fetch all developers
    const allUsers = await db.query.users.findMany({
      where: eq(users.role, 'developer'),
    });

    const candidates = [];

    for (const u of allUsers) {
      const trust = await db.query.trustScores.findFirst({
        where: eq(trustScores.userId, u.id),
      });

      const dna = await db.query.skillDna.findFirst({
        where: eq(skillDna.userId, u.id),
      });

      candidates.push({
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        location: u.location,
        trustScore: trust?.overallScore || 150,
        skills: dna ? (dna.dnaStructure as any).skills.slice(0, 5) : [],
      });
    }

    return NextResponse.json({
      success: true,
      data: candidates,
    });
  } catch (error: any) {
    Logger.error('Database error in GET /api/candidates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch candidates',
      },
      { status: 500 }
    );
  }
}
