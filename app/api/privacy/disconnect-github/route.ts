import { NextRequest, NextResponse } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { AuditLogService } from '@/services/security/audit';

export async function POST(req: NextRequest) {
  const auth = await ApiAuthService.authenticate(req);
  if (!auth.success || !auth.context.isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.context.user.id;

  try {
    // Clear GitHub token and username link on user record
    await withDbTimeout(
      db
        .update(users)
        .set({
          githubToken: null,
          githubId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId)),
      150
    );

    await AuditLogService.log({
      actorId: userId,
      action: 'privacy.github_disconnected',
      resourceType: 'oauth_integration',
      resourceId: 'github',
      details: { previousUsername: auth.context.user.username },
    });

    return NextResponse.json({
      success: true,
      message: 'GitHub account disconnected successfully. Local OAuth tokens have been revoked and repository auto-sync is disabled.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
