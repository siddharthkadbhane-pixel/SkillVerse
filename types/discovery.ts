import { CapabilityLevel, SkillVerificationStatus } from './dcc';

export type DeveloperSortOption = 
  | 'relevance' 
  | 'verified_skills' 
  | 'score' 
  | 'recent' 
  | 'projects';

export interface DeveloperSearchParams {
  q?: string;
  skill?: string;
  status?: SkillVerificationStatus | 'all';
  level?: CapabilityLevel | 'all';
  category?: string | 'all';
  minProjects?: number;
  minScore?: number;
  sort?: DeveloperSortOption;
  page?: number;
  limit?: number;
}

export interface DeveloperSearchResultSkill {
  name: string;
  category: string;
  level: number;
  status: SkillVerificationStatus; // 'verified' | 'supported' | 'detected'
  evidenceCount: number;
  whyVerified?: string;
}

export interface DeveloperSearchResultItem {
  id: string;
  username: string;
  name: string;
  avatarUrl: string;
  bio: string | null;
  location: string | null;
  dccLevel: CapabilityLevel;
  overallScore: number;
  confidenceScore: number;
  topVerifiedSkills: DeveloperSearchResultSkill[];
  primaryTechnologies: string[];
  publicProjectCount: number;
  analyzedProjectCount: number;
  lastUpdated: string;
  dccUrl: string; // e.g. `/developer/${username}`
  matchReason?: string;
  relevanceScore?: number;
}

export interface DeveloperSearchPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DeveloperSearchMeta {
  tookMs: number;
  availableSkills: string[];
  availableCategories: string[];
  availableLevels: CapabilityLevel[];
}

export interface DeveloperSearchResult {
  developers: DeveloperSearchResultItem[];
  pagination: DeveloperSearchPagination;
  filters: {
    q: string;
    skill: string;
    status: string;
    level: string;
    category: string;
    minProjects: number;
    sort: DeveloperSortOption;
  };
  meta: DeveloperSearchMeta;
}
