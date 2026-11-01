import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { workspaceProjects, collabTeams } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';

export async function GET(req: NextRequest) {
  try {
    try {
      const allTeams = await db.query.collabTeams.findMany({
        orderBy: (collabTeams, { desc }) => [desc(collabTeams.createdAt)],
      });

      return NextResponse.json({
        success: true,
        data: allTeams,
      });
    } catch (dbErr: any) {
      console.error('[API Projects] Database read error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to fetch projects' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await req.json();

    try {
      const [newProj] = await db
        .insert(workspaceProjects)
        .values({
          userId: user.id,
          name,
          description,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newProj,
      });
    } catch (dbErr: any) {
      console.error('[API Projects] Database insert error:', dbErr?.message);
      return NextResponse.json(
        { success: false, error: 'Database operation failed: unable to create project' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
