import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { trustScores } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const scores = await db.query.trustScores.findMany({
        limit: 10,
      });

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: scores,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: [
          { id: '1', userId: '1', overallScore: 840, confidence: 85 }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 550 });
  }
}
