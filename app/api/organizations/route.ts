import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { organizations } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let list = await db.select().from(organizations);

    // Auto-seed mock tenants if empty
    if (list.length === 0) {
      const partners = [
        { name: 'MIT Computer Science Dept', type: 'university' },
        { name: 'Stanford Engineering Lab', type: 'university' },
        { name: 'Assembly Bootcamp', type: 'bootcamp' },
        { name: 'PixelCorp hiring team', type: 'company' },
      ];

      const seeded = [];
      for (const p of partners) {
        const [inserted] = await db
          .insert(organizations)
          .values({
            name: p.name,
            type: p.type,
          })
          .returning();
        seeded.push(inserted);
      }
      list = seeded;
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/organizations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
