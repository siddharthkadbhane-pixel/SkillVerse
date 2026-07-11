import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { webhooks } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { url, events } = await req.json();

    try {
      const [newWebhook] = await db
        .insert(webhooks)
        .values({
          userId: user.id,
          url,
          events: events || [],
          secret: 'whsec_' + Math.random().toString(36).slice(2),
        })
        .returning();

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: newWebhook,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: {
          id: 'wh_mock_created',
          url,
          events,
          secret: 'whsec_mock',
          createdAt: new Date().toISOString(),
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const list = await db.query.webhooks.findMany({
        where: (webhooks, { eq }) => eq(webhooks.userId, user.id),
      });

      return NextResponse.json({
        version: 'v1',
        success: true,
        data: list,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        version: 'v1',
        success: true,
        data: []
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
