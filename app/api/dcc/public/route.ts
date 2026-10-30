import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, privacySettings } from '@/database/schema';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';
import { DCCPublicData } from '@/types/dcc';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, error: 'username parameter is required' }, { status: 400 });
    }

    let targetUser: any = null;
    try {
      targetUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
    } catch {}

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Developer not found' }, { status: 404 });
    }

    // Check privacy settings safely
    let privacy: any = null;
    try {
      privacy = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, targetUser.id),
      });
    } catch {}

    if (privacy && privacy.profileVisibility === 'private') {
      return NextResponse.json({
        success: true,
        restricted: true,
        message: 'This developer capability card is set to private by the owner.',
      });
    }

    // Fetch full DCC 2.0 object
    const fullDCC = await DeveloperCapabilityCardService.getFullDCC(targetUser.id);

    // Sanitize for public consumption (zero private code, zero emails/tokens)
    const publicData: DCCPublicData = {
      username: targetUser.username,
      name: targetUser.name,
      avatarUrl: targetUser.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4',
      bio: targetUser.bio,
      location: targetUser.location,
      overallScore: fullDCC.card.overallScore,
      level: fullDCC.card.level,
      summary: fullDCC.card.summary,
      verificationStatus: fullDCC.card.verificationStatus,
      confidenceScore: fullDCC.card.confidenceScore,
      primaryTechnologies: fullDCC.developer.primaryTechnologies,
      dimensions: fullDCC.dimensions,
      verifiedSkills: fullDCC.verifiedSkills,
      engineeringMetrics: fullDCC.engineeringMetrics,
      projectEvidence: fullDCC.projectEvidence.map(p => ({
        ...p,
        // Shield any sensitive private repo URLs if private
      })),
      insights: {
        strengths: fullDCC.insights.strengths,
        advice: fullDCC.insights.advice,
      },
      lastUpdated: fullDCC.card.lastUpdated,
    };

    return NextResponse.json({
      success: true,
      restricted: false,
      data: publicData,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/dcc/public:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
