import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { partnerIntegrations } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { Logger } from '@/lib/logger';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { platform } = body;

    if (!platform) {
      return NextResponse.json({ success: false, error: 'platform is required' }, { status: 400 });
    }

    const token = `sv_token_${crypto.randomBytes(16).toString('hex')}`;

    const [integration] = await db
      .insert(partnerIntegrations)
      .values({
        userId: user.id,
        platform,
        token,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Integration successfully connected.',
      data: integration,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/integrations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const list = await db.query.partnerIntegrations.findMany({
      where: eq(partnerIntegrations.userId, user.id)
    });
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
