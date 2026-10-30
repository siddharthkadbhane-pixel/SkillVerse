import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { trustHistory } from '@/database/schema';
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
            id: 'h_mock_1',
            overallScore: 840,
            categoryScores: {
              codeQuality: 85,
              maintainability: 82,
              security: 78,
              performance: 88,
              testing: 20,
              gitActivity: 75,
              documentation: 80,
            },
            engineVersion: '1.0.0',
            explanation: 'Recalculation triggered by NextJS AI Agent codebase review.',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'h_mock_2',
            overallScore: 780,
            categoryScores: {
              codeQuality: 80,
              maintainability: 75,
              security: 72,
              performance: 85,
              testing: 10,
              gitActivity: 70,
              documentation: 70,
            },
            engineVersion: '1.0.0',
            explanation: 'Initial calculation on repository connection.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ]
      });
    }

    try {
      const historyLogs = await db
        .select()
        .from(trustHistory)
        .where(eq(trustHistory.userId, user.id))
        .orderBy(desc(trustHistory.createdAt));

      return NextResponse.json({
        success: true,
        data: historyLogs,
      });
    } catch (dbErr: any) {
      console.error('[API Trust History] Database read error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to fetch trust history' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
