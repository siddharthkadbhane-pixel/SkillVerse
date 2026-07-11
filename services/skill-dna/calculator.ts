import { db } from '@/lib/drizzle';
import { repositories, reviews, skillDna, skillHistory } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { getSkillCategory } from './categories';
import { SkillItem, SkillCategorySummary, SkillDnaProfile, SkillEvidenceDetail, LearningRecommendation } from './types';

export class SkillDnaCalculatorService {
  private static ENGINE_VERSION = '1.0.0';

  // Master method to recalculate developer's Skill DNA
  static async calculateSkillDna(userId: string): Promise<SkillDnaProfile> {
    // 1. Fetch analyzed repositories and their reviews
    const repos = await db.query.repositories.findMany({
      where: and(
        eq(repositories.userId, userId),
        eq(repositories.isAnalyzed, true)
      ),
    });

    const skillMap = new Map<string, {
      levels: number[];
      repoCount: number;
      evidenceCount: number;
      lastVerified: string;
    }>();

    // Collect skills and reviews data
    for (const repo of repos) {
      const reviewRecord = await db.query.reviews.findFirst({
        where: eq(reviews.repositoryId, repo.id),
      });

      if (!reviewRecord) continue;

      let parsedAiOutput: any = null;
      try {
        parsedAiOutput = JSON.parse(reviewRecord.rawAiOutput || '{}');
      } catch {}

      const detectedSkills = parsedAiOutput?.skills || [];
      const repoQuality = reviewRecord.overallScore || 70;
      
      // Parse code quality score if available
      const cqMatch = reviewRecord.codeQuality?.match(/Quality:\s*(\d+)/i);
      const codeQualityScore = cqMatch ? parseInt(cqMatch[1], 10) : 75;

      for (const skill of detectedSkills) {
        const name = skill.name;
        const rawLevel = skill.level || 3; // 1-5 scale
        
        // Calculate level 0-100 weighted by codebase quality
        const skillLevel = Math.min(100, Math.max(10, Math.round(
          (repoQuality * 0.4 + codeQualityScore * 0.6) * (rawLevel / 5)
        )));

        const existing = skillMap.get(name);
        if (existing) {
          existing.levels.push(skillLevel);
          existing.repoCount++;
          existing.evidenceCount += (repo.stars > 50 ? 3 : 2); // Star weighting
          if (repo.analyzedAt && new Date(repo.analyzedAt).getTime() > new Date(existing.lastVerified).getTime()) {
            existing.lastVerified = repo.analyzedAt.toISOString();
          }
        } else {
          skillMap.set(name, {
            levels: [skillLevel],
            repoCount: 1,
            evidenceCount: (repo.stars > 50 ? 3 : 2),
            lastVerified: repo.analyzedAt ? repo.analyzedAt.toISOString() : new Date().toISOString(),
          });
        }
      }
    }

    // Fetch previous DNA structure to calculate growth trend
    const existingDna = await db.query.skillDna.findFirst({
      where: eq(skillDna.userId, userId),
    });

    const previousSkillsMap = new Map<string, number>();
    if (existingDna) {
      const structure = existingDna.dnaStructure as any;
      const prevSkillsList = structure?.skills || [];
      prevSkillsList.forEach((s: any) => {
        previousSkillsMap.set(s.name, s.level);
      });
    }

    // Compile skills array
    const compiledSkills: SkillItem[] = [];
    const categorySums: Record<string, { total: number; count: number }> = {};

    for (const [name, data] of skillMap.entries()) {
      const category = getSkillCategory(name);
      const avgLevel = Math.round(data.levels.reduce((a, b) => a + b, 0) / data.levels.length);
      const confidence = Math.min(100, Math.round(data.repoCount * 30 + 20));
      
      const prevLevel = previousSkillsMap.get(name) || 0;
      const growthTrend = prevLevel > 0 ? avgLevel - prevLevel : 0;

      compiledSkills.push({
        name,
        category,
        level: avgLevel,
        confidence,
        evidenceCount: data.evidenceCount,
        repositoryCount: data.repoCount,
        lastVerified: data.lastVerified,
        growthTrend,
        verificationStatus: 'verified',
      });

      // Accumulate for category summaries
      if (categorySums[category]) {
        categorySums[category].total += avgLevel;
        categorySums[category].count++;
      } else {
        categorySums[category] = { total: avgLevel, count: 1 };
      }

      // Log growth logs in skill_history table if changed significantly
      if (prevLevel > 0 && Math.abs(avgLevel - prevLevel) >= 1) {
        await db.insert(skillHistory).values({
          userId,
          skillName: name,
          category,
          previousLevel: prevLevel,
          currentLevel: avgLevel,
          growthPercent: avgLevel - prevLevel,
          version: this.ENGINE_VERSION,
        });
      }
    }

    // Compile category summaries list
    const categorySummaries: SkillCategorySummary[] = Object.entries(categorySums).map(
      ([catName, sums]) => ({
        name: catName,
        averageLevel: Math.round(sums.total / sums.count),
        skillsCount: sums.count,
      })
    );

    // Compute overall level average across all skills
    const overallLevel = compiledSkills.length > 0
      ? Math.round(compiledSkills.reduce((sum, s) => sum + s.level, 0) / compiledSkills.length)
      : 0;

    const profile: SkillDnaProfile = {
      overallLevel,
      skills: compiledSkills.sort((a, b) => b.level - a.level),
      categorySummaries: categorySummaries.sort((a, b) => b.averageLevel - a.averageLevel),
      lastUpdated: new Date().toISOString(),
      engineVersion: this.ENGINE_VERSION,
    };

    // Save/Update skillDna structure
    await db
      .insert(skillDna)
      .values({
        userId,
        dnaStructure: profile,
      })
      .onConflictDoUpdate({
        target: skillDna.userId,
        set: {
          dnaStructure: profile,
          updatedAt: new Date(),
        }
      });

    return profile;
  }

  // Fetch verified repositories and AI reviews backing user's skills
  static async collectSkillsEvidence(userId: string): Promise<SkillEvidenceDetail[]> {
    const repos = await db.query.repositories.findMany({
      where: and(
        eq(repositories.userId, userId),
        eq(repositories.isAnalyzed, true)
      ),
    });

    const evidenceList: SkillEvidenceDetail[] = [];

    for (const repo of repos) {
      const reviewRecord = await db.query.reviews.findFirst({
        where: eq(reviews.repositoryId, repo.id),
      });

      if (!reviewRecord) continue;

      let parsedAiOutput: any = null;
      try {
        parsedAiOutput = JSON.parse(reviewRecord.rawAiOutput || '{}');
      } catch {}

      const detectedSkills = parsedAiOutput?.skills || [];
      for (const skill of detectedSkills) {
        evidenceList.push({
          skillName: skill.name,
          repoName: repo.name,
          fullName: repo.fullName,
          htmlUrl: repo.htmlUrl,
          evidenceSource: 'ai_review',
          qualityScore: reviewRecord.overallScore,
          lastVerified: repo.analyzedAt ? repo.analyzedAt.toISOString() : new Date().toISOString(),
        });
      }
    }

    return evidenceList;
  }

  // Generate learning recommendations based on low skill levels or missing areas
  static getLearningRecommendations(profile: SkillDnaProfile): LearningRecommendation[] {
    const possessSkills = new Set(profile.skills.map(s => s.name.toLowerCase()));
    const recommendations: LearningRecommendation[] = [];

    // Check for missing key technologies
    if (!possessSkills.has('typescript')) {
      recommendations.push({
        title: 'Learn TypeScript and type safety principles',
        description: 'Establish type safety boundaries, compile strict rules, and integrate Zod validations in your configurations.',
        category: 'Programming Languages',
        difficulty: 'Intermediate',
        priority: 'High',
      });
    }

    if (!possessSkills.has('docker')) {
      recommendations.push({
        title: 'Containerize codebases with Docker',
        description: 'Write Dockerfiles and docker-compose configurations to establish isolated development environments.',
        category: 'Cloud & DevOps',
        difficulty: 'Intermediate',
        priority: 'Medium',
      });
    }

    if (!possessSkills.has('testing')) {
      recommendations.push({
        title: 'Integrate automated unit testing (Jest / Vitest)',
        description: 'Set up Vitest/Jest test suites, configure mock boundaries, and write unit assertions.',
        category: 'Software Engineering',
        difficulty: 'Intermediate',
        priority: 'High',
      });
    }

    // Check possessed skills for improvement advice
    profile.skills.forEach(skill => {
      if (skill.level < 50) {
        if (skill.name === 'React' || skill.name === 'Next.js') {
          recommendations.push({
            title: `Optimize ${skill.name} component rendering`,
            description: `Study code division limits and rendering boundaries in ${skill.name} to raise capability level.`,
            category: 'Frontend',
            difficulty: 'Intermediate',
            priority: 'Medium',
          });
        } else if (skill.category === 'Database') {
          recommendations.push({
            title: `Design indexes and index limits for ${skill.name}`,
            description: `Enhance database schema layouts and query structures utilizing ORM decorators.`,
            category: 'Database',
            difficulty: 'Advanced',
            priority: 'Medium',
          });
        }
      }
    });

    // Default suggestion
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Implement CI/CD automated test workflows',
        description: 'Set up GitHub Actions pipelines to automatically verify and test code on every commit pull request.',
        category: 'Cloud & DevOps',
        difficulty: 'Advanced',
        priority: 'Low',
      });
    }

    return recommendations.slice(0, 4); // return top 4
  }
}
export default SkillDnaCalculatorService;
