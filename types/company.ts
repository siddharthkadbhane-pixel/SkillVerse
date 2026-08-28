import { DeveloperSearchResultItem } from './discovery';
import { CapabilityLevel } from './dcc';
import { DeveloperCapabilityItem } from './capability';

export type CompanyVerificationStatus = 'pending' | 'verified' | 'rejected';

export type CompanyRole = 'company_admin' | 'recruiter';

export type CompanyMemberStatus = 'active' | 'invited' | 'suspended';

export interface CompanyProfile {
  id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  verificationStatus: CompanyVerificationStatus;
  createdAt: string;
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
    username: string;
  };
  role: CompanyRole;
  status: CompanyMemberStatus;
  joinedAt: string;
}

export interface SavedDeveloperItem {
  id: string;
  companyId: string;
  recruiterId: string;
  developerUserId: string;
  developer: DeveloperSearchResultItem;
  notes?: string | null;
  tags?: string[];
  createdAt: string;
}

export interface RecruiterNoteItem {
  id: string;
  companyId: string;
  recruiterId: string;
  recruiterName?: string;
  developerUserId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecentlyViewedDeveloperItem {
  id: string;
  companyId: string;
  recruiterId: string;
  developerUserId: string;
  developer: DeveloperSearchResultItem;
  viewedAt: string;
}

export interface CandidateComparisonMetric {
  username: string;
  name: string;
  avatarUrl: string;
  overallScore: number;
  dccLevel: CapabilityLevel;
  confidenceScore: number;
  publicProjectCount: number;
  analyzedProjectCount: number;
  topVerifiedSkills: { name: string; level: number; status: string }[];
  engineeringCapabilities: DeveloperCapabilityItem[];
}

export interface DeveloperComparisonSummary {
  candidates: CandidateComparisonMetric[];
  sharedSkills: string[];
  comparedAt: string;
}
