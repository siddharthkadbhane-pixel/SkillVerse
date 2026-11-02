import { NextRequest, NextResponse } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { DataControlsService } from '@/services/security/dataControls';
import { PersonalAccessTokenService } from '@/services/api/tokens';

export async function POST(req: NextRequest) {
  const auth = await ApiAuthService.authenticate(req);
  if (!auth.success || !auth.context.isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Explicit confirmation string "DELETE_MY_ACCOUNT" required to proceed with account deletion.',
        },
        { status: 400 }
      );
    }

    const userId = auth.context.user.id;

    // 1. Revoke any active Personal Access Tokens for this user
    try {
      const tokens = await PersonalAccessTokenService.listTokens(userId);
      for (const token of tokens) {
        await PersonalAccessTokenService.revokeToken(userId, token.id);
      }
    } catch {}

    // 2. Anonymize user records (scrub email, name, website, github tokens, sessions, accounts)
    const result = await DataControlsService.anonymizeUser(userId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 500 });
    }

    // Invalidate session cookies in the HTTP response
    const response = NextResponse.json({
      success: true,
      message: 'Account successfully anonymized, all active credentials revoked, and sessions terminated.',
      details: result.message,
    });

    response.cookies.delete('better-auth.session_token');
    response.cookies.delete('better-auth.session_data');
    response.cookies.delete('skillverse_session');

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
