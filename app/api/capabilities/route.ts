import { NextRequest, NextResponse } from 'next/server';
import { SkillIntelligenceService } from '@/services/capability/engine';
import { getSessionUser } from '@/services/supabase';
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

    const sessionUser = await getSessionUser();
    const targetUserId = sessionUser?.id || '00000000-0000-0000-0000-000000000001';

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
    const sessionUser = await getSessionUser();
    const targetUserId = sessionUser?.id || '00000000-0000-0000-0000-000000000001';

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
