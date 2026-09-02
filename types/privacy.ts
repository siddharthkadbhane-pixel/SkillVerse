// SkillVerse Privacy, Consent & Compliance Domain Contracts (Phase 41)

export type ConsentPurpose =
  | 'service_operation'        // Essential for running account and DCC evaluation
  | 'public_profile'           // Allowing public profile and DCC indexing
  | 'private_repo_analysis'    // Explicit permission to fetch private repository manifests
  | 'analytics_telemetry'      // Anonymous operational error and performance telemetry
  | 'marketing_updates';       // Optional platform feature newsletters

export interface UserConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  version: string;
  ipAddress?: string | null;
  createdAt: string;
  revokedAt?: string | null;
}

export type PrivacyRequestType =
  | 'data_access'           // Request full copy of data
  | 'data_rectification'    // Request correction of inaccurate profile data
  | 'account_deletion'      // Request complete account deletion / anonymization
  | 'consent_withdrawal'   // Revoke specific processing permissions
  | 'general_inquiry';      // Privacy inquiry or grievance

export type PrivacyRequestStatus = 'pending' | 'in_review' | 'completed' | 'rejected';

export interface PrivacyRequest {
  id: string;
  userId?: string | null;
  email: string;
  name?: string | null;
  requestType: PrivacyRequestType;
  details: string;
  status: PrivacyRequestStatus;
  responseNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface PrivacyPreferences {
  isPublicProfile: boolean;
  showTrustScore: boolean;
  showSkillDna: boolean;
  showRepositories: boolean;
  allowRecruiterDiscovery: boolean;
  allowAnalytics: boolean;
  allowEmailUpdates: boolean;
}
