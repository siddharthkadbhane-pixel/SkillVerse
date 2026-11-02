import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { checkDbAvailability } from '@/lib/drizzle';

export async function GET(req: NextRequest) {
  try {
    // Enforce platform admin role strictly
    const auth = await AuthorizationGuard.requireRole(req, ['admin']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const isDbAvailable = checkDbAvailability();

    return NextResponse.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        system: {
          status: 'healthy',
          databaseAvailable: isDbAvailable,
          authProvider: 'Better Auth (GitHub OAuth)',
          rbacModel: '4-Tier (developer, recruiter, company_admin, admin)',
          leastPrivilegeRole: 'skillverse_app',
        },
        securityPolicies: {
          selfEscalationBlocked: true,
          crossTenantIdorProtection: true,
          edgeSessionInterception: true,
          serverLayoutGuards: true,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error in admin system endpoint' },
      { status: 500 }
    );
  }
}

