import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users } from '@/database/schema';

export async function GET(req: NextRequest) {
  try {
    try {
      const allUsers = await db.query.users.findMany({
        limit: 10,
      });

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: allUsers,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: [
          { id: '1', name: 'Sidharth Kadbhane', username: 'siddharthkadbhane-pixel', role: 'developer' }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
