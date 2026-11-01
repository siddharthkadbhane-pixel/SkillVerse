import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { users, privacySettings } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DCCEvidenceService } from '@/services/dcc/evidence';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const skill = searchParams.get('skill');

    let targetUserId: string;
    let isPublicRequest = false;

    if (username) {
      isPublicRequest = true;
      let foundUser: any = null;
      try {
        foundUser = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
      } catch (err: any) {
        Logger.warn(`DB read error fetching user by username: ${err.message}`);
      }

      if (!foundUser) {
        return NextResponse.json(
          { success: false, error: 'User not found.' },
          { status: 404 }
        );
      }

      targetUserId = foundUser.id;

      // Check privacy settings
      try {
        const privacy = await db.query.privacySettings.findFirst({
          where: eq(privacySettings.userId, foundUser.id),
        });

        if (privacy && privacy.profileVisibility === 'private') {
          return NextResponse.json(
            { success: false, error: 'User profile is private.' },
            { status: 403 }
          );
        }
      } catch {}
    } else {
      const auth = await AuthorizationGuard.requireAuth(request);
      if (!auth.authorized) {
        return auth.response!;
      }
      targetUserId = auth.context.user.id;
    }

    if (skill) {
      const detail = await DCCEvidenceService.getSkillVerificationDetail(
        targetUserId,
        skill,
        isPublicRequest
      );

      if (!detail) {
        return NextResponse.json(
          { 
            success: true, 
            data: {
              skillName: skill,
              category: 'General',
              level: 0,
              status: 'insufficient_evidence',
              evidenceStrength: 'weak',
              confidence: 0,
              whyVerified: `No verified evidence has been recorded for ${skill} yet. Analyze a repository using this skill to verify.`,
              lastVerifiedDate: 'Never',
              evidenceCount: 0,
              analyzedReposCount: 0,
              evidenceList: [],
            }
          }
        );
      }

      return NextResponse.json({
        success: true,
        data: detail,
      });
    }

    // If no specific skill requested, return all verified skills with evidence metadata
    const compiledSkills = await DCCEvidenceService.compileVerifiedSkills(targetUserId);

    return NextResponse.json({
      success: true,
      data: {
        skills: compiledSkills,
        totalVerified: compiledSkills.filter(s => s.status === 'verified').length,
        totalSupported: compiledSkills.filter(s => s.status === 'supported').length,
        totalDetected: compiledSkills.filter(s => s.status === 'detected').length,
      },
    });
  } catch (error: any) {
    Logger.error(`Evidence API error: ${error.message}`);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve capability evidence.' },
      { status: 500 }
    );
  }
}
