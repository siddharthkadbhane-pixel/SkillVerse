import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { workspaces, workspaceMembers } from '@/database/schema';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    let list: any[] = [];

    try {
      list = await withDbTimeout(
        db
          .select({
            id: workspaces.id,
            name: workspaces.name,
            repositoryId: workspaces.repositoryId,
            createdAt: workspaces.createdAt,
          })
          .from(workspaces)
          .leftJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
          .where(eq(workspaceMembers.userId, userId)),
        1000
      );
    } catch {}

    // Return empty list if no workspaces exist; never substitute other users' mock workspaces
    return NextResponse.json({
      success: true,
      data: list || [],
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/workspaces:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching workspaces.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    const body = await req.json();

    if (!body?.name) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Workspace name is required.',
      }, { status: 400 });
    }

    try {
      const [ws] = await withDbTimeout(
        db
          .insert(workspaces)
          .values({
            userId,
            name: body.name,
            repositoryId: body.repositoryId || null,
          })
          .returning(),
        2000
      );

      await withDbTimeout(
        db.insert(workspaceMembers).values({
          workspaceId: ws.id,
          userId,
          role: 'owner',
        }),
        1000
      );

      return NextResponse.json({
        success: true,
        message: 'Workspace successfully created.',
        data: ws,
      });
    } catch (dbError: any) {
      Logger.error('Database error in POST /api/workspaces:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database operation failed while creating workspace.',
      }, { status: 500 });
    }
  } catch (error: any) {
    Logger.error('API Error in POST /api/workspaces:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while creating workspace.',
    }, { status: 500 });
  }
}
