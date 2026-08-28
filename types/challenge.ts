export type ChallengeType = 
  | 'coding' 
  | 'bug_fix' 
  | 'feature' 
  | 'frontend' 
  | 'backend' 
  | 'api' 
  | 'database' 
  | 'devops' 
  | 'ai_ml' 
  | 'full_project';

export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type ChallengeStatus = 
  | 'draft' 
  | 'published' 
  | 'active' 
  | 'submission_closed' 
  | 'evaluating' 
  | 'completed';

export type ChallengeVisibility = 'public' | 'private';

export interface EvaluationCriteriaWeights {
  functionality: number;    // e.g. 30
  codeQuality: number;      // e.g. 20
  architecture: number;     // e.g. 20
  testing: number;          // e.g. 15
  documentation: number;    // e.g. 15
}

export interface ChallengeOrganizer {
  id: string;
  name: string;
  logoUrl?: string | null;
  type: 'company' | 'college' | 'community' | 'user';
  verified: boolean;
}

export interface ChallengeItem {
  id: string;
  organizerId: string;
  organizer: ChallengeOrganizer;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  requiredSkills: string[];
  preferredSkills: string[];
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  maxParticipants?: number | null;
  visibility: ChallengeVisibility;
  status: ChallengeStatus;
  criteriaWeights: EvaluationCriteriaWeights;
  prizePool?: string | null;
  isHiringOpportunity?: boolean;
  participantsCount: number;
  submissionsCount: number;
  hasJoined?: boolean;
  userSubmission?: ChallengeSubmission | null;
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  teamId?: string | null;
  joinedAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  teamId?: string | null;
  repositoryUrl: string;
  liveDemoUrl?: string | null;
  description?: string | null;
  submittedAt: string;
  evaluation?: ChallengeEvaluation | null;
}

export interface ChallengeEvaluation {
  id: string;
  submissionId: string;
  compositeScore: number; // 0 to 100
  functionalityScore: number;
  codeQualityScore: number;
  architectureScore: number;
  testingScore: number;
  documentationScore: number;
  astQualityTier: string;
  verifiedCapabilitiesDemonstrated: string[];
  feedbackNotes?: string | null;
  evaluatedAt: string;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  userId: string;
  developerName: string;
  username: string;
  avatarUrl?: string | null;
  teamName?: string | null;
  score: number;
  astQualityTier: string;
  verifiedCapabilities: string[];
  submittedAt: string;
}

export interface ChallengeFilter {
  q?: string;
  type?: ChallengeType | 'all';
  difficulty?: ChallengeDifficulty | 'all';
  skill?: string;
  status?: ChallengeStatus | 'all';
  organizerId?: string;
  isHiring?: boolean;
}
