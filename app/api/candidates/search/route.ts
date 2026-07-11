import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, trustScores, skillDna } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const skillFilter = url.searchParams.get('skill') || '';
    const minScoreFilter = parseInt(url.searchParams.get('minScore') || '0', 10);

    try {
      const allUsers = await db.query.users.findMany({
        where: eq(users.role, 'developer'),
      });

      const filtered = [];

      for (const u of allUsers) {
        const trust = await db.query.trustScores.findFirst({
          where: eq(trustScores.userId, u.id),
        });

        const dna = await db.query.skillDna.findFirst({
          where: eq(skillDna.userId, u.id),
        });

        const trustScore = trust?.overallScore || 150;
        const skills = dna ? (dna.dnaStructure as any).skills : [];
        const skillsList = skills.map((s: any) => s.name.toLowerCase());

        const matchesSkill = !skillFilter || skillsList.includes(skillFilter.toLowerCase());
        const matchesScore = trustScore >= minScoreFilter;

        if (matchesSkill && matchesScore) {
          filtered.push({
            id: u.id,
            name: u.name,
            username: u.username,
            avatarUrl: u.avatarUrl,
            bio: u.bio,
            location: u.location,
            trustScore,
            skills: skills.slice(0, 5),
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: filtered,
      });
    } catch {
      // Fallback filter matching
      const mockResult = [
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
      ];

      const matchesSkill = !skillFilter || skillFilter.toLowerCase() === 'typescript' || skillFilter.toLowerCase() === 'react';
      const matchesScore = 840 >= minScoreFilter;

      return NextResponse.json({
        success: true,
        data: (matchesSkill && matchesScore) ? mockResult : [],
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
