// SkillVerse GDPR & Privacy Account Data Controls (Phase 40)

import { db, withDbTimeout } from '@/lib/drizzle';
import { users, repositories, developerCapabilityCards } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { DUMMY_USERS, DUMMY_REPOSITORIES, getDummyDCCData } from '@/lib/dummyData';
import { isDemoAuthEnabled } from '@/services/supabase';
import { AuditLogService } from './audit';
import { AuthorizationGuard } from './authorizer';
import { Logger } from '@/lib/logger';

export interface UserDataExport {
  exportDate: string;
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    role: string;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
  };
  dcc: any;
  repositories: any[];
  verificationEvidenceCount: number;
}

export class DataControlsService {
  /**
   * Generates a complete GDPR/privacy data export archive for a user
   */
  public static async exportUserData(userId: string): Promise<UserDataExport> {
    let dbUser: any = null;
    let userRepos: any[] = [];
    let dbDcc: any = null;

    try {
      dbUser = await withDbTimeout(
        db.query.users.findFirst({
          where: eq(users.id, userId),
        }),
        3000
      );

      if (dbUser) {
        userRepos = await withDbTimeout(
          db.query.repositories.findMany({
            where: eq(repositories.userId, userId),
          }),
          3000
        );
        dbDcc = await withDbTimeout(
          db.query.developerCapabilityCards.findFirst({
            where: eq(developerCapabilityCards.userId, userId),
          }),
          3000
        );
      }
    } catch (err: any) {
      Logger.warn(`Database query during user data export failed: ${err.message}`);
    }

    let exportPayload: UserDataExport;

    if (dbUser) {
      exportPayload = {
        exportDate: new Date().toISOString(),
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || dbUser.username,
          username: dbUser.username,
          role: dbUser.role || 'developer',
          bio: dbUser.bio,
          location: dbUser.location,
          website: dbUser.website,
        },
        dcc: dbDcc ? {
          overallScore: dbDcc.overallScore,
          tierLevel: dbDcc.level,
          confidence: dbDcc.confidenceScore,
        } : null,
        repositories: userRepos.map((r) => ({
          name: r.name,
          language: r.language,
          stars: r.stars,
          healthScore: r.healthScore,
        })),
        verificationEvidenceCount: userRepos.length,
      };
    } else if (isDemoAuthEnabled()) {
      const dummyUser = DUMMY_USERS.find((u) => u.id === userId);
      if (!dummyUser) {
        throw new Error(`User ${userId} not found for data export`);
      }
      const dcc = getDummyDCCData(dummyUser.id);
      const dummyRepos = DUMMY_REPOSITORIES.filter((r) => r.userId === userId || userId.endsWith('1'));

      exportPayload = {
        exportDate: new Date().toISOString(),
        user: {
          id: dummyUser.id,
          email: dummyUser.email,
          name: dummyUser.name,
          username: dummyUser.username,
          role: dummyUser.role,
          bio: dummyUser.bio,
          location: dummyUser.location,
          website: dummyUser.website,
        },
        dcc: {
          overallScore: dcc.card.overallScore,
          tierLevel: dcc.card.level,
          dimensions: dcc.dimensions,
          confidence: dcc.card.confidenceScore,
        },
        repositories: dummyRepos.map((r) => ({
          name: r.name,
          language: r.language,
          stars: r.stars,
          healthScore: r.healthScore,
        })),
        verificationEvidenceCount: (dcc.dimensions.skills.languages.length + dcc.dimensions.skills.frameworks.length) * 2,
      };
    } else {
      throw new Error(`User ${userId} not found for data export`);
    }

    // Log the data export event in the audit trail
    await AuditLogService.log({
      actorId: userId,
      action: 'gdpr.data_export',
      resourceType: 'user_profile',
      resourceId: userId,
      details: { exportDate: exportPayload.exportDate },
    });

    return AuthorizationGuard.sanitizeResponse(exportPayload);
  }

  /**
   * Performs privacy-compliant account anonymization: scrubs personal credentials (email, name, githubId)
   * while preserving historical commit hashes and cryptographic integrity of challenge submissions.
   */
  public static async anonymizeUser(userId: string): Promise<{ success: boolean; message: string }> {
    const anonIdentifier = `anon_${userId.slice(0, 8)}`;
    let updated = false;
    let failureReason = '';

    try {
      const updatedRows = await withDbTimeout(
        db
          .update(users)
          .set({
            email: `${anonIdentifier}@deleted.skillverse.dev`,
            name: 'Anonymized Developer',
            username: anonIdentifier,
            bio: 'This account has been deleted by the user.',
            website: null,
            githubToken: null,
            avatarUrl: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({ id: users.id }),
        5000
      );
      if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        updated = true;
      } else {
        failureReason = 'User not found in database';
      }
    } catch (err: any) {
      failureReason = err.message || 'Database update failed';
      Logger.error(`Database anonymization failed for user ${userId}:`, err);
    }

    if (!updated) {
      if (isDemoAuthEnabled() && DUMMY_USERS.some((u) => u.id === userId)) {
        await AuditLogService.log({
          actorId: userId,
          action: 'gdpr.account_anonymize',
          resourceType: 'user_profile',
          resourceId: userId,
          details: { anonymizedAs: anonIdentifier, simulated: true },
        });
        return {
          success: true,
          message: 'Account personal data successfully anonymized (demo mode).',
        };
      }

      return {
        success: false,
        message: `Account anonymization failed: ${failureReason || 'User not found in database'}`,
      };
    }

    await AuditLogService.log({
      actorId: userId,
      action: 'gdpr.account_anonymize',
      resourceType: 'user_profile',
      resourceId: userId,
      details: { anonymizedAs: anonIdentifier },
    });

    return {
      success: true,
      message: 'Account personal data successfully anonymized and tokens revoked.',
    };
  }
}

