export type ActivityType = 
  | 'commit' 
  | 'pull_request' 
  | 'issue' 
  | 'code_review' 
  | 'release' 
  | 'audit' 
  | 'achievement' 
  | 'challenge';

export type ContributionFrequency = 
  | 'High' 
  | 'Consistent' 
  | 'Moderate' 
  | 'Occasional' 
  | 'New';

export interface ContributionActivityItem {
  id: string;
  userId: string;
  repositoryId?: string | null;
  repositoryName: string;
  activityType: ActivityType;
  sourceId: string;
  title: string;
  description: string;
  activityDate: string;
  metadata?: {
    additions?: number;
    deletions?: number;
    branch?: string;
    url?: string;
    language?: string;
    prNumber?: number;
    commitSha?: string;
  } | null;
  isPublic: boolean;
  createdAt: string;
}

export interface MonthlyContributionBucket {
  monthKey: string; // e.g. '2026-01'
  label: string; // e.g. 'Jan 2026'
  count: number;
  commitCount: number;
  prCount: number;
  activeReposCount: number;
  primaryLanguages: string[];
}

export interface ContributionIntelligenceSummary {
  activeRepositoriesCount: number;
  analyzedRepositoriesCount: number;
  totalRecentContributions: number;
  frequency: ContributionFrequency;
  primaryLanguages: string[];
  lastActiveDate: string | null;
  contextualSummary: string;
  monthlyTimeline: MonthlyContributionBucket[];
  recentActivities: ContributionActivityItem[];
}

export interface SyncActivityResult {
  success: boolean;
  syncedCount: number;
  duplicateCount: number;
  newRepositoriesAnalyzed: number;
  milestonesRecorded: number;
  message: string;
}
