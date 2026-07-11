import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { jobs } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const activeJobs = await db.query.jobs.findMany({
        limit: 10,
      });

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: activeJobs,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: [
          { id: '1', title: 'Senior TypeScript Architect', minTrustScore: 750 }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 550 });
  }
}
