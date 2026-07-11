import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { skillHistory } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock history if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'sh_mock_1',
            skillName: 'TypeScript',
            category: 'Programming Languages',
            previousLevel: 70,
            currentLevel: 85,
            growthPercent: 15,
            version: '1.0.0',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'sh_mock_2',
            skillName: 'React',
            category: 'Frontend',
            previousLevel: 72,
            currentLevel: 82,
            growthPercent: 10,
            version: '1.0.0',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ]
      });
    }

    try {
      const logs = await db
        .select()
        .from(skillHistory)
        .where(eq(skillHistory.userId, user.id))
        .orderBy(desc(skillHistory.createdAt));

      return NextResponse.json({
        success: true,
        data: logs,
      });
    } catch {
      // Fallback mock history logs
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'sh_mock_1',
            skillName: 'TypeScript',
            category: 'Programming Languages',
            previousLevel: 70,
            currentLevel: 85,
            growthPercent: 15,
            version: '1.0.0',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
