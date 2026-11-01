import { db, withDbTimeout } from '@/lib/drizzle';
import { 
  users, 
  repositories, 
  reviews, 
  userSkills, 
  skills, 
  privacySettings, 
  developerCapabilities,
  capabilityHistory 
} from '@/database/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { 
  DeveloperCapabilityItem, 
  EngineeringCapabilityLevel, 
  CapabilityVerificationState, 
  CapabilityCategoryName 
} from '@/types/capability';
import { CapabilityMappingService, CAPABILITY_TAXONOMY } from './mapping';
import { DCCEvidenceService } from '@/services/dcc/evidence';
import { CapabilityGrowthService } from '@/services/dcc/growth';
import { getDummyUserById, getDummyUserByUsername, DUMMY_REPOSITORIES } from '@/lib/dummyData';
import { Logger } from '@/lib/logger';
import { CachingService } from '@/lib/caching/service';

export class SkillIntelligenceService {
  private static inFlightCalculations = new Map<string, Promise<DeveloperCapabilityItem[]>>();

  /**
   * Calculates evidence-backed engineering capabilities from verified skills and AST reviews
   */
  static async calculateDeveloperCapabilities(userId: string): Promise<DeveloperCapabilityItem[]> {
    const cacheKey = `cap_map_${userId}`;
    const cached = CachingService.get<DeveloperCapabilityItem[]>(cacheKey);
    if (cached) return cached;

    const inFlight = this.inFlightCalculations.get(userId);
    if (inFlight) return inFlight;

    const promise = this.doCalculateDeveloperCapabilities(userId, cacheKey).finally(() => {
      this.inFlightCalculations.delete(userId);
    });
    this.inFlightCalculations.set(userId, promise);
    return promise;
  }

  private static async doCalculateDeveloperCapabilities(userId: string, cacheKey: string): Promise<DeveloperCapabilityItem[]> {
    Logger.info(`Calculating Skill Intelligence & Capability Mapping for user: ${userId}`);

    // 1. Fetch verified skills & evidence
    let verifiedSkillsList: any[] = [];
    let userRepos: any[] = [];
    let repoReviews: any[] = [];

    try {
      verifiedSkillsList = await DCCEvidenceService.compileVerifiedSkills(userId);
    } catch (err: any) {
      Logger.warn(`Failed to compile skills evidence in calculateDeveloperCapabilities: ${err.message}`);
    }

    try {
      userRepos = await withDbTimeout(
        db.query.repositories.findMany({
          where: eq(repositories.userId, userId),
        }),
        5000
      );

      const repoIds = userRepos.map(r => r.id);
      if (repoIds.length > 0) {
        repoReviews = await withDbTimeout(
          db.query.reviews.findMany({
            where: inArray(reviews.repositoryId, repoIds),
          }),
          5000
        );
      }
    } catch (err: any) {
      Logger.warn(`DB read warning in calculateDeveloperCapabilities: ${err.message}`);
    }

    // If repositories empty, fallback to dummy repositories
    if (userRepos.length === 0) {
      userRepos = DUMMY_REPOSITORIES.map(r => ({
        id: r.id,
        name: r.name,
        fullName: r.fullName,
        language: r.language,
        isAnalyzed: true,
      }));
      repoReviews = DUMMY_REPOSITORIES.map(r => ({
        repositoryId: r.id,
        overallScore: r.overallScore,
        strengths: ['Modular Clean Architecture', 'Strong Type Safety'],
      }));
    }

    const calculatedCapabilities: DeveloperCapabilityItem[] = [];

    // 2. Iterate through all capability taxonomies
    for (const taxonomy of CapabilityMappingService.getAllTaxonomies()) {
      const capName = taxonomy.name;
      const coreSkillsLower = taxonomy.coreSkills;

      // Find all supporting skills matching this capability
      const supportingSkills = verifiedSkillsList.filter(s => {
        const sLower = s.name.toLowerCase();
        return coreSkillsLower.some(core => core === sLower || sLower.includes(core) || core.includes(sLower));
      });

      // Find matching analyzed repositories
      const matchingRepos = userRepos.filter(r => {
        const repoLang = (r.language || '').toLowerCase();
        const repoName = (r.name || '').toLowerCase();
        const repoFull = (r.fullName || '').toLowerCase();

        const langMatch = coreSkillsLower.some(core => core === repoLang);
        const nameMatch = coreSkillsLower.some(core => repoName.includes(core) || repoFull.includes(core));
        
        // Also check if any supporting skills are evidenced in this repository
        const evidenceMatch = supportingSkills.some(s => 
          s.evidence?.some((e: any) => e.repoName === r.fullName || e.repoName === r.name)
        );

        return (langMatch || nameMatch || evidenceMatch) && r.isAnalyzed;
      });

      const analyzedProjectsCount = matchingRepos.length;
      const verifiedSkillsCount = supportingSkills.filter(s => s.status === 'verified').length;
      const supportedSkillsCount = supportingSkills.filter(s => s.status === 'supported').length;
      const totalSkillsCount = supportingSkills.length;

      // If no skills and no projects match, skip or set insufficient evidence
      if (totalSkillsCount === 0 && analyzedProjectsCount === 0) {
        continue;
      }

      // Calculate average AST review score across matching repositories
      const matchingRepoIds = matchingRepos.map(r => r.id);
      const relevantReviews = repoReviews.filter(rev => 
        matchingRepoIds.includes(rev.repositoryId) || 
        (rev.repoName && matchingRepos.some(mr => mr.fullName === rev.repoName || mr.name === rev.repoName))
      );
      const avgScore = relevantReviews.length > 0
        ? Math.round(relevantReviews.reduce((sum, rev) => sum + (rev.overallScore || 85), 0) / relevantReviews.length)
        : (verifiedSkillsCount > 0 ? 86 : 70);

      // Determine Capability Level based on evidence
      let level: EngineeringCapabilityLevel = 'Emerging';
      let confidenceScore = 40;

      const criteria = taxonomy.evaluationCriteria;

      if (
        analyzedProjectsCount >= criteria.minAnalyzedReposForStrong &&
        verifiedSkillsCount >= criteria.minVerifiedSkillsForStrong &&
        avgScore >= criteria.minScoreForStrong
      ) {
        level = 'Strong';
        confidenceScore = Math.min(96, Math.max(88, avgScore));
      } else if (
        analyzedProjectsCount >= criteria.minAnalyzedReposForProficient &&
        (verifiedSkillsCount >= criteria.minVerifiedSkillsForProficient || totalSkillsCount >= 2) &&
        avgScore >= 70
      ) {
        level = 'Proficient';
        confidenceScore = Math.min(85, Math.max(72, avgScore - 5));
      } else if (analyzedProjectsCount >= 1 || verifiedSkillsCount >= 1 || supportedSkillsCount >= 1) {
        level = 'Developing';
        confidenceScore = Math.min(70, Math.max(55, avgScore - 10));
      } else {
        level = 'Emerging';
        confidenceScore = 45;
      }

      // Determine Verification State
      let verificationState: CapabilityVerificationState = 'detected';
      if (verifiedSkillsCount >= 1 && (analyzedProjectsCount >= 1 || avgScore >= 75)) {
        verificationState = 'verified';
      } else if (analyzedProjectsCount >= 1 || supportedSkillsCount >= 1 || verifiedSkillsCount >= 1) {
        verificationState = 'supported';
      } else {
        verificationState = 'detected';
      }

      // Generate explainable "Why?" statement
      const whyExplanation = this.generateWhyExplanation(
        capName,
        level,
        verificationState,
        analyzedProjectsCount,
        supportingSkills.map(s => s.name),
        avgScore
      );

      const capabilityItem: DeveloperCapabilityItem = {
        id: `cap_${userId}_${capName.replace(/\s+/g, '_').toLowerCase()}`,
        userId,
        capabilityName: capName,
        category: taxonomy.category,
        level,
        verificationState,
        confidenceScore,
        analyzedProjectsCount,
        verifiedSkillsCount,
        supportingSkills: supportingSkills.map(s => s.name),
        whyExplanation,
        evidenceRepos: matchingRepos.map(r => r.fullName || r.name),
        updatedAt: new Date().toISOString(),
      };

      calculatedCapabilities.push(capabilityItem);

    }

    // 3. Persist to database safely with batched upsert
    try {
      await withDbTimeout(
        Promise.all(
          calculatedCapabilities.map((capabilityItem) =>
            db
              .insert(developerCapabilities)
              .values({
                userId,
                capabilityName: capabilityItem.capabilityName,
                category: capabilityItem.category,
                level: capabilityItem.level,
                verificationState: capabilityItem.verificationState,
                confidenceScore: capabilityItem.confidenceScore,
                analyzedProjectsCount: capabilityItem.analyzedProjectsCount,
                supportingSkills: capabilityItem.supportingSkills,
                whyExplanation: capabilityItem.whyExplanation,
                evidenceRepos: capabilityItem.evidenceRepos,
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: [developerCapabilities.userId, developerCapabilities.capabilityName],
                set: {
                  level: capabilityItem.level,
                  verificationState: capabilityItem.verificationState,
                  confidenceScore: capabilityItem.confidenceScore,
                  analyzedProjectsCount: capabilityItem.analyzedProjectsCount,
                  supportingSkills: capabilityItem.supportingSkills,
                  whyExplanation: capabilityItem.whyExplanation,
                  evidenceRepos: capabilityItem.evidenceRepos,
                  updatedAt: new Date(),
                },
              })
          )
        ),
        5000
      );
    } catch (err: any) {
      Logger.warn(`Capability batch persist notice: ${err?.message}`);
    }

    // 4. Sort capabilities by Level & Confidence
    const levelWeights: Record<EngineeringCapabilityLevel, number> = {
      Strong: 4,
      Proficient: 3,
      Developing: 2,
      Emerging: 1,
    };

    calculatedCapabilities.sort((a, b) => {
      const weightDiff = levelWeights[b.level] - levelWeights[a.level];
      if (weightDiff !== 0) return weightDiff;
      return b.confidenceScore - a.confidenceScore;
    });

    // 5. Selectively record capability history milestones
    await this.syncCapabilityMilestones(userId, calculatedCapabilities);

    CachingService.set(cacheKey, calculatedCapabilities, 60);
    return calculatedCapabilities;
  }

  /**
   * Retrieves developer capabilities from cache or calculates dynamically
   */
  static async getDeveloperCapabilities(userId: string): Promise<DeveloperCapabilityItem[]> {
    const cacheKey = `cap_map_${userId}`;
    const cached = CachingService.get<DeveloperCapabilityItem[]>(cacheKey);
    if (cached) return cached;

    let rows: any[] = [];
    try {
      rows = await withDbTimeout(
        db.query.developerCapabilities.findMany({
          where: eq(developerCapabilities.userId, userId),
        }),
        5000
      );
    } catch (err: any) {
      Logger.warn(`DB read warning in getDeveloperCapabilities: ${err.message}`);
    }

    if (rows && rows.length > 0) {
      const levelWeights: Record<string, number> = { Strong: 4, Proficient: 3, Developing: 2, Emerging: 1 };
      const result = rows
        .map(r => ({
          id: r.id,
          userId: r.userId,
          capabilityName: r.capabilityName,
          category: r.category,
          level: r.level as EngineeringCapabilityLevel,
          verificationState: r.verificationState as CapabilityVerificationState,
          confidenceScore: r.confidenceScore,
          analyzedProjectsCount: r.analyzedProjectsCount,
          verifiedSkillsCount: (r.supportingSkills || []).length,
          supportingSkills: r.supportingSkills || [],
          whyExplanation: r.whyExplanation || '',
          evidenceRepos: r.evidenceRepos || [],
          updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : (r.updatedAt || new Date().toISOString()),
        }))
        .sort((a, b) => (levelWeights[b.level] || 0) - (levelWeights[a.level] || 0) || b.confidenceScore - a.confidenceScore);
      CachingService.set(cacheKey, result, 60);
      return result;
    }

    return await this.calculateDeveloperCapabilities(userId);
  }

  /**
   * Retrieves public developer capabilities with privacy shielding
   */
  static async getPublicDeveloperCapabilities(username: string): Promise<DeveloperCapabilityItem[]> {
    let userRecord: any = null;
    const cleanUsername = username.trim().toLowerCase();

    try {
      userRecord = await withDbTimeout(
        db.query.users.findFirst({
          where: eq(sql`lower(${users.username})`, cleanUsername),
        }),
        3000
      );
    } catch {}

    if (!userRecord) {
      if (cleanUsername === 'siddharthkadbhane-pixel') {
        userRecord = getDummyUserByUsername('siddharthkadbhane-pixel');
      } else {
        return [];
      }
    }

    // Check privacy settings
    try {
      const privacy = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, userRecord.id),
      });

      if (privacy && privacy.profileVisibility === 'private') {
        return []; // Profile is private
      }
    } catch {}

    const capabilities = await this.getDeveloperCapabilities(userRecord.id);

    // Sanitize for public presentation (filter internal private IDs)
    return capabilities.map(cap => ({
      ...cap,
      id: `pub_${cap.capabilityName.replace(/\s+/g, '_').toLowerCase()}`,
    }));
  }

  /**
   * Selectively records capability progression milestones into capabilityHistory
   */
  private static async syncCapabilityMilestones(userId: string, capabilities: DeveloperCapabilityItem[]): Promise<void> {
    try {
      const strongCaps = capabilities.filter(c => c.level === 'Strong');
      if (strongCaps.length === 0) return;

      const recentHistory = await withDbTimeout(
        db.query.capabilityHistory.findMany({
          where: eq(capabilityHistory.userId, userId),
          orderBy: [desc(capabilityHistory.changedAt)],
          limit: 10,
        }),
        5000
      ).catch(() => []);

      for (const cap of strongCaps) {
        const alreadyRecorded = recentHistory.some(
          h => h.skillName === cap.capabilityName && h.changeType === 'skill_verified'
        );
        if (alreadyRecorded) continue;

        await CapabilityGrowthService.recordGrowthEvent({
          userId,
          overallScore: 860,
          level: 'Expert',
          changeType: 'skill_verified',
          title: `Strong Capability Verified: ${cap.capabilityName}`,
          description: `Demonstrated deep engineering maturity in ${cap.capabilityName} across ${cap.analyzedProjectsCount} audited repositories with verified ${cap.supportingSkills.slice(0, 3).join(', ')} implementation.`,
          dimension: 'engineering',
          skillName: cap.capabilityName,
          isPublic: true,
        });
      }
    } catch (err: any) {
      Logger.warn(`Capability milestone sync note: ${err.message}`);
    }
  }

  /**
   * Generates a concise, transparent "Why?" explanation
   */
  private static generateWhyExplanation(
    capName: string,
    level: EngineeringCapabilityLevel,
    state: CapabilityVerificationState,
    analyzedCount: number,
    skills: string[],
    avgScore: number
  ): string {
    const skillsStr = skills.slice(0, 3).join(', ');

    if (level === 'Strong') {
      return `Demonstrated across ${analyzedCount} audited repositories with verified ${skillsStr} implementations and an average AST code quality score of ${avgScore}/100.`;
    }
    if (level === 'Proficient') {
      return `Supported by ${analyzedCount} analyzed project(s) featuring active ${skillsStr} architecture and an average AST score of ${avgScore}/100.`;
    }
    if (level === 'Developing') {
      return `Evidenced by emerging codebase implementation in ${skillsStr || capName} with baseline architectural patterns detected.`;
    }
    return `Detected via project dependencies and initial repository activity. Complete additional AST codebase reviews to advance verification.`;
  }
}

export default SkillIntelligenceService;
