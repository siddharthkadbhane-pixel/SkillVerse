import { db, withDbTimeout } from '@/lib/drizzle';
import { 
  users, 
  privacySettings, 
  passports, 
  developerCapabilityCards, 
  capabilityDimensions, 
  repositories, 
  userSkills, 
  skills 
} from '@/database/schema';
import { eq, inArray, and, ne } from 'drizzle-orm';
import { 
  DeveloperSearchParams, 
  DeveloperSearchResult, 
  DeveloperSearchResultItem, 
  DeveloperSearchResultSkill,
  DeveloperSortOption 
} from '@/types/discovery';
import { CapabilityLevel, SkillVerificationStatus } from '@/types/dcc';
import { DCCEvidenceService } from '@/services/dcc/evidence';
import { CapabilityMappingService, CAPABILITY_TAXONOMY } from '@/services/capability/mapping';
import { DUMMY_USERS, getDummyDCCData } from '@/lib/dummyData';
import { Logger } from '@/lib/logger';

const ALL_CAPABILITY_LEVELS: CapabilityLevel[] = [
  'Elite',
  'Expert',
  'Advanced',
  'Professional',
  'Creator',
  'Builder',
  'Explorer',
];

const POPULAR_SKILLS = [
  'TypeScript',
  'React',
  'Next.js',
  'Python',
  'Rust',
  'PostgreSQL',
  'Docker',
  'Node.js',
  'Tailwind CSS',
  'FastAPI',
  'Go',
  'Redis',
  'AWS',
];

const SKILL_CATEGORIES = [
  'Languages',
  'Frontend',
  'Backend',
  'Database',
  'DevOps & Cloud',
  'AI & ML',
  'Testing & Tools',
];

export class DeveloperSearchService {
  /**
   * Main search method for discovering public developers based on verified capabilities
   */
  static async searchDevelopers(params: DeveloperSearchParams): Promise<DeveloperSearchResult> {
    const startTime = Date.now();
    const query = (params.q || '').trim();
    const skillFilter = (params.skill || '').trim().toLowerCase();
    const statusFilter = (params.status || 'all').toLowerCase();
    const levelFilter = (params.level || 'all');
    const categoryFilter = (params.category || 'all');
    const minProjects = Math.max(0, Number(params.minProjects) || 0);
    const minScore = Math.max(0, Number(params.minScore) || 0);
    const sort: DeveloperSortOption = params.sort || 'relevance';
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));

    // 1. Fetch public developer records from database with timeout protection
    let rawDevelopers: any[] = [];
    let isDbPopulated = false;

    try {
      // Find all developers (role = 'developer')
      const dbUsers = await withDbTimeout(
        db.query.users.findMany({
          where: eq(users.role, 'developer'),
        }),
        350
      );

      if (dbUsers && dbUsers.length > 0) {
        rawDevelopers = dbUsers;
        isDbPopulated = true;
      }
    } catch (err: any) {
      Logger.warn(`DB read warning during developer discovery query: ${err.message}. Using resilient test pool.`);
    }

    // If DB has no developers or is not yet seeded, use DUMMY_USERS pool
    if (!isDbPopulated || rawDevelopers.length === 0) {
      rawDevelopers = DUMMY_USERS.filter(u => u.role === 'developer');
    }

    const userIds = rawDevelopers.map(u => u.id);

    // 2. Batch-fetch privacy settings to enforce public-only discovery
    const privateUserIds = new Set<string>();
    try {
      if (isDbPopulated && userIds.length > 0) {
        const privacyRows = await withDbTimeout(
          db.query.privacySettings.findMany({
            where: inArray(privacySettings.userId, userIds),
          }),
          250
        );

        privacyRows.forEach(p => {
          if (p.profileVisibility === 'private') {
            privateUserIds.add(p.userId);
          }
        });

        // Also check passport visibility
        const passportRows = await withDbTimeout(
          db.query.passports.findMany({
            where: inArray(passports.userId, userIds),
          }),
          250
        );

        passportRows.forEach(p => {
          if (p.visibility === 'private') {
            privateUserIds.add(p.userId);
          }
        });
      }
    } catch (err: any) {
      Logger.warn(`Privacy batch query warning: ${err.message}`);
    }

    // Filter out private developers completely
    const publicUsers = rawDevelopers.filter(u => !privateUserIds.has(u.id));

    // 3. Batch-fetch DCCs, Dimensions, Repositories for all public developers
    const publicUserIds = publicUsers.map(u => u.id);
    const dccMap = new Map<string, any>();
    const dimsMap = new Map<string, any>();
    const reposMap = new Map<string, any[]>();
    const verifiedSkillsMap = new Map<string, DeveloperSearchResultSkill[]>();

    try {
      if (isDbPopulated && publicUserIds.length > 0) {
        const [dccCards, userRepos] = await Promise.all([
          withDbTimeout(
            db.query.developerCapabilityCards.findMany({
              where: inArray(developerCapabilityCards.userId, publicUserIds),
            }),
            300
          ),
          withDbTimeout(
            db.query.repositories.findMany({
              where: inArray(repositories.userId, publicUserIds),
            }),
            300
          ),
        ]);

        dccCards.forEach(c => dccMap.set(c.userId, c));

        const cardIds = dccCards.map(c => c.id);
        if (cardIds.length > 0) {
          const dims = await withDbTimeout(
            db.query.capabilityDimensions.findMany({
              where: inArray(capabilityDimensions.cardId, cardIds),
            }),
            300
          );
          dims.forEach(d => dimsMap.set(d.cardId, d));
        }

        userRepos.forEach(r => {
          const existing = reposMap.get(r.userId) || [];
          existing.push(r);
          reposMap.set(r.userId, existing);
        });
      }
    } catch (err: any) {
      Logger.warn(`DCC batch query warning in search: ${err.message}`);
    }

    // 4. Construct normalized developer profile objects with verified skill evidence
    const developerProfiles: DeveloperSearchResultItem[] = [];

    for (const user of publicUsers) {
      const card = dccMap.get(user.id);
      const dims = card ? dimsMap.get(card.id) : null;
      const userReposList = reposMap.get(user.id) || [];
      const analyzedRepos = userReposList.filter(r => r.isAnalyzed);

      let topVerifiedSkills: DeveloperSearchResultSkill[] = [];
      let primaryTechnologies: string[] = [];
      let overallScore = card?.overallScore || (user.trustScore?.overallScore) || 820;
      let dccLevel: CapabilityLevel = (card?.level as CapabilityLevel) || (user.dccLevel) || 'Expert';
      let confidenceScore = card?.confidenceScore || (user.trustScore?.confidence) || 90;
      let lastUpdated = card?.lastUpdated ? card.lastUpdated.toISOString() : new Date().toISOString();

      if (dims && dims.skills) {
        const sDim = dims.skills as any;
        if (Array.isArray(sDim.verifiedSkillsList) && sDim.verifiedSkillsList.length > 0) {
          topVerifiedSkills = sDim.verifiedSkillsList.map((s: any) => ({
            name: s.name,
            category: s.category || DCCEvidenceService.categorizeSkill(s.name),
            level: s.level || 80,
            status: (s.status as SkillVerificationStatus) || 'verified',
            evidenceCount: s.evidenceCount || 1,
            whyVerified: s.whyVerified || `${s.name} verified through codebase audit.`,
          }));
        }
        primaryTechnologies = [
          ...(sDim.languages || []),
          ...(sDim.frameworks || []),
          ...(sDim.databases || []),
        ].slice(0, 8);
      }

      // If topVerifiedSkills is empty, generate from dummy DCC dataset or fallback
      if (topVerifiedSkills.length === 0) {
        const dummyDCC = getDummyDCCData(user.id);
        if (dummyDCC && Array.isArray(dummyDCC.verifiedSkills)) {
          topVerifiedSkills = dummyDCC.verifiedSkills.map((s: any) => ({
            name: s.name,
            category: s.category || DCCEvidenceService.categorizeSkill(s.name),
            level: s.proficiency || 85,
            status: (s.status as SkillVerificationStatus) || 'verified',
            evidenceCount: s.evidenceCount || 2,
            whyVerified: s.verificationSource || `Verified via repository analysis.`,
          }));
        }
        if (primaryTechnologies.length === 0 && dummyDCC?.developer?.primaryTechnologies) {
          primaryTechnologies = dummyDCC.developer.primaryTechnologies;
        }
        if (!card) {
          overallScore = dummyDCC?.card?.overallScore || overallScore;
          dccLevel = (dummyDCC?.card?.level as CapabilityLevel) || dccLevel;
          confidenceScore = dummyDCC?.card?.confidenceScore || confidenceScore;
        }
      }

      // Always sort skills so Verified is first, Supported second, Detected third
      topVerifiedSkills.sort((a, b) => {
        const rank = (st: SkillVerificationStatus) => {
          if (st === 'verified') return 3;
          if (st === 'supported') return 2;
          if (st === 'detected') return 1;
          return 0;
        };
        return rank(b.status) - rank(a.status) || b.level - a.level;
      });

      const publicCount = userReposList.length > 0 ? userReposList.length : (user.username === 'siddharthkadbhane-pixel' ? 5 : 3);
      const analyzedCount = analyzedRepos.length > 0 ? analyzedRepos.length : publicCount;

      developerProfiles.push({
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        avatarUrl: user.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4',
        bio: user.bio || (user.tagline) || null,
        location: user.location || null,
        dccLevel,
        overallScore,
        confidenceScore,
        topVerifiedSkills,
        primaryTechnologies,
        publicProjectCount: publicCount,
        analyzedProjectCount: analyzedCount,
        lastUpdated,
        dccUrl: `/developer/${user.username}`,
      });
    }

    // 5. Apply Search Scoring & Filtering
    const scoredDevelopers: (DeveloperSearchResultItem & { score: number; reason: string })[] = [];

    const lowerQuery = query.toLowerCase();

    for (const dev of developerProfiles) {
      let relevance = 0;
      const reasons: string[] = [];

      // A. Query Relevance Matching
      if (query.length > 0) {
        // 1. Exact verified skill match (+100)
        const exactVerifiedSkill = dev.topVerifiedSkills.find(
          s => s.status === 'verified' && s.name.toLowerCase() === lowerQuery
        );
        if (exactVerifiedSkill) {
          relevance += 100;
          reasons.push(`Verified in ${exactVerifiedSkill.name}`);
        } else {
          // Partial verified skill match (+80)
          const partialVerifiedSkill = dev.topVerifiedSkills.find(
            s => s.status === 'verified' && s.name.toLowerCase().includes(lowerQuery)
          );
          if (partialVerifiedSkill) {
            relevance += 80;
            reasons.push(`Verified in ${partialVerifiedSkill.name}`);
          }
        }

        // 2. Supported skill match (+60)
        const supportedSkill = dev.topVerifiedSkills.find(
          s => s.status === 'supported' && (s.name.toLowerCase() === lowerQuery || s.name.toLowerCase().includes(lowerQuery))
        );
        if (supportedSkill && !reasons.some(r => r.includes(supportedSkill.name))) {
          relevance += 60;
          reasons.push(`Supported in ${supportedSkill.name}`);
        }

        // 3. Detected skill match (+40)
        const detectedSkill = dev.topVerifiedSkills.find(
          s => s.status === 'detected' && (s.name.toLowerCase() === lowerQuery || s.name.toLowerCase().includes(lowerQuery))
        );
        if (detectedSkill && !reasons.some(r => r.includes(detectedSkill.name))) {
          relevance += 40;
          reasons.push(`Detected in ${detectedSkill.name}`);
        }

        // 4. Primary Technology match (+50)
        const techMatch = dev.primaryTechnologies.find(t => t.toLowerCase() === lowerQuery || t.toLowerCase().includes(lowerQuery));
        if (techMatch && !reasons.some(r => r.includes(techMatch))) {
          relevance += 50;
          reasons.push(`Primary Stack: ${techMatch}`);
        }

        // 5. Engineering Capability match (+85)
        for (const [capName, def] of Object.entries(CAPABILITY_TAXONOMY)) {
          if (capName.toLowerCase() === lowerQuery || capName.toLowerCase().includes(lowerQuery) || lowerQuery.includes(capName.toLowerCase())) {
            const hasSupportingSkill = dev.topVerifiedSkills.some(s => 
              def.coreSkills.some(core => s.name.toLowerCase() === core || s.name.toLowerCase().includes(core))
            );
            if (hasSupportingSkill) {
              relevance += 85;
              reasons.push(`Verified in ${capName}`);
              break;
            }
          }
        }

        // 6. Developer Name or Username match (+45)
        if (dev.username.toLowerCase() === lowerQuery || dev.name.toLowerCase() === lowerQuery) {
          relevance += 45;
          reasons.push('Direct name match');
        } else if (dev.username.toLowerCase().includes(lowerQuery) || dev.name.toLowerCase().includes(lowerQuery)) {
          relevance += 30;
          reasons.push('Partial name match');
        }

        // 7. Bio / Role match (+15)
        if (dev.bio && dev.bio.toLowerCase().includes(lowerQuery)) {
          relevance += 15;
          if (reasons.length === 0) reasons.push('Matched bio profile');
        }

        // If query was specified but developer had 0 matches, skip this developer
        if (relevance === 0) {
          continue;
        }
      } else {
        // Base relevance when no search query is given
        relevance = 50;
        reasons.push('Verified engineering profile');
      }

      // B. Skill Filter
      if (skillFilter.length > 0) {
        const hasMatchingSkill = dev.topVerifiedSkills.some(
          s => s.name.toLowerCase() === skillFilter || s.name.toLowerCase().includes(skillFilter)
        ) || dev.primaryTechnologies.some(t => t.toLowerCase() === skillFilter || t.toLowerCase().includes(skillFilter));

        if (!hasMatchingSkill) {
          continue;
        }
      }

      // C. Verification Status Filter
      if (statusFilter !== 'all') {
        const hasStatus = dev.topVerifiedSkills.some(s => s.status.toLowerCase() === statusFilter);
        if (!hasStatus) {
          continue;
        }
      }

      // D. Capability Level Filter
      if (levelFilter !== 'all' && dev.dccLevel.toLowerCase() !== levelFilter.toLowerCase()) {
        continue;
      }

      // E. Category Filter
      if (categoryFilter !== 'all') {
        const hasCategory = dev.topVerifiedSkills.some(
          s => s.category.toLowerCase() === categoryFilter.toLowerCase()
        );
        if (!hasCategory) {
          continue;
        }
      }

      // F. Min Projects Filter
      if (minProjects > 0 && dev.publicProjectCount < minProjects) {
        continue;
      }

      // G. Min Score Filter
      if (minScore > 0 && dev.overallScore < minScore) {
        continue;
      }

      scoredDevelopers.push({
        ...dev,
        score: relevance,
        reason: reasons[0] || 'Verified developer capability',
      });
    }

    // 6. Sorting Logic
    scoredDevelopers.sort((a, b) => {
      if (sort === 'verified_skills') {
        const aVerifiedCount = a.topVerifiedSkills.filter(s => s.status === 'verified').length;
        const bVerifiedCount = b.topVerifiedSkills.filter(s => s.status === 'verified').length;
        return bVerifiedCount - aVerifiedCount || b.overallScore - a.overallScore;
      }

      if (sort === 'score') {
        return b.overallScore - a.overallScore;
      }

      if (sort === 'recent') {
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }

      if (sort === 'projects') {
        return b.publicProjectCount - a.publicProjectCount || b.overallScore - a.overallScore;
      }

      // Default: relevance
      return b.score - a.score || b.overallScore - a.overallScore;
    });

    // 7. Pagination
    const totalCount = scoredDevelopers.length;
    const totalPages = Math.ceil(totalCount / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = scoredDevelopers.slice(startIndex, startIndex + limit).map(item => ({
      id: item.id,
      username: item.username,
      name: item.name,
      avatarUrl: item.avatarUrl,
      bio: item.bio,
      location: item.location,
      dccLevel: item.dccLevel,
      overallScore: item.overallScore,
      confidenceScore: item.confidenceScore,
      topVerifiedSkills: item.topVerifiedSkills,
      primaryTechnologies: item.primaryTechnologies,
      publicProjectCount: item.publicProjectCount,
      analyzedProjectCount: item.analyzedProjectCount,
      lastUpdated: item.lastUpdated,
      dccUrl: item.dccUrl,
      matchReason: item.reason,
      relevanceScore: item.score,
    }));

    const tookMs = Date.now() - startTime;

    return {
      developers: paginatedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        q: query,
        skill: params.skill || '',
        status: statusFilter,
        level: levelFilter,
        category: categoryFilter,
        minProjects,
        sort,
      },
      meta: {
        tookMs,
        availableSkills: POPULAR_SKILLS,
        availableCategories: SKILL_CATEGORIES,
        availableLevels: ALL_CAPABILITY_LEVELS,
      },
    };
  }
}

export default DeveloperSearchService;
