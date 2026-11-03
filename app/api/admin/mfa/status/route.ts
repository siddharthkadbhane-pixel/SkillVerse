import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { MfaService, MfaTokenService } from '@/services/auth/mfa';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    const enrolled = await MfaService.isMfaEnrolled(userId);

    const sessionToken = req.cookies.get('better-auth.session_token')?.value ||
      req.cookies.get('__Secure-better-auth.session_token')?.value ||
      `session_${userId}`;

    const mfaCookie = req.cookies.get('skillverse_mfa_verified')?.value;
    const tokenCheck = MfaTokenService.verifySignedToken(mfaCookie, userId, sessionToken);
    const sessionVerified = tokenCheck.valid;

    return NextResponse.json({
      success: true,
      data: {
        enrolled,
        sessionVerified,
        requiredForAdmin: true,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/admin/mfa/status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch MFA status.' },
      { status: 500 }
    );
  }
}
