import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { MfaService, MfaTokenService } from '@/services/auth/mfa';
import { Logger } from '@/lib/logger';
import { z } from 'zod';

const VerifySchema = z.object({
  code: z.string().min(1).max(32),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await req.json();
    const parseResult = VerifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Verification code or backup code is required.' },
        { status: 400 }
      );
    }

    const { code } = parseResult.data;
    const userId = auth.context.user.id;

    // Check if user is completing initial enrollment confirmation
    const isEnrolled = await MfaService.isMfaEnrolled(userId);
    let verified = false;

    if (!isEnrolled) {
      // First-time confirmation
      verified = await MfaService.confirmEnrollment(userId, code);
    } else {
      // Regular TOTP or Backup code check
      const res = await MfaService.verifyUserMfa(userId, code);
      verified = res.verified;
    }

    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'INVALID_MFA_CODE', message: 'The provided verification code or backup code is invalid or expired.' },
        { status: 400 }
      );
    }

    // Generate signed, session-bound MFA verification token
    const sessionToken = req.cookies.get('better-auth.session_token')?.value ||
      req.cookies.get('__Secure-better-auth.session_token')?.value ||
      `session_${userId}`;

    const mfaToken = MfaTokenService.createSignedToken(userId, sessionToken);

    const response = NextResponse.json({
      success: true,
      message: 'Multi-factor authentication verified successfully.',
      data: { verified: true },
    });

    response.cookies.set('skillverse_mfa_verified', mfaToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 hours
    });

    return response;
  } catch (error: any) {
    Logger.error('API Error in POST /api/admin/mfa/verify:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify multi-factor authentication code.' },
      { status: 500 }
    );
  }
}

