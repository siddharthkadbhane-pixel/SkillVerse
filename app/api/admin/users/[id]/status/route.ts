import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { UserStatusService } from '@/services/admin/userStatus';
import { Logger } from '@/lib/logger';
import { z } from 'zod';

const StatusUpdateSchema = z.object({
  status: z.enum(['active', 'suspended']),
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
    const parseResult = StatusUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status parameter. Must be "active" or "suspended".',
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { status, reason } = parseResult.data;
    const actorId = auth.context.user.id;

    const result = await UserStatusService.setUserStatus({
      targetUserId,
      newStatus: status,
      actorId,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update account status.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account status successfully changed to "${status}".`,
      data: {
        userId: targetUserId,
        status,
        sessionsRevoked: result.sessionsRevoked || 0,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/admin/users/[id]/status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update account status.' },
      { status: 500 }
    );
  }
}

