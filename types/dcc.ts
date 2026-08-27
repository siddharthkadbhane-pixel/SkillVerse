// Developer Capability Card (DCC) 2.0 Types & Contracts

export type SkillVerificationStatus = 
  | 'verified' 
  | 'supported' 
  | 'detected' 
  | 'insufficient_evidence' 
  | 'inferred' 
  | 'not_enough_evidence';

export type EvidenceStrength = 'strong' | 'moderate' | 'weak';

export type RepoContributionRole = 'owner' | 'contributor' | 'fork' | 'collaborator';

export type CapabilityLevel = 
  | 'Explorer' 
  | 'Builder' 
  | 'Creator' 
  | 'Professional' 
  | 'Advanced' 
  | 'Expert' 
  | 'Elite';

export type CapabilityChangeType = 
  | 'skill_verified' 
  | 'skill_strengthened' 
  | 'dimension_improved' 
  | 'repo_analyzed' 
  | 'level_promoted' 
  | 'score_update';

export interface SkillHistoryStage {
  stage: string; // e.g. 'Detected', 'Verified', 'Advanced'
  level: number; // 0 - 100
  date: string;
  evidenceRepo?: string;
  source?: string;
}

export interface SkillEvidenceItem {
  repoName: string;
  repoFullName: string;
  isAnalyzed: boolean;
  commitCount?: number;
  linesCount?: number;
  filesCount?: number;
  reviewScore?: number;
  lastUsedDate?: string;
  evidenceStrength?: EvidenceStrength;
  contributionRole?: RepoContributionRole;
  verificationMethod?: string;
  highlights?: string[];
  isPublic?: boolean;
  source: 'codebase' | 'package_json' | 'git_commit' | 'peer_vouch' | 'challenge';
}

export interface VerifiedSkill {
  name: string;
  category: 'Languages' | 'Frontend' | 'Backend' | 'Database' | 'DevOps & Cloud' | 'AI & ML' | 'Testing & Tools' | 'Architecture';
  level: number; // 0 - 100
  status: SkillVerificationStatus;
  confidence: number; // 0 - 100
  evidenceCount: number;
  evidenceStrength?: EvidenceStrength;
  whyVerified?: string;
  lastVerifiedDate?: string;
  evidenceList: SkillEvidenceItem[];
  history?: SkillHistoryStage[];
  growthTrend?: number; // e.g. +12%
  primaryLanguage?: boolean;
}

export interface SkillVerificationDetail {
  skillName: string;
  category: string;
  level: number;
  status: SkillVerificationStatus;
  evidenceStrength: EvidenceStrength;
  confidence: number;
  whyVerified: string;
  lastVerifiedDate: string;
  evidenceCount: number;
  analyzedReposCount: number;
  evidenceList: SkillEvidenceItem[];
  history?: SkillHistoryStage[];
  strengthsBreakdown?: { name: string; score: number }[];
}

export interface EngineeringMetricEvidence {
  label: string;
  key: 'codeQuality' | 'architecture' | 'security' | 'performance' | 'testing' | 'documentation';
  score: number; // 0 - 100
  rating: 'Exceptional' | 'Strong' | 'Adequate' | 'Needs Improvement';
  evidenceRepos: {
    repoName: string;
    repoFullName: string;
    metricScore: number;
    highlights: string[];
    contributionRole?: RepoContributionRole;
  }[];
  explanation: string;
}

export interface ProjectEvidenceSummary {
  id: string | number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  isAnalyzed: boolean;
  analyzedAt: string | null;
  overallScore: number | null;
  codeQualityScore: number | null;
  architectureScore: number | null;
  securityScore: number | null;
  testingScore: number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  demonstratedSkills: string[];
  activityLevel: 'High' | 'Medium' | 'Low';
  commitsCount: number;
  contributionRole?: RepoContributionRole;
  verificationMethod?: string;
}

export interface CapabilityDimensionsData {
  engineering: {
    codeQuality: number;
    architecture: number;
    security: number;
    performance: number;
    testing: number;
    documentation: number;
  };
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    devops: string[];
    cloud: string[];
    aiMl: string[];
    mobile: string[];
    web: string[];
    verifiedSkillsList: VerifiedSkill[];
  };
  projects: {
    repositoryQuality: number;
    complexity: number;
    openSource: number;
    buildSuccess: number;
    deployments: number;
    projectDiversity: number;
    projectList?: ProjectEvidenceSummary[];
  };
  collaboration: {
    pullRequests: number;
    codeReviews: number;
    mentoring: number;
    discussions: number;
    teamwork: number;
    communityHelp: number;
  };
  growth: {
    velocity: number;
    consistency: number;
    skillExpansion: number;
    activity: number;
    milestones: number;
  };
  career: {
    readiness: string;
    roleRecommendations: string[];
    strengths: string[];
    weaknesses: string[];
    experienceTrend: string;
  };
}

export interface CapabilityHistoryEntry {
  id?: string;
  score?: number;
  overallScore: number;
  level: CapabilityLevel | string;
  changeType?: CapabilityChangeType;
  title?: string;
  description?: string;
  skillName?: string;
  dimension?: string;
  previousValue?: string;
  newValue?: string;
  repositoryId?: string;
  evidenceRepo?: string;
  evidenceReference?: string;
  isPublic?: boolean;
  metadata?: any;
  createdAt?: string;
  changedAt?: string;
  reason?: string;
}

export interface GrowthTimelineItem {
  id: string;
  date: string;
  monthYear: string;
  changeType: CapabilityChangeType;
  title: string;
  description: string;
  evidenceRepo?: string;
  badgeText?: string;
  badgeVariant?: 'emerald' | 'indigo' | 'blue' | 'purple' | 'amber';
  scoreImpact?: number;
}

export interface GrowthChartPoint {
  date: string;
  score: number;
  verifiedSkills: number;
  milestone?: string;
}

export interface DashboardGrowthSummary {
  verifiedSkillsCount: number;
  newSkillsCount: number;
  recentProjectsCount: number;
  latestMilestone?: GrowthTimelineItem;
  recentEvents: GrowthTimelineItem[];
  growthTrajectory: 'Accelerating' | 'Steady' | 'Ascending';
}

export interface DCCFullData {
  developer: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    primaryTechnologies: string[];
    joinedAt: string;
  };
  card: {
    id: string;
    userId: string;
    overallScore: number;
    level: CapabilityLevel;
    summary: string | null;
    verificationStatus: 'verified' | 'unverified';
    confidenceScore: number;
    lastUpdated: string;
  };
  dimensions: CapabilityDimensionsData;
  verifiedSkills: VerifiedSkill[];
  engineeringMetrics: EngineeringMetricEvidence[];
  projectEvidence: ProjectEvidenceSummary[];
  insights: {
    strengths: string[];
    weaknesses: string[];
    learningSuggestions: { topic: string; resource: string }[];
    advice: string;
  };
  history: CapabilityHistoryEntry[];
  timeline: GrowthTimelineItem[];
  growthChart: GrowthChartPoint[];
  publicUrl: string;
}

export interface DCCPublicData {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  overallScore: number;
  level: CapabilityLevel;
  summary: string | null;
  verificationStatus: 'verified' | 'unverified';
  confidenceScore: number;
  primaryTechnologies: string[];
  dimensions: CapabilityDimensionsData;
  verifiedSkills: VerifiedSkill[];
  engineeringMetrics: EngineeringMetricEvidence[];
  projectEvidence: ProjectEvidenceSummary[];
  insights: {
    strengths: string[];
    advice: string;
  };
  timeline?: GrowthTimelineItem[];
  growthChart?: GrowthChartPoint[];
  lastUpdated: string;
}
