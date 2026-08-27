import { db } from '@/lib/drizzle';
import { certificates, repositories, reviews } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class CertificationService {

  // Issues a skill certificate backed by verified repository audit evidence (Module 6)
  static async issueCertificate(userId: string, title: string, repoId: string): Promise<any> {
    Logger.info(`Evaluating repository verification status for certification: ${title}`);

    // Verify repo exists and is analyzed
    const repo = await db.query.repositories.findFirst({
      where: and(
        eq(repositories.userId, userId),
        eq(repositories.id, repoId)
      ),
    });

    if (!repo || !repo.isAnalyzed) {
      throw new Error('Repository is not audited. Trigger code review before claiming certification.');
    }

    const review = await db.query.reviews.findFirst({
      where: eq(reviews.repositoryId, repoId),
    });

    if (!review || review.overallScore < 70) {
      throw new Error(`Repository overall audit score (${review?.overallScore || 0}) is below the required 70 threshold.`);
    }

    // Issue certificate
    const [cert] = await db
      .insert(certificates)
      .values({
        userId,
        title,
        evidenceRepoUrl: repo.htmlUrl || `https://github.com/${repo.fullName}`,
      })
      .returning();

    Logger.info(`Evidence Certificate issued successfully: ${cert.id}`);
    return cert;
  }
}

export default CertificationService;
