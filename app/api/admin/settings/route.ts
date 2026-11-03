import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { AuditLogService } from '@/services/security/audit';
import { Logger } from '@/lib/logger';
import { z } from 'zod';

// In-memory persistent platform settings
const platformSettings = {
  registrationOpen: true,
  maintenanceMode: false,
  mfaRequiredForAdmin: false,
  zeroCostMode: true,
  rateLimitingEnabled: true,
  defaultUserRole: 'developer' as const,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const SettingsUpdateSchema = z.object({
  registrationOpen: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  mfaRequiredForAdmin: z.boolean().optional(),
  rateLimitingEnabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    return NextResponse.json({
      success: true,
      data: platformSettings,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/admin/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await req.json();
    const parseResult = SettingsUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings inputs', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updates = parseResult.data;
    const actorId = auth.context.user.id;
    const previous = { ...platformSettings };

    Object.assign(platformSettings, updates, {
      updatedAt: new Date().toISOString(),
      updatedBy: actorId,
    });

    // Record audit log
    await AuditLogService.log({
      actorId,
      actorRole: 'admin',
      action: 'PLATFORM_SETTINGS_UPDATED',
      resourceType: 'platform_settings',
      resourceId: 'global',
      details: {
        previous,
        updates,
        timestamp: new Date().toISOString(),
      },
    });

    Logger.info(`[Admin] Platform settings updated by admin ${actorId}:`, updates);

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully.',
      data: platformSettings,
    });
  } catch (error: any) {
    Logger.error('API Error in PATCH /api/admin/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update platform settings' },
      { status: 500 }
    );
  }
}

