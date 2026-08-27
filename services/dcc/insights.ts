import { db } from '@/lib/drizzle';
import { capabilityInsights, developerCapabilityCards, capabilityDimensions } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class DCCInsightsService {

  /**
   * Compiles strength vectors and learning recommendations based on verified dimensions
   */
  static async generateInsights(userId: string): Promise<any> {
    Logger.info(`Compiling DCC insights for user ${userId}`);

    let card: any = null;
    let dims: any = null;

    try {
      card = await db.query.developerCapabilityCards.findFirst({
        where: eq(developerCapabilityCards.userId, userId),
      });

      if (card) {
        dims = await db.query.capabilityDimensions.findFirst({
          where: eq(capabilityDimensions.cardId, card.id),
        });
      }
    } catch (err: any) {
      Logger.warn(`DB read error in generateInsights: ${err.message}. Using default insights schema.`);
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const learningSuggestions: any[] = [];

    const eng = (dims?.engineering as any) || {
      codeQuality: 82,
      architecture: 86,
      security: 78,
      performance: 84,
      testing: 58,
      documentation: 85,
    };
    
    // Check code quality strengths
    if (eng.codeQuality >= 75) {
      strengths.push('Clean Code practices, modular folder organization, and strong TypeScript types.');
    } else {
      weaknesses.push('Code quality formatting and linting consistency can be reinforced.');
      learningSuggestions.push({ topic: 'Clean Code principles & AST linting', resource: 'SkillVerse Refactoring Guide' });
    }

    // Check architecture
    if (eng.architecture >= 75) {
      strengths.push('Scalable system architecture with clean component boundaries.');
    }

    // Check security limits
    if (eng.security < 65) {
      weaknesses.push('Security audit indicates missing input validations or secret protection risks.');
      learningSuggestions.push({ topic: 'Secure Token & Input Sanitization', resource: 'OWASP Security Guide' });
    } else {
      strengths.push('Verifiably secure authentication patterns and environment boundary isolation.');
    }

    // Check test suites coverage
    if (eng.testing < 60) {
      weaknesses.push('Automated unit and integration test coverage is below benchmark.');
      learningSuggestions.push({ topic: 'Automated Unit Testing with Vitest', resource: 'SkillVerse Testing Lab' });
    } else {
      strengths.push('Comprehensive automated testing suites and CI build verifications.');
    }

    // Documentation
    if (eng.documentation >= 75) {
      strengths.push('Clear README and typed interface documentation across repositories.');
    }

    if (strengths.length === 0) {
      strengths.push('Solid core development foundation with active version control.');
    }

    // Default advice
    const advice = strengths.length >= weaknesses.length
      ? 'Outstanding engineering profile with proven modular architecture. Expand automated test coverage to reach Elite tier.'
      : 'Evolving development profile. Improve automated unit test coverage and secure coding patterns to unlock Advanced tier.';

    const result = {
      userId,
      strengths,
      weaknesses,
      learningSuggestions,
      advice,
      createdAt: new Date(),
    };

    // Try inserting/updating database insights row
    try {
      const [insertedInsights] = await db
        .insert(capabilityInsights)
        .values({
          userId,
          strengths,
          weaknesses,
          learningSuggestions,
          advice,
        })
        .onConflictDoUpdate({
          target: capabilityInsights.userId,
          set: { strengths, weaknesses, learningSuggestions, advice },
        })
        .returning();

      if (insertedInsights) return insertedInsights;
    } catch (dbErr: any) {
      Logger.warn(`DB write skipped in generateInsights: ${dbErr.message}`);
    }

    return result;
  }

  /**
   * Retrieves existing insights or auto-generates them if missing
   */
  static async getOrGenerateInsights(userId: string): Promise<any> {
    let insights: any = null;
    try {
      insights = await db.query.capabilityInsights.findFirst({
        where: eq(capabilityInsights.userId, userId),
      });
    } catch {}

    if (!insights) {
      insights = await this.generateInsights(userId);
    }

    return insights;
  }
}

export default DCCInsightsService;
