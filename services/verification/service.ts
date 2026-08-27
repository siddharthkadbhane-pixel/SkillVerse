import { db } from '@/lib/drizzle';
import { verificationRequests, userSkills, trustScores, users } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class GlobalVerificationService {

  // Partner requests permission-based access to developer's verified skills & trust score (Module 2)
  static async requestAccess(userId: string, partnerId: string, requestedFields: string[]): Promise<any> {
    Logger.info(`Partner ${partnerId} requesting verification access for developer ${userId}`);

    const [req] = await db
      .insert(verificationRequests)
      .values({
        userId,
        partnerId,
        requestedData: requestedFields,
        status: 'pending',
      })
      .returning();

    return req;
  }

  // Developer approves the access request (Module 10)
  static async approveAccess(requestId: string): Promise<boolean> {
    try {
      await db
        .update(verificationRequests)
        .set({ status: 'approved' })
        .where(eq(verificationRequests.id, requestId));
      Logger.info(`Access request ${requestId} approved by developer`);
      return true;
    } catch {
      return false;
    }
  }

  // Partner verifies the developer details after consent (Module 2)
  static async verifyDeveloper(partnerId: string, developerId: string): Promise<any> {
    Logger.info(`Executing verification request check for developer ${developerId} by partner ${partnerId}`);

    // Check if approved request exists
    const approval = await db.query.verificationRequests.findFirst({
      where: and(
        eq(verificationRequests.userId, developerId),
        eq(verificationRequests.partnerId, partnerId),
        eq(verificationRequests.status, 'approved')
      ),
    });

    if (!approval) {
      throw new Error('Access denied: no approved verification request found.');
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, developerId),
    });

    const trust = await db.query.trustScores.findFirst({
      where: eq(trustScores.userId, developerId),
    });

    const skills = await db.query.userSkills.findMany({
      where: eq(userSkills.userId, developerId),
    });

    return {
      verified: true,
      verificationBadge: 'Verified by SkillVerse Standard (v1.0)',
      timestamp: new Date().toISOString(),
      developer: {
        username: dbUser?.username,
        name: dbUser?.name,
      },
      trustScore: trust?.overallScore || 0,
      skills: skills.map((s: any) => ({ skillId: s.skillId, level: s.proficiencyLevel || 3 })),
    };
  }
}

export default GlobalVerificationService;
