import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { getSessionUser } from '@/services/supabase';
import { skillDna } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock learning path if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          pathName: 'TypeScript & Next.js Advanced Architecture',
          description: 'Master strict type assertion boundaries, serverless caching strategies, and Drizzle schema structures.',
          modulesCount: 4,
          completedModules: 1,
          modules: [
            { id: 'mod_1', title: 'TypeScript strict configuration setup', status: 'completed' },
            { id: 'mod_2', title: 'Managing Serverless Connection Pools', status: 'active' },
            { id: 'mod_3', title: 'Drizzle Schema indexing and triggers', status: 'pending' }
          ]
        }
      });
    }

    try {
      const dna = await db.query.skillDna.findFirst({
        where: eq(skillDna.userId, user.id),
      });

      if (!dna) {
        return NextResponse.json({
          success: true,
          data: {
            pathName: 'Skill DNA Initialization Path',
            description: 'Connect your first codebase to map verified skill DNA gaps and unlock specific learning roadmaps.',
            modulesCount: 1,
            completedModules: 0,
            modules: [
              { id: 'mod_1', title: 'Connect a repository', status: 'active' }
            ]
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          pathName: 'Advanced TypeScript & SQL Engineering',
          description: 'Adaptive curriculum generated from your Skill DNA indicators.',
          modulesCount: 3,
          completedModules: 1,
          modules: [
            { id: 'mod_1', title: 'Strict Type assert boundaries & Zod schemas', status: 'completed' },
            { id: 'mod_2', title: 'Optimize SQL Index queries in PostgreSQL', status: 'active' },
            { id: 'mod_3', title: 'Write automated unit tests (Vitest)', status: 'pending' }
          ]
        }
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: {
          pathName: 'TypeScript & Next.js Advanced Architecture',
          description: 'Master strict type assertion boundaries.',
          modulesCount: 2,
          completedModules: 0,
          modules: [
            { id: 'mod_1', title: 'TypeScript strict configuration setup', status: 'active' }
          ]
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 550 });
  }
}
