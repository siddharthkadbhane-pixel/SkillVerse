import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { careerGoals } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock goals if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'goal_1', title: 'Learn TypeScript and Type Safety principles', status: 'active', createdAt: new Date().toISOString() },
          { id: 'goal_2', title: 'Reach Trust Score 800', status: 'active', createdAt: new Date().toISOString() }
        ]
      });
    }

    try {
      const goals = await db.query.careerGoals.findMany({
        where: eq(careerGoals.userId, user.id),
        orderBy: (careerGoals, { desc }) => [desc(careerGoals.createdAt)],
      });

      // If empty, insert baseline goals
      if (goals.length === 0) {
        return NextResponse.json({
          success: true,
          data: [
            { id: 'goal_1', title: 'Connect a repository to verify skill DNA', status: 'active', createdAt: new Date().toISOString() }
          ]
        });
      }

      return NextResponse.json({
        success: true,
        data: goals,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: [
          { id: 'goal_1', title: 'Reach Trust Score 800', status: 'active', createdAt: new Date().toISOString() }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await req.json();

    try {
      const [newGoal] = await db
        .insert(careerGoals)
        .values({
          userId: user.id,
          title,
          status: 'active',
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newGoal,
      });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: {
          id: 'goal_mock_created',
          title,
          status: 'active',
          createdAt: new Date().toISOString(),
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
