import { NextRequest, NextResponse } from 'next/server';
import { OpportunityEngine } from '@/services/opportunity/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db, withDbTimeout } from '@/lib/drizzle';
import { applications, jobs } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;

    let userApps: any[] = [];
    try {
      userApps = await withDbTimeout(
        db.query.applications.findMany({
          where: eq(applications.userId, userId),
        }),
        250
      );
    } catch {}

    return NextResponse.json({
      success: true,
      data: userApps || [],
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/applications:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching user applications.',
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Application ID is required.',
      }, { status: 400 });
    }

    const userId = auth.context.user.id;

    const result = await OpportunityEngine.withdrawApplication(userId, applicationId);

    return NextResponse.json(result);
  } catch (error: any) {
    Logger.error('API Error in DELETE /api/applications:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while withdrawing application.',
    }, { status: 500 });
  }
}
