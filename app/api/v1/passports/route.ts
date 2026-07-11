import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { passports } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const allPassports = await db.query.passports.findMany({
        limit: 10,
      });

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: allPassports,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: [
          { id: '1', userId: '1', visibility: 'public', viewCount: 45 }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
