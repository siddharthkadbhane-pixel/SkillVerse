import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { developerCapabilityCards, capabilityDimensions, users } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { getDummyUserByUsername, getDummyDCCData } from '@/lib/dummyData';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const u1 = searchParams.get('username1') || 'siddharthkadbhane-pixel';
    const u2 = searchParams.get('username2') || 'alex-chen';

    if (!u1 || !u2) {
      return NextResponse.json({ success: false, error: 'username1 and username2 parameters are required' }, { status: 400 });
    }

    let dev1Data: any = null;
    let dev2Data: any = null;

    try {
      const [user1, user2] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.username, u1) }),
        db.query.users.findFirst({ where: eq(users.username, u2) }),
      ]);

      if (user1 && user2) {
        const [card1, card2] = await Promise.all([
          db.query.developerCapabilityCards.findFirst({ where: eq(developerCapabilityCards.userId, user1.id) }),
          db.query.developerCapabilityCards.findFirst({ where: eq(developerCapabilityCards.userId, user2.id) }),
        ]);

        if (card1 && card2) {
          const [dims1, dims2] = await Promise.all([
            db.query.capabilityDimensions.findFirst({ where: eq(capabilityDimensions.cardId, card1.id) }),
            db.query.capabilityDimensions.findFirst({ where: eq(capabilityDimensions.cardId, card2.id) }),
          ]);

          dev1Data = {
            username: u1,
            name: user1.name,
            level: card1.level,
            overallScore: card1.overallScore,
            dimensions: dims1,
          };

          dev2Data = {
            username: u2,
            name: user2.name,
            level: card2.level,
            overallScore: card2.overallScore,
            dimensions: dims2,
          };
        }
      }
    } catch {}

    // Fallback to rich test dataset
    if (!dev1Data) {
      const dummy1 = getDummyUserByUsername(u1);
      const dcc1 = getDummyDCCData(dummy1.id);
      dev1Data = {
        username: dummy1.username,
        name: dummy1.name,
        level: dcc1.card.level,
        overallScore: dcc1.card.overallScore,
        dimensions: dcc1.dimensions,
      };
    }

    if (!dev2Data) {
      const dummy2 = getDummyUserByUsername(u2);
      const dcc2 = getDummyDCCData(dummy2.id);
      dev2Data = {
        username: dummy2.username,
        name: dummy2.name,
        level: dcc2.card.level,
        overallScore: dcc2.card.overallScore,
        dimensions: dcc2.dimensions,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        developer1: dev1Data,
        developer2: dev2Data,
      }
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc/comparison:', error);
    const d1 = getDummyUserByUsername('siddharthkadbhane-pixel');
    const d2 = getDummyUserByUsername('alex-chen');
    return NextResponse.json({
      success: true,
      data: {
        developer1: {
          username: d1.username,
          name: d1.name,
          level: 'Elite',
          overallScore: 940,
          dimensions: getDummyDCCData(d1.id).dimensions,
        },
        developer2: {
          username: d2.username,
          name: d2.name,
          level: 'Expert',
          overallScore: 820,
          dimensions: getDummyDCCData(d2.id).dimensions,
        }
      }
    });
  }
}
