export interface SkillVerseUser {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role?: string;
}

export interface SkillVerseDCCSummary {
  overallScore: number;
  level: 'Elite' | 'Expert' | 'Specialist' | 'Proficient' | 'Builder' | 'Explorer';
  confidenceScore: number;
  verificationStatus?: string;
  verifiedSkills?: Array<{
    name: string;
    category: string;
    level: string;
    evidenceCount: number;
  }>;
  topCapabilities?: Array<{
    capabilityName: string;
    category: string;
    level: 'Strong' | 'Proficient' | 'Developing' | 'Emerging';
    confidenceScore: number;
    whyExplanation?: string;
  }>;
}

export interface SkillVerseRepositoryInfo {
  id?: string;
  name: string;
  fullName?: string;
  isAnalyzed: boolean;
  healthScore?: number;
  overallScore?: number;
  language?: string;
  lastAnalysisAt?: string;
  verificationState: 'verified' | 'analyzing' | 'unregistered' | 'error';
  message?: string;
}

export interface SkillVerseCareerSummary {
  targetRole: string;
  readinessTier: 'Ready' | 'Developing' | 'Emerging' | 'Early Stage';
  fitScore: number;
  nextRecommendedSkill: string;
}

export interface SkillVerseStatusData {
  developer: SkillVerseUser;
  dcc: SkillVerseDCCSummary;
  career: SkillVerseCareerSummary;
  repository?: SkillVerseRepositoryInfo | null;
}

export interface SkillVerseFileInspectionResult {
  fileName: string;
  language: string;
  lineCount: number;
  complexity: 'High' | 'Moderate' | 'Low';
  score: number;
  summary: string;
  insights: string[];
  suggestions: string[];
  evaluatedAt: string;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  token?: string;
  user?: SkillVerseUser;
}
