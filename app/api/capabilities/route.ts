import { NextRequest, NextResponse } from 'next/server';
import { SkillIntelligenceService } from '@/services/capability/engine';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (username) {
      const publicCapabilities = await SkillIntelligenceService.getPublicDeveloperCapabilities(username);
      return NextResponse.json({
        success: true,
        data: publicCapabilities,
      });
    }

    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const targetUserId = auth.context.user.id;

    const capabilities = await SkillIntelligenceService.getDeveloperCapabilities(targetUserId);

    return NextResponse.json({
      success: true,
      data: capabilities,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/capabilities:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while fetching engineering capabilities.',
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const targetUserId = auth.context.user.id;

    const calculatedCapabilities = await SkillIntelligenceService.calculateDeveloperCapabilities(targetUserId);

    return NextResponse.json({
      success: true,
      data: calculatedCapabilities,
      message: `Recalculated ${calculatedCapabilities.length} engineering capabilities.`,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/capabilities:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while recalculating engineering capabilities.',
    }, { status: 500 });
  }
}
