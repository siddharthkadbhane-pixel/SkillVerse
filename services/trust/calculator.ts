import { db } from '@/lib/drizzle';
import { repositories, reviews, trustScores, trustHistory, users } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { DEFAULT_TRUST_WEIGHTS, TRUST_ENGINE_VERSION } from './config';
import { TrustCategoryScores, TrustScoreDetails, ImprovementSuggestion } from './types';

export class TrustCalculatorService {
  
  // Helper to extract numeric score from string representations in reviews table
  private static parseScoreFromString(str: string | undefined | null, type: string): number {
    if (!str) return 60; // Default fallback score
    const regex = new RegExp(`${type}:?\\s*(\\d+)/100`, 'i');
    const match = str.match(regex);
    return match ? parseInt(match[1], 10) : 60;
  }

  // Calculate commit activity score based on summary development activity
  private static getGitActivityScore(devActivity: string | undefined): number {
    if (devActivity === 'High') return 95;
    if (devActivity === 'Medium') return 75;
    return 45;
  }

  // Master method to recalculate developer trust score
  static async calculateUserTrustScore(userId: string): Promise<TrustScoreDetails> {
    // 1. Fetch analyzed repositories for user
    const analyzedRepos = await db.query.repositories.findMany({
      where: and(
        eq(repositories.userId, userId),
        eq(repositories.isAnalyzed, true)
      ),
    });

    const weights = DEFAULT_TRUST_WEIGHTS;

    // Fallback baseline if no repositories analyzed yet
    if (analyzedRepos.length === 0) {
      const fallbackScores: TrustCategoryScores = {
        codeQuality: 0,
        maintainability: 0,
        security: 0,
        performance: 0,
        testing: 0,
        gitActivity: 0,
        documentation: 0,
      };

      const fallbackDetails: TrustScoreDetails = {
        overallScore: 150, // Baseline start score
        categoryScores: fallbackScores,
        weightValues: weights,
        confidence: 10,
        engineVersion: TRUST_ENGINE_VERSION,
        explanation: 'Baseline Trust Score assigned. Import and analyze a repository to generate verified evidence.',
        suggestions: [
          {
            category: 'codeQuality',
            message: 'Connect your GitHub and trigger an analysis on a repository to verify your code quality.',
            score: 0,
            priority: 'High',
          }
        ]
      };

      // Upsert into trust_scores
      await db
        .insert(trustScores)
        .values({
          userId,
          overallScore: fallbackDetails.overallScore,
          projectScore: 0,
          contributionScore: 150,
          categoryScores: fallbackDetails.categoryScores,
          weightValues: fallbackDetails.weightValues,
          confidence: fallbackDetails.confidence,
          engineVersion: fallbackDetails.engineVersion,
          explanation: fallbackDetails.explanation,
        })
        .onConflictDoUpdate({
          target: trustScores.userId,
          set: {
            overallScore: fallbackDetails.overallScore,
            categoryScores: fallbackDetails.categoryScores,
            confidence: fallbackDetails.confidence,
            explanation: fallbackDetails.explanation,
            updatedAt: new Date(),
          }
        });

      return fallbackDetails;
    }

    // 2. Fetch AI Reviews for each repository and accumulate scores
    let totalCodeQuality = 0;
    let totalMaintainability = 0;
    let totalSecurity = 0;
    let totalPerformance = 0;
    let totalTesting = 0;
    let totalDocumentation = 0;
    let totalGitActivity = 0;
    let validReviewsCount = 0;

    for (const repo of analyzedRepos) {
      const reviewRecord = await db.query.reviews.findFirst({
        where: eq(reviews.repositoryId, repo.id),
      });

      if (reviewRecord) {
        totalCodeQuality += this.parseScoreFromString(reviewRecord.codeQuality, 'Code Quality');
        totalMaintainability += this.parseScoreFromString(reviewRecord.codeQuality, 'Maintainability');
        totalSecurity += this.parseScoreFromString(reviewRecord.bestPractices, 'Security');
        totalPerformance += this.parseScoreFromString(reviewRecord.bestPractices, 'Performance');
        totalTesting += this.parseScoreFromString(reviewRecord.bestPractices, 'Testing');
        totalDocumentation += this.parseScoreFromString(reviewRecord.documentation, 'Documentation rating is');
        totalGitActivity += this.getGitActivityScore(repo.summary?.developmentActivity);
        validReviewsCount++;
      }
    }

    // Fallback if records exist but reviews are missing
    if (validReviewsCount === 0) {
      validReviewsCount = 1; // prevent divide-by-zero, averages stay at default 60
      totalCodeQuality = 60;
      totalMaintainability = 60;
      totalSecurity = 60;
      totalPerformance = 60;
      totalTesting = 60;
      totalDocumentation = 60;
      totalGitActivity = 60;
    }

    // Compute category averages
    const categoryScores: TrustCategoryScores = {
      codeQuality: Math.round(totalCodeQuality / validReviewsCount),
      maintainability: Math.round(totalMaintainability / validReviewsCount),
      security: Math.round(totalSecurity / validReviewsCount),
      performance: Math.round(totalPerformance / validReviewsCount),
      testing: Math.round(totalTesting / validReviewsCount),
      gitActivity: Math.round(totalGitActivity / validReviewsCount),
      documentation: Math.round(totalDocumentation / validReviewsCount),
    };

    // Calculate overall project average (0-100 scale)
    const weightedAvg = 
      categoryScores.codeQuality * weights.codeQuality +
      categoryScores.maintainability * weights.maintainability +
      categoryScores.security * weights.security +
      categoryScores.performance * weights.performance +
      categoryScores.testing * weights.testing +
      categoryScores.documentation * weights.documentation +
      categoryScores.gitActivity * weights.gitActivity;

    // Scale to 0-1000 overall trust score
    const overallScore = Math.min(1000, Math.max(100, Math.round(weightedAvg * 10)));
    
    // Confidence calculation (capped at 100)
    const confidence = Math.min(100, Math.round(validReviewsCount * 35 + 15));

    // Explanation generator
    const explanation = `Trust Score of ${overallScore} calculated from audit evidence of ${validReviewsCount} verified repositories. Strength detected in ${
      categoryScores.codeQuality >= 80 ? 'Code Modularity' : 'General layouts'
    } with a confidence index of ${confidence}%.`;

    // Suggestions generator based on low categories
    const suggestions: ImprovementSuggestion[] = [];
    if (categoryScores.testing < 70) {
      suggestions.push({
        category: 'testing',
        message: 'Write automated unit tests (Jest/Vitest) to verify edge behaviors and boost test score.',
        score: categoryScores.testing,
        priority: categoryScores.testing < 40 ? 'High' : 'Medium',
      });
    }
    if (categoryScores.security < 70) {
      suggestions.push({
        category: 'security',
        message: 'Ensure environment variables are strictly validated and avoid committing sensitive keys.',
        score: categoryScores.security,
        priority: categoryScores.security < 40 ? 'High' : 'Medium',
      });
    }
    if (categoryScores.documentation < 70) {
      suggestions.push({
        category: 'documentation',
        message: 'Expand your README.md detailing project architecture, configuration steps, and start guides.',
        score: categoryScores.documentation,
        priority: 'Medium',
      });
    }
    if (categoryScores.maintainability < 70) {
      suggestions.push({
        category: 'maintainability',
        message: 'Improve modular decoupling and isolate third-party service connections.',
        score: categoryScores.maintainability,
        priority: 'Medium',
      });
    }

    // Default suggestion if everything is perfect
    if (suggestions.length === 0) {
      suggestions.push({
        category: 'gitActivity',
        message: 'Maintain consistent commit history and contribution frequency to sustain score metrics.',
        score: categoryScores.gitActivity,
        priority: 'Low',
      });
    }

    // 3. Save calculated metrics to database (trust_scores table)
    await db
      .insert(trustScores)
      .values({
        userId,
        overallScore,
        projectScore: Math.round(weightedAvg * 10),
        categoryScores,
        weightValues: weights,
        confidence,
        engineVersion: TRUST_ENGINE_VERSION,
        explanation,
      })
      .onConflictDoUpdate({
        target: trustScores.userId,
        set: {
          overallScore,
          projectScore: Math.round(weightedAvg * 10),
          categoryScores,
          weightValues: weights,
          confidence,
          engineVersion: TRUST_ENGINE_VERSION,
          explanation,
          updatedAt: new Date(),
        }
      });

    // 4. Save recalculation log to database (trust_history table)
    await db.insert(trustHistory).values({
      userId,
      overallScore,
      categoryScores,
      engineVersion: TRUST_ENGINE_VERSION,
      explanation,
    });

    return {
      overallScore,
      categoryScores,
      weightValues: weights,
      confidence,
      engineVersion: TRUST_ENGINE_VERSION,
      explanation,
      suggestions,
    };
  }
}
export default TrustCalculatorService;
