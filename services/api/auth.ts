import { NextRequest } from 'next/server';
import { ApiAuthContext, ApiScope, ApiClientType } from '@/types/api';
import { PersonalAccessTokenService } from './tokens';
import { getSessionUser, isDemoAuthEnabled } from '@/services/supabase';
import { db, withDbTimeout } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DUMMY_USERS, getDummyUserById } from '@/lib/dummyData';

export class ApiAuthService {
  /**
   * Resolves client type from request headers and user-agent
   */
  public static resolveClientType(req: NextRequest): ApiClientType {
    const clientHeader = req.headers.get('x-client-type')?.toLowerCase();
    if (clientHeader === 'cli') return 'cli';
    if (clientHeader === 'vscode') return 'vscode';
    if (clientHeader === 'sdk') return 'sdk';
    if (clientHeader === 'web') return 'web';

    const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';
    if (userAgent.includes('vscode')) return 'vscode';
    if (userAgent.includes('skillverse-cli')) return 'cli';
    if (userAgent.includes('mozilla') || userAgent.includes('chrome') || userAgent.includes('safari')) return 'web';

    return 'api';
  }

  /**
   * Authenticates an incoming Next.js API request via Bearer Token or Session Cookie
   */
  public static async authenticate(req: NextRequest): Promise<{
    success: boolean;
    context: ApiAuthContext;
    errorStatus?: number;
    errorCode?: string;
    errorMessage?: string;
  }> {
    const requestId = req.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clientType = this.resolveClientType(req);

    const authHeader = req.headers.get('authorization') || '';
    const isBearer = authHeader.toLowerCase().startsWith('bearer ');

    // 1. Try Bearer Personal Access Token
    if (isBearer) {
      const rawToken = authHeader.slice(7).trim();
      const validation = await PersonalAccessTokenService.validateToken(rawToken);

      if (!validation.isValid || !validation.tokenData) {
        if (validation.errorReason === 'REVOKED') {
          return {
            success: false,
            errorStatus: 401,
            errorCode: 'TOKEN_REVOKED',
            errorMessage: 'This personal access token has been revoked.',
            context: this.createEmptyContext(requestId, clientType),
          };
        }
        if (validation.errorReason === 'EXPIRED') {
          return {
            success: false,
            errorStatus: 401,
            errorCode: 'TOKEN_EXPIRED',
            errorMessage: 'This personal access token has expired.',
            context: this.createEmptyContext(requestId, clientType),
          };
        }
        return {
          success: false,
          errorStatus: 401,
          errorCode: 'INVALID_TOKEN',
          errorMessage: 'Invalid or malformed authorization token.',
          context: this.createEmptyContext(requestId, clientType),
        };
      }

      // Resolve user data
      const tokenUser = await this.resolveUserById(validation.tokenData.userId);

      if (!tokenUser) {
        return {
          success: false,
          errorStatus: 401,
          errorCode: 'USER_NOT_FOUND',
          errorMessage: 'User associated with this token could not be found.',
          context: this.createEmptyContext(requestId, clientType),
        };
      }

      const context: ApiAuthContext = {
        isAuthenticated: true,
        user: tokenUser,
        authMethod: 'bearer_token',
        token: {
          id: validation.tokenData.id,
          name: validation.tokenData.name,
          prefix: validation.tokenData.tokenPrefix,
          scopes: validation.tokenData.scopes,
        },
        scopes: validation.tokenData.scopes,
        requestId,
        clientType,
      };

      return { success: true, context };
    }

    // 2. Try Session Cookie (First-party Web App)
    try {
      let sessionUser = await getSessionUser();

      // In development/test environments, also inspect request cookies directly
      if (!sessionUser && isDemoAuthEnabled()) {
        const demoUserId = req.cookies.get('skillverse_demo_user')?.value;
        if (demoUserId) {
          const testUser = DUMMY_USERS.find((u) => u.id === demoUserId);
          if (testUser) {
            sessionUser = {
              id: testUser.id,
              email: testUser.email,
              username: testUser.username,
              name: testUser.name,
              role: testUser.role,
              avatarUrl: testUser.avatarUrl,
            } as any;
          }
        }
      }

      if (sessionUser && sessionUser.id) {
        const fullScopes: ApiScope[] = [
          'read:profile',
          'read:dcc',
          'read:skills',
          'read:evidence',
          'read:repositories',
          'write:repositories',
          'write:analysis',
          'read:opportunities',
          'write:applications',
          'read:challenges',
          'write:submissions',
          'read:teams',
          'write:webhooks',
        ];

        const context: ApiAuthContext = {
          isAuthenticated: true,
          user: {
            id: sessionUser.id,
            email: sessionUser.email,
            username: sessionUser.username || sessionUser.user_metadata?.user_name || 'developer',
            name: sessionUser.name || sessionUser.user_metadata?.full_name || 'Developer',
            role: sessionUser.role || 'developer',
            avatarUrl: sessionUser.avatarUrl || sessionUser.user_metadata?.avatar_url,
          },
          authMethod: 'session_cookie',
          scopes: fullScopes,
          requestId,
          clientType: clientType === 'api' ? 'web' : clientType,
        };

        return { success: true, context };
      }
    } catch {}

    // 3. Unauthenticated request
    return {
      success: false,
      errorStatus: 401,
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Authentication required. Please provide a valid Bearer token or session cookie.',
      context: this.createEmptyContext(requestId, clientType),
    };
  }

  /**
   * Helper to verify required permission scope
   */
  public static hasScope(context: ApiAuthContext, requiredScope: ApiScope): boolean {
    if (!context.isAuthenticated) return false;
    if (context.scopes.includes('admin:all')) return true;
    return context.scopes.includes(requiredScope);
  }

  private static createEmptyContext(requestId: string, clientType: ApiClientType): ApiAuthContext {
    return {
      isAuthenticated: false,
      user: {
        id: '',
        username: 'anonymous',
        name: 'Anonymous',
        role: 'anonymous',
      },
      authMethod: 'none',
      scopes: [],
      requestId,
      clientType,
    };
  }

  private static async resolveUserById(userId: string): Promise<{
    id: string;
    email?: string;
    username: string;
    name: string;
    role: string;
    avatarUrl?: string;
  } | null> {
    let dbUser: any = null;
    try {
      dbUser = await withDbTimeout(
        db.query.users.findFirst({
          where: eq(users.id, userId),
        }),
        3000
      );
    } catch {}

    if (dbUser) {
      return {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        name: dbUser.name || dbUser.username,
        role: dbUser.role || 'developer',
        avatarUrl: dbUser.avatarUrl,
      };
    }

    if (isDemoAuthEnabled()) {
      const dummy = getDummyUserById(userId);
      if (dummy) {
        return {
          id: dummy.id,
          email: dummy.email,
          username: dummy.username,
          name: dummy.name,
          role: dummy.role,
          avatarUrl: dummy.avatarUrl,
        };
      }
    }

    return null;
  }
}
