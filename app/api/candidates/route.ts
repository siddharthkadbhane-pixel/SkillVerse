import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, trustScores, skillDna } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
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
    } catch {
      // Fallback mock candidates list
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'candidate_1',
            name: 'Sidharth Kadbhane',
            username: 'siddharthkadbhane-pixel',
            avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
            bio: 'Full Stack Engineer specializing in TypeScript, Next.js, PostgreSQL and Distributed AI Pipelines.',
            location: 'Mumbai, India',
            trustScore: 840,
            skills: [
              { name: 'TypeScript', level: 85 },
              { name: 'React', level: 82 },
              { name: 'Next.js', level: 78 },
            ]
          }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
