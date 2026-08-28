export type CapabilityCategoryName =
  | 'Frontend Engineering'
  | 'Backend Engineering'
  | 'Full-Stack Development'
  | 'API Development'
  | 'Database Engineering'
  | 'Software Architecture'
  | 'DevOps & Infrastructure'
  | 'Cloud Engineering'
  | 'Testing & QA'
  | 'Security Awareness'
  | 'Performance Engineering'
  | 'Developer Tooling';

export type EngineeringCapabilityLevel =
  | 'Strong'
  | 'Proficient'
  | 'Developing'
  | 'Emerging';

export type CapabilityVerificationState =
  | 'verified'
  | 'supported'
  | 'detected'
  | 'insufficient_evidence';

export interface DeveloperCapabilityItem {
  id: string;
  userId: string;
  capabilityName: CapabilityCategoryName | string;
  category: string;
  level: EngineeringCapabilityLevel;
  verificationState: CapabilityVerificationState;
  confidenceScore: number; // 0 to 100
  analyzedProjectsCount: number;
  verifiedSkillsCount: number;
  supportingSkills: string[];
  whyExplanation: string;
  evidenceRepos: string[];
  updatedAt: string;
}

export interface CapabilityTaxonomyDefinition {
  name: CapabilityCategoryName;
  category: string;
  description: string;
  coreSkills: string[];
  evaluationCriteria: {
    minScoreForStrong: number;
    minAnalyzedReposForStrong: number;
    minVerifiedSkillsForStrong: number;
    minAnalyzedReposForProficient: number;
    minVerifiedSkillsForProficient: number;
  };
}
