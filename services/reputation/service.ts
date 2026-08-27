import { db } from '@/lib/drizzle';
import { reputationScores, repositories, reviews, userSkills } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class ReputationService {

  // Calculates and updates the 6 reputation categories for a user
  static async calculateReputation(userId: string): Promise<any> {
    try {
      Logger.info(`Calculating reputation scores for user: ${userId}`);

      // 1. Fetch repositories and reviews
      const repos = await db.query.repositories.findMany({
        where: eq(repositories.userId, userId),
      });

      const analyzedCount = repos.filter(r => r.isAnalyzed).length;

      // 2. Fetch skills
      const skillsCount = await db.query.userSkills.findMany({
        where: eq(userSkills.userId, userId),
      });

      // 3. Compute Engineering Reputation
      let sumHealth = 0;
      for (const r of repos) {
        const review = await db.query.reviews.findFirst({
          where: eq(reviews.repositoryId, r.id),
        });
        if (review) {
          sumHealth += review.overallScore || 70;
        }
      }
      const avgHealth = repos.length > 0 && sumHealth > 0 ? Math.round(sumHealth / repos.length) : 70;
      const engineeringRep = Math.min(1000, Math.max(100, avgHealth * 8 + (analyzedCount * 20)));

      // 4. Compute other category reputations (using mocked activities or proportional weights)
      const openSourceRep = Math.min(1000, Math.max(100, 450 + (analyzedCount * 45)));
      const communityRep = Math.min(1000, Math.max(100, 300 + (skillsCount.length * 30)));
      const mentorshipRep = Math.min(1000, Math.max(100, 400 + (repos.length * 25)));
      const learningRep = Math.min(1000, Math.max(100, 500 + (skillsCount.length * 40)));
      const challengeRep = Math.min(1000, Math.max(100, 350 + (analyzedCount * 50)));

      const payload = {
        userId,
        engineering: engineeringRep,
        community: communityRep,
        mentorship: mentorshipRep,
        openSource: openSourceRep,
        learning: learningRep,
        challenge: challengeRep,
        updatedAt: new Date(),
      };

      const existing = await db.query.reputationScores.findFirst({
        where: eq(reputationScores.userId, userId),
      });

      if (existing) {
        await db
          .update(reputationScores)
          .set(payload)
          .where(eq(reputationScores.id, existing.id));
      } else {
        await db.insert(reputationScores).values(payload);
      }

      Logger.info(`Updated reputation scores: Engineering=${engineeringRep}, OS=${openSourceRep}`);
      return payload;
    } catch (err) {
      Logger.error('Failed to calculate reputation scores', err);
      return null;
    }
  }
}

export default ReputationService;
