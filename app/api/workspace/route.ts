import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { workspaceProjects, workspaceTasks, notes } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;

    let userProjects: any[] = [];
    let userNotes: any[] = [];
    const allTasks: any[] = [];

    try {
      userProjects = await withDbTimeout(
        db.query.workspaceProjects.findMany({
          where: eq(workspaceProjects.userId, userId),
        }),
        1000
      ) || [];

      userNotes = await withDbTimeout(
        db.query.notes.findMany({
          where: eq(notes.userId, userId),
        }),
        1000
      ) || [];

      if (userProjects.length > 0) {
        for (const p of userProjects) {
          const tasks = await withDbTimeout(
            db.query.workspaceTasks.findMany({
              where: eq(workspaceTasks.projectId, p.id),
            }),
            500
          );
          if (tasks) {
            allTasks.push(...tasks);
          }
        }
      }
    } catch {}

    // Return clean, unpolluted data (empty lists for zero-state users, never mock data)
    return NextResponse.json({
      success: true,
      data: {
        projects: userProjects,
        tasks: allTasks,
        notes: userNotes,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/workspace:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching workspace details.',
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
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Title and content are required.',
      }, { status: 400 });
    }

    try {
      const [newNote] = await withDbTimeout(
        db
          .insert(notes)
          .values({
            userId,
            title,
            content,
          })
          .returning(),
        2000
      );

      return NextResponse.json({
        success: true,
        data: newNote,
      });
    } catch (dbError: any) {
      Logger.error('Database insertion error in POST /api/workspace:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database operation failed while creating note.',
      }, { status: 500 });
    }
  } catch (error: any) {
    Logger.error('API Error in POST /api/workspace:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while saving note.',
    }, { status: 500 });
  }
}
