export interface SkillItem {
  name: string;
  category: string;
  level: number; // 0 to 100
  confidence: number; // 0 to 100
  evidenceCount: number;
  repositoryCount: number;
  lastVerified: string;
  growthTrend: number; // growth percentage (e.g. +15 or 0)
  verificationStatus: 'verified' | 'unverified';
}

export interface SkillCategorySummary {
  name: string;
  averageLevel: number;
  skillsCount: number;
}

export interface SkillDnaProfile {
  overallLevel: number;
  skills: SkillItem[];
  categorySummaries: SkillCategorySummary[];
  lastUpdated: string;
  engineVersion: string;
}

export interface SkillEvidenceDetail {
  skillName: string;
  repoName: string;
  fullName: string;
  htmlUrl: string;
  evidenceSource: 'ai_review' | 'github_manifest' | 'commits';
  qualityScore: number;
  lastVerified: string;
}

export interface LearningRecommendation {
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  priority: 'High' | 'Medium' | 'Low';
}
