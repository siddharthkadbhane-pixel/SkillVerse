import { CapabilityLevel } from './dcc';
import { DeveloperCapabilityItem } from './capability';

export type OpportunityType = 
  | 'full_time' 
  | 'part_time' 
  | 'internship' 
  | 'contract' 
  | 'freelance' 
  | 'project';

export type WorkplaceType = 'remote' | 'hybrid' | 'onsite';

export type ExperienceLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff';

export type OpportunityStatus = 'draft' | 'published' | 'closed';

export type ApplicationStatus = 
  | 'applied' 
  | 'reviewing' 
  | 'shortlisted' 
  | 'interview' 
  | 'rejected' 
  | 'accepted';

export type MatchTier = 'Strong Match' | 'Good Match' | 'Moderate Match' | 'Building Match';

export interface OpportunityCompanyInfo {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  location?: string | null;
}

export interface OpportunityItem {
  id: string;
  companyId: string;
  company: OpportunityCompanyInfo;
  title: string;
  description: string;
  type: OpportunityType;
  workplaceType: WorkplaceType;
  location: string;
  salaryRange?: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  requiredCapabilities: string[];
  preferredCapabilities: string[];
  experienceLevel: ExperienceLevel;
  minTrustScore: number;
  status: OpportunityStatus;
  deadline?: string | null;
  viewsCount: number;
  applicationsCount: number;
  matchEvaluation?: OpportunityMatchEvaluation;
  isSaved?: boolean;
  hasApplied?: boolean;
  userApplicationStatus?: ApplicationStatus;
  createdAt: string;
}

export interface OpportunityMatchEvaluation {
  matchTier: MatchTier;
  matchPercentage: number; // 0 to 100
  verifiedSkillsMatch: {
    skill: string;
    verified: boolean;
    level: number;
  }[];
  preferredSkillsMatch: {
    skill: string;
    verified: boolean;
  }[];
  capabilitiesMatch: {
    capability: string;
    supported: boolean;
    level: string;
  }[];
  relevantProjectsCount: number;
  missingSkills: string[];
  whyExplanation: string;
}

export interface ApplicationItem {
  id: string;
  opportunityId: string;
  opportunity?: Partial<OpportunityItem>;
  userId: string;
  developer: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
    dccLevel: CapabilityLevel;
    overallScore: number;
    topVerifiedSkills: string[];
  };
  coverLetter?: string | null;
  status: ApplicationStatus;
  matchScore: number;
  matchDetails: OpportunityMatchEvaluation;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityFilter {
  q?: string;
  skill?: string;
  capability?: string;
  type?: OpportunityType | 'all';
  workplaceType?: WorkplaceType | 'all';
  experienceLevel?: ExperienceLevel | 'all';
  location?: string;
  minMatch?: number;
  companyId?: string;
}
