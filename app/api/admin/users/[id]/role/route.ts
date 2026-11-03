import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard, UserRole } from '@/services/security/authorizer';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { eq, count } from 'drizzle-orm';
import { AuditLogService } from '@/services/security/audit';
import { SessionManagementService } from '@/services/admin/sessionManagement';
import { Logger } from '@/lib/logger';
import { z } from 'zod';

const RoleUpdateSchema = z.object({
  role: z.enum(['developer', 'recruiter', 'company_admin', 'admin']),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Target user ID is required.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = RoleUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role parameter. Must be developer, recruiter, company_admin, or admin.',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { role: newRole, reason } = parseResult.data;
    const actorId = auth.context.user.id;

    // Anti-Lockout Rule: Super Admin cannot demote themselves from admin role
    if (targetUserId === actorId && newRole !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'CANNOT_DEMOTE_SELF',
          message: 'Administrators cannot revoke their own administrative privileges to prevent account lockout.',
        },
        { status: 400 }
      );
    }

    // Verify target user exists
    const targetUser = await withDbTimeout(
      db.query.users.findFirst({
        where: eq(users.id, targetUserId),
      }),
      3000
    );

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    const previousRole = targetUser.role;

    if (previousRole === newRole) {
      return NextResponse.json({
        success: true,
        message: `User already holds the role "${newRole}". No change required.`,
        data: { id: targetUser.id, role: newRole },
      });
    }

    // Anti-Lockout Rule: Prevent accidental removal of the last active Super Admin
    if (previousRole === 'admin' && newRole !== 'admin') {
      try {
        const demotionTx = await withDbTimeout(
          db.transaction(async (tx) => {
            // Lock all admin rows with FOR UPDATE to serialize concurrent demotion requests
            const currentAdmins = await tx
              .select({ id: users.id })
              .from(users)
              .where(eq(users.role, 'admin'))
              .for('update');

            if (currentAdmins.length <= 1) {
              return { success: false, error: 'CANNOT_REMOVE_LAST_ADMIN' };
            }

            await tx
              .update(users)
              .set({
                role: newRole,
                updatedAt: new Date(),
              })
              .where(eq(users.id, targetUserId));

            return { success: true };
          }),
          4000
        );

        if (!demotionTx.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'CANNOT_REMOVE_LAST_ADMIN',
              message: 'Cannot demote the last remaining Platform Administrator. Promote another administrator first.',
            },
            { status: 400 }
          );
        }
      } catch (err: any) {
        Logger.error('[Admin] Error executing admin demotion:', err);
        return NextResponse.json(
          { success: false, error: 'DEMOTION_FAILED', message: 'Failed to process admin demotion.' },
          { status: 500 }
        );
      }
    } else {
      // Security Check when promoting to admin: Require verified email
      if (newRole === 'admin' && !targetUser.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNVERIFIED_ADMIN_PROMOTION_BLOCKED',
            message: 'Cannot promote an account to Platform Administrator without a verified email address.',
          },
          { status: 400 }
        );
      }

      // 1. Update user role in database
      await withDbTimeout(
        db.update(users)
          .set({
            role: newRole,
            updatedAt: new Date(),
          })
          .where(eq(users.id, targetUserId)),
        3000
      );
    }

    // 2. Invalidate all active sessions for target user so privileges update immediately
    const invalidatedSessions = await SessionManagementService.invalidateUserSessions(targetUserId);

    // 3. Record immutable security audit log
    await AuditLogService.log({
      actorId,
      actorRole: 'admin',
      action: newRole === 'admin' ? 'ADMIN_PROMOTED' : previousRole === 'admin' ? 'ADMIN_DEMOTED' : 'USER_ROLE_UPDATED',
      resourceType: 'user',
      resourceId: targetUserId,
      details: {
        targetEmail: targetUser.email,
        targetUsername: targetUser.username,
        previousRole,
        newRole,
        reason: reason || 'Administrative role modification',
        sessionsRevoked: invalidatedSessions,
        timestamp: new Date().toISOString(),
      },
    });

    Logger.info(`[Admin] User ${targetUserId} role updated from ${previousRole} to ${newRole} by admin ${actorId}`);

    return NextResponse.json({
      success: true,
      message: `Role successfully updated to "${newRole}".`,
      data: {
        id: targetUser.id,
        email: targetUser.email,
        previousRole,
        newRole,
        sessionsRevoked: invalidatedSessions,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/admin/users/[id]/role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user role.' },
      { status: 500 }
    );
  }
}

