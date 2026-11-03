// SkillVerse Centralized Authorization & Security Guard (Phase 40)

import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { ApiAuthService } from '@/services/api/auth';
import { ApiAuthContext, ApiScope } from '@/types/api';
import { getSessionUser, isDemoAuthEnabled, type SessionUser } from '@/services/supabase';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users, companyMembers } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { DUMMY_USERS } from '@/lib/dummyData';
import { MfaService, MfaTokenService } from '@/services/auth/mfa';

export type UserRole = 'developer' | 'recruiter' | 'company_admin' | 'admin';

export class AuthorizationGuard {
  /**
   * Enforces that the request has a valid authenticated session or Bearer token
   */
  public static async requireAuth(req: NextRequest): Promise<{
    authorized: boolean;
    context: ApiAuthContext;
    response?: NextResponse;
  }> {
    const authResult = await ApiAuthService.authenticate(req);

    if (!authResult.success || !authResult.context.isAuthenticated) {
      const status = authResult.errorStatus || 401;
      return {
        authorized: false,
        context: authResult.context,
        response: NextResponse.json(
          {
            success: false,
            error: status === 403 ? 'Forbidden' : 'Unauthorized',
            code: authResult.errorCode || 'AUTHENTICATION_REQUIRED',
            message: authResult.errorMessage || 'Valid authentication session or API token required.',
            requestId: authResult.context.requestId,
          },
          { status }
        ),
      };
    }

    return { authorized: true, context: authResult.context };
  }

  /**
   * Enforces that the requesting user owns the targeted resource (Anti-IDOR protection)
   * Admins can bypass ownership checks.
   */
  public static async requireResourceOwner(
    req: NextRequest,
    resourceOwnerId: string
  ): Promise<{
    authorized: boolean;
    context: ApiAuthContext;
    response?: NextResponse;
  }> {
    const auth = await this.requireAuth(req);
    if (!auth.authorized) return auth;

    const isOwner = auth.context.user.id === resourceOwnerId;
    const isAdmin = auth.context.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return {
        authorized: false,
        context: auth.context,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'CROSS_USER_ACCESS_DENIED',
            message: 'You do not have permission to access or modify this resource.',
            requestId: auth.context.requestId,
          },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, context: auth.context };
  }

  /**
   * Enforces that the user belongs to the specified company workspace (Anti-cross-company IDOR)
   */
  public static async requireCompanyMembership(
    req: NextRequest,
    companyId: string,
    minRole?: 'company_admin' | 'recruiter' | ('company_admin' | 'recruiter')[]
  ): Promise<{
    authorized: boolean;
    context: ApiAuthContext;
    response?: NextResponse;
  }> {
    if (!companyId || typeof companyId !== 'string' || !companyId.trim()) {
      return {
        authorized: false,
        context: {
          isAuthenticated: false,
          user: { id: '', username: 'anonymous', name: 'Anonymous', role: 'anonymous' },
          authMethod: 'none',
          scopes: [],
          requestId: req.headers.get('x-request-id') || `req_${Date.now()}`,
          clientType: 'api',
        },
        response: NextResponse.json(
          {
            success: false,
            error: 'Bad Request',
            code: 'INVALID_COMPANY_ID',
            message: 'A valid companyId parameter is required.',
          },
          { status: 400 }
        ),
      };
    }

    const auth = await this.requireAuth(req);
    if (!auth.authorized) return auth;

    // Platform Admins have overarching visibility
    if (auth.context.user.role === 'admin') {
      return { authorized: true, context: auth.context };
    }

    const userId = auth.context.user.id;
    let isMember = false;
    let memberRole = '';

    // Check DB
    try {
      const member = await withDbTimeout(
        db.query.companyMembers.findFirst({
          where: and(
            eq(companyMembers.companyId, companyId),
            eq(companyMembers.userId, userId),
            eq(companyMembers.status, 'active')
          ),
        }),
        3000
      );

      if (member) {
        isMember = true;
        memberRole = member.role;
      }
    } catch {}

    // Strict scoped check against demo company membership ONLY in demo/test environments
    if (!isMember && isDemoAuthEnabled()) {
      const DEMO_MEMBERSHIPS: Record<string, { companyId: string; role: 'company_admin' | 'recruiter'; status: string }[]> = {
        '00000000-0000-0000-0000-000000000002': [
          { companyId: '00000000-0000-0000-0000-000000000001', role: 'company_admin', status: 'active' },
        ],
        '00000000-0000-0000-0000-000000000003': [
          { companyId: '00000000-0000-0000-0000-000000000001', role: 'recruiter', status: 'active' },
        ],
        '00000000-0000-0000-0000-000000000004': [
          { companyId: '00000000-0000-0000-0000-000000000002', role: 'recruiter', status: 'active' },
        ],
        '00000000-0000-0000-0000-000000000005': [
          { companyId: '00000000-0000-0000-0000-000000000002', role: 'company_admin', status: 'active' },
        ],
      };

      const userMemberships = DEMO_MEMBERSHIPS[userId] || [];
      const match = userMemberships.find(m => m.companyId === companyId && m.status === 'active');
      if (match) {
        isMember = true;
        memberRole = match.role;
      }
    }

    if (!isMember) {
      return {
        authorized: false,
        context: auth.context,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'CROSS_COMPANY_ACCESS_DENIED',
            message: 'You are not an authorized member of this company workspace.',
            requestId: auth.context.requestId,
          },
          { status: 403 }
        ),
      };
    }

    // Role check if minRole is specified
    if (minRole) {
      const allowedRoles = Array.isArray(minRole) ? minRole : [minRole];
      if (!allowedRoles.includes(memberRole as any)) {
        return {
          authorized: false,
          context: auth.context,
          response: NextResponse.json(
            {
              success: false,
              error: 'Forbidden',
              code: 'INSUFFICIENT_COMPANY_PRIVILEGES',
              message: 'Company administrator privilege required for this action.',
              requestId: auth.context.requestId,
            },
            { status: 403 }
          ),
        };
      }
    }

    return { authorized: true, context: auth.context };
  }

  /**
   * Enforces specific roles on the platform (e.g. admin or recruiter)
   */
  public static async requireRole(
    req: NextRequest,
    allowedRoles: UserRole[]
  ): Promise<{
    authorized: boolean;
    context: ApiAuthContext;
    response?: NextResponse;
  }> {
    const auth = await this.requireAuth(req);
    if (!auth.authorized) return auth;

    const userRole = (auth.context.user.role || 'developer') as UserRole;

    if (!allowedRoles.includes(userRole) && userRole !== 'admin') {
      return {
        authorized: false,
        context: auth.context,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'INSUFFICIENT_ROLE_PRIVILEGES',
            message: `Role "${userRole}" is not authorized for this operation. Required: [${allowedRoles.join(', ')}]`,
            requestId: auth.context.requestId,
          },
          { status: 403 }
        ),
      };
    }

        // Enforce Multi-Factor Authentication on Super Admin operations
    if (allowedRoles.includes('admin') || userRole === 'admin') {
      const isMfaEnforced = process.env.MFA_REQUIRED_FOR_ADMIN !== 'false';
      if (isMfaEnforced) {
        const path = req.nextUrl?.pathname || '';
        const isMfaRoute = path.startsWith('/api/admin/mfa');

        if (!isMfaRoute) {
          const isEnrolled = await MfaService.isMfaEnrolled(auth.context.user.id);
          if (!isEnrolled) {
            return {
              authorized: false,
              context: auth.context,
              response: NextResponse.json(
                {
                  success: false,
                  error: 'Forbidden',
                  code: 'MFA_ENROLLMENT_REQUIRED',
                  message: 'Multi-factor authentication (MFA/TOTP) enrollment is required for platform administrators.',
                  requestId: auth.context.requestId,
                },
                { status: 403 }
              ),
            };
          }

          const sessionToken = req.cookies.get('better-auth.session_token')?.value ||
            req.cookies.get('__Secure-better-auth.session_token')?.value ||
            `session_${auth.context.user.id}`;
          const mfaCookieValue = req.cookies.get('skillverse_mfa_verified')?.value;
          const tokenCheck = MfaTokenService.verifySignedToken(mfaCookieValue, auth.context.user.id, sessionToken);
          const isVerified = tokenCheck.valid;

          if (!isVerified) {
            return {
              authorized: false,
              context: auth.context,
              response: NextResponse.json(
                {
                  success: false,
                  error: 'Forbidden',
                  code: 'MFA_VERIFICATION_REQUIRED',
                  message: 'Multi-factor authentication (MFA) challenge must be completed for this session.',
                  requestId: auth.context.requestId,
                },
                { status: 403 }
              ),
            };
          }
        }
      }
    }

return { authorized: true, context: auth.context };
  }

  /**
   * Enforces that the Bearer token has a required scope
   */
  public static async requireScope(
    req: NextRequest,
    scope: ApiScope
  ): Promise<{
    authorized: boolean;
    context: ApiAuthContext;
    response?: NextResponse;
  }> {
    const auth = await this.requireAuth(req);
    if (!auth.authorized) return auth;

    const hasScope = ApiAuthService.hasScope(auth.context, scope);

    if (!hasScope) {
      return {
        authorized: false,
        context: auth.context,
        response: NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            code: 'INSUFFICIENT_TOKEN_SCOPE',
            message: `Token lacks required scope: "${scope}".`,
            requestId: auth.context.requestId,
          },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, context: auth.context };
  }

  /**
   * Deeply sanitizes output data, stripping sensitive secrets, tokens, password hashes, and debug fields
   */
  public static sanitizeResponse<T>(data: T): T {
    if (data === null || data === undefined) return data;

    const SENSITIVE_KEYS = new Set([
      'githubtoken',
      'github_token',
      'tokenhash',
      'token_hash',
      'secret',
      'password',
      'passwordhash',
      'password_hash',
      'rawtoken',
      'raw_token',
      'privatekey',
      'private_key',
      'apikey',
      'api_key',
      'stack',
      'database_url',
    ]);

    function clean(item: any): any {
      if (Array.isArray(item)) {
        return item.map(clean);
      }
      if (item !== null && typeof item === 'object' && !(item instanceof Date)) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
          const lowerKey = key.toLowerCase();
          if (SENSITIVE_KEYS.has(lowerKey)) {
            continue; // strip key
          }
          result[key] = clean(value);
        }
        return result;
      }
      return item;
    }

    return clean(data);
  }
}

/**
 * Server-side layout and page guard for authenticated routes.
 * Throws Next.js redirect to /login if unauthenticated.
 * If allowedRoles is specified, enforces role or redirects to /overview.
 */
export async function requireServerAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || 'developer') as UserRole;
    if (userRole !== 'admin' && !allowedRoles.includes(userRole)) {
      redirect('/overview?error=unauthorized_access');
    }
  }

  return user;
}

/**
 * Server-side layout and page guard for company workspace routes.
 * Ensures user is recruiter, company_admin, or platform admin,
 * AND has verified company membership.
 */
export async function requireServerCompanyAccess(
  companyId?: string
): Promise<{ user: SessionUser; companyId: string }> {
  const user = await requireServerAuth();

  // Platform Admins have overarching access across workspaces
  if (user.role === 'admin') {
    return { user, companyId: companyId || '00000000-0000-0000-0000-000000000001' };
  }

  // Developer role is strictly prohibited from accessing company workspaces
  if (user.role !== 'recruiter' && user.role !== 'company_admin') {
    redirect('/overview?error=unauthorized_company_workspace');
  }

  let resolvedCompanyId: string | null = null;

  // Verify in database if available
  try {
    if (companyId) {
      const member = await withDbTimeout(
        db.query.companyMembers.findFirst({
          where: and(
            eq(companyMembers.companyId, companyId),
            eq(companyMembers.userId, user.id),
            eq(companyMembers.status, 'active')
          ),
        }),
        3000
      );
      if (member) {
        resolvedCompanyId = member.companyId;
      }
    } else {
      const member = await withDbTimeout(
        db.query.companyMembers.findFirst({
          where: and(
            eq(companyMembers.userId, user.id),
            eq(companyMembers.status, 'active')
          ),
        }),
        3000
      );
      if (member) {
        resolvedCompanyId = member.companyId;
      }
    }
  } catch {}

  // Scoped demo membership resolution strictly for test/dev environments
  if (!resolvedCompanyId && isDemoAuthEnabled()) {
    const DEMO_MEMBERSHIPS: Record<string, { companyId: string; role: 'company_admin' | 'recruiter'; status: string }[]> = {
      '00000000-0000-0000-0000-000000000002': [
        { companyId: '00000000-0000-0000-0000-000000000001', role: 'company_admin', status: 'active' },
      ],
      '00000000-0000-0000-0000-000000000003': [
        { companyId: '00000000-0000-0000-0000-000000000001', role: 'recruiter', status: 'active' },
      ],
      '00000000-0000-0000-0000-000000000004': [
        { companyId: '00000000-0000-0000-0000-000000000002', role: 'recruiter', status: 'active' },
      ],
      '00000000-0000-0000-0000-000000000005': [
        { companyId: '00000000-0000-0000-0000-000000000002', role: 'company_admin', status: 'active' },
      ],
    };

    const memberships = DEMO_MEMBERSHIPS[user.id] || [];
    const match = companyId
      ? memberships.find((m) => m.companyId === companyId && m.status === 'active')
      : memberships.find((m) => m.status === 'active');

    if (match) {
      resolvedCompanyId = match.companyId;
    }
  }

  if (!resolvedCompanyId) {
    redirect('/overview?error=no_company_membership');
  }

  return { user, companyId: resolvedCompanyId };
}

/**
 * Server-side layout and page guard for platform admin console.
 * Restricts access exclusively to users with role === 'admin'.
 */
export async function requireServerAdmin(): Promise<SessionUser> {
  const user = await requireServerAuth();

  if (user.role !== 'admin') {
    redirect('/overview?error=unauthorized_admin_access');
  }

  return user;
}
