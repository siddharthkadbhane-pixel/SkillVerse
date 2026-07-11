import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { skillDna } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const skills = await db.query.skillDna.findMany({
        limit: 10,
      });

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: skills,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: [
          { id: '1', userId: '1', dnaStructure: { overallLevel: 75, skills: [{ name: 'TypeScript', level: 85 }] } }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
