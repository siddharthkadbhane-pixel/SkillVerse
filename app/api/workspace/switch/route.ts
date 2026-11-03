import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { db, withDbTimeout } from '@/lib/drizzle';
import { companyMembers } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { isDemoAuthEnabled } from '@/services/supabase';
import { Logger } from '@/lib/logger';
import { z } from 'zod';

const WorkspaceSwitchSchema = z.object({
  mode: z.enum(['developer', 'company', 'admin']),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await req.json();
    const parseResult = WorkspaceSwitchSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid workspace mode. Must be "developer", "company", or "admin".' },
        { status: 400 }
      );
    }

    const { mode } = parseResult.data;
    const user = auth.context.user;

    // 1. Admin mode validation
    if (mode === 'admin') {
      if (user.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'INSUFFICIENT_ROLE_PRIVILEGES',
            message: 'Super Admin console is restricted exclusively to platform administrators.',
          },
          { status: 403 }
        );
      }
    }

    // 2. Company mode validation
    if (mode === 'company') {
      let hasCompanyAccess = user.role === 'admin' || user.role === 'recruiter' || user.role === 'company_admin';

      if (!hasCompanyAccess) {
        try {
          const membership = await withDbTimeout(
            db.query.companyMembers.findFirst({
              where: and(eq(companyMembers.userId, user.id), eq(companyMembers.status, 'active')),
            }),
            2000
          );
          if (membership) {
            hasCompanyAccess = true;
          }
        } catch {}
      }

      if (!hasCompanyAccess) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'NO_COMPANY_MEMBERSHIP',
            message: 'Company workspace requires active membership in a registered organization.',
          },
          { status: 403 }
        );
      }
    }

    const destination = mode === 'admin' ? '/admin' : mode === 'company' ? '/company' : '/overview';

    const response = NextResponse.json({
      success: true,
      data: {
        mode,
        redirectTo: destination,
      },
    });

    // Set cookie for active workspace persistence
    response.cookies.set('skillverse_active_workspace', mode, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    Logger.error('API Error in POST /api/workspace/switch:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to switch workspace mode.' },
      { status: 500 }
    );
  }
}

