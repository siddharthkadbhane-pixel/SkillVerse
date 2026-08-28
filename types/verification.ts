export type VerificationStatus =
  | 'verified'
  | 'supported'
  | 'detected'
  | 'insufficient_evidence'
  | 'stale';

export type EvidenceFreshness = 'current' | 'aging' | 'stale';

export type EvidenceWeight = 'strong' | 'moderate' | 'weak';

export type EvidenceSourceType =
  | 'ast_audit'
  | 'repository_source'
  | 'package_manifest'
  | 'git_commit'
  | 'pull_request'
  | 'peer_review';

export interface EvidenceAuditRecord {
  id: string;
  sourceType: EvidenceSourceType;
  sourceId: string;
  repositoryId: string;
  repositoryName: string;
  qualityScore: number;
  freshness: EvidenceFreshness;
  weight: EvidenceWeight;
  verifiedAt: string;
  lastActiveAt: string;
}

export interface VerificationIntegritySummary {
  totalEvidenceCount: number;
  verifiedSkillsCount: number;
  supportedSkillsCount: number;
  detectedSkillsCount: number;
  staleSkillsCount: number;
  averageEvidenceScore: number;
  freshnessDistribution: {
    current: number;
    aging: number;
    stale: number;
  };
  integrityScore: number; // 0 to 100
  lastAuditDate: string;
}
