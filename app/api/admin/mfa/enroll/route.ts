import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { MfaService } from '@/services/auth/mfa';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const user = auth.context.user;
    const enrollment = MfaService.initiateEnrollment(user.id, user.email || 'admin@skillverse.dev');

    return NextResponse.json({
      success: true,
      message: 'MFA enrollment initiated. Scan the QR code or enter the secret key into your authenticator app.',
      data: {
        secret: enrollment.secret,
        totpURI: enrollment.totpURI,
        backupCodes: enrollment.backupCodes,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/admin/mfa/enroll:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate MFA enrollment.' },
      { status: 500 }
    );
  }
}

