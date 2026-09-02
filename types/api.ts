// SkillVerse API Platform & Webhook Types (Phase 38)

export type ApiScope =
  | 'read:profile'
  | 'read:dcc'
  | 'read:skills'
  | 'read:evidence'
  | 'read:repositories'
  | 'write:repositories'
  | 'write:analysis'
  | 'read:opportunities'
  | 'write:applications'
  | 'read:challenges'
  | 'write:submissions'
  | 'read:teams'
  | 'write:webhooks'
  | 'admin:all';

export const ALL_API_SCOPES: { id: ApiScope; label: string; description: string; category: string }[] = [
  { id: 'read:profile', label: 'Read Profile', description: 'Access public and authenticated developer profile data', category: 'Profile' },
  { id: 'read:dcc', label: 'Read DCC', description: 'Access Developer Capability Card, level, ratings, and dimensions', category: 'DCC & Intelligence' },
  { id: 'read:skills', label: 'Read Skills', description: 'Access verified, supported, and detected skills', category: 'DCC & Intelligence' },
  { id: 'read:evidence', label: 'Read Evidence', description: 'Access audit trail, freshness status, and project proofs', category: 'Evidence' },
  { id: 'read:repositories', label: 'Read Repositories', description: 'Access connected repository metadata and verification states', category: 'Repositories' },
  { id: 'write:repositories', label: 'Manage Repositories', description: 'Connect, update, or remove linked repositories', category: 'Repositories' },
  { id: 'write:analysis', label: 'Trigger Analysis', description: 'Trigger AST codebase inspection and AI capability review', category: 'Repositories' },
  { id: 'read:opportunities', label: 'Read Opportunities', description: 'Browse career roles, jobs, and recruiter listings', category: 'Opportunities' },
  { id: 'write:applications', label: 'Apply to Roles', description: 'Submit job applications with verified DCC proof', category: 'Opportunities' },
  { id: 'read:challenges', label: 'Read Challenges', description: 'View verification challenges, criteria, and leaderboards', category: 'Challenges' },
  { id: 'write:submissions', label: 'Submit Challenge Solutions', description: 'Submit repository solutions to challenges', category: 'Challenges' },
  { id: 'read:teams', label: 'Read Teams', description: 'Access developer teams, guilds, and collective strengths', category: 'Teams' },
  { id: 'write:webhooks', label: 'Manage Webhooks', description: 'Create, modify, and test event webhook subscriptions', category: 'Webhooks' },
  { id: 'admin:all', label: 'Full Administrator Access', description: 'Unrestricted access to all SkillVerse platform resources', category: 'Admin' },
];

export type WebhookEventType =
  | 'developer.updated'
  | 'dcc.updated'
  | 'skill.verified'
  | 'capability.updated'
  | 'repository.analyzed'
  | 'review.completed'
  | 'opportunity.created'
  | 'application.updated'
  | 'challenge.completed'
  | 'team.updated';

export const ALL_WEBHOOK_EVENTS: { id: WebhookEventType; label: string; description: string }[] = [
  { id: 'developer.updated', label: 'Developer Updated', description: 'Fires when profile bio, status, or identity details change' },
  { id: 'dcc.updated', label: 'DCC Recalculated', description: 'Fires when overall rating, level, or dimensions are updated' },
  { id: 'skill.verified', label: 'Skill Verified', description: 'Fires when a skill transitions to verified with AST proof' },
  { id: 'capability.updated', label: 'Capability Updated', description: 'Fires when engineering capabilities or taxonomy scores change' },
  { id: 'repository.analyzed', label: 'Repository Analyzed', description: 'Fires when AST codebase inspection completes' },
  { id: 'review.completed', label: 'AI Review Completed', description: 'Fires when AI architectural and code quality review finishes' },
  { id: 'opportunity.created', label: 'Opportunity Created', description: 'Fires when a new matching career opportunity is posted' },
  { id: 'application.updated', label: 'Application Status Changed', description: 'Fires when recruiter reviews or shortlists an application' },
  { id: 'challenge.completed', label: 'Challenge Evaluated', description: 'Fires when challenge solution is audited and ranked' },
  { id: 'team.updated', label: 'Team Roster Updated', description: 'Fires when team members, roles, or collective stats change' },
];

export type ApiClientType = 'web' | 'cli' | 'vscode' | 'api' | 'sdk';

export interface ApiAuthContext {
  isAuthenticated: boolean;
  user: {
    id: string;
    email?: string;
    username: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  authMethod: 'bearer_token' | 'session_cookie' | 'none';
  token?: {
    id: string;
    name: string;
    prefix: string;
    scopes: ApiScope[];
  };
  scopes: ApiScope[];
  requestId: string;
  clientType: ApiClientType;
}

export interface PersonalAccessTokenData {
  id: string;
  userId: string;
  name: string;
  tokenPrefix: string;
  scopes: ApiScope[];
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  isRevoked: boolean;
}

export interface PersonalAccessTokenCreateResult {
  token: PersonalAccessTokenData;
  rawToken: string; // ONLY returned once upon creation
}

export interface WebhookSubscriptionData {
  id: string;
  userId: string;
  url: string;
  events: WebhookEventType[];
  secret: string; // e.g. whsec_...
  status: 'active' | 'disabled' | 'failing';
  failureCount: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  webhookId: string;
  eventId: string;
  eventType: WebhookEventType;
  payload?: any;
  statusCode?: number | null;
  durationMs?: number | null;
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: string | null;
  status: 'pending' | 'success' | 'retry' | 'failed';
  responseBody?: string | null;
  createdAt: string;
}

export interface ApiErrorDetails {
  code: string;
  message: string;
  requestId: string;
  details?: any;
}

export interface ApiSuccessPayload<T> {
  version: 'v1';
  requestId: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RateLimitState {
  limit: number;
  remaining: number;
  reset: number; // Unix seconds
  isExceeded: boolean;
}
