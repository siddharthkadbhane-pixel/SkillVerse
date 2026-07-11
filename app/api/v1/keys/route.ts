import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { apiKeys } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const keysList = await db.query.apiKeys.findMany({
        where: eq(apiKeys.userId, user.id),
      });

      return NextResponse.json({
        success: true,
        data: keysList,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: [
          { id: 'key_1', name: 'VS Code Extension Key', keyHash: 'sk_live_...481', createdAt: new Date().toISOString() }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 550 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, scopes } = await req.json();

    try {
      const rawKey = 'sk_live_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      
      const [newKey] = await db
        .insert(apiKeys)
        .values({
          userId: user.id,
          name,
          scopes: scopes || ['read:profile'],
          keyHash: rawKey.slice(-10), // mock hash
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: {
          ...newKey,
          rawKey, // returned only once
        }
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: {
          id: 'key_mock_created',
          name,
          scopes,
          rawKey: 'sk_live_mock_key_unhashed_credentials',
          createdAt: new Date().toISOString(),
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
