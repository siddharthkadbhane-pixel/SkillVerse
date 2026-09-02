// SkillVerse Monetization & Billing Foundation Types (Phase 39)

export type PlanId = 'free' | 'developer_pro' | 'company' | 'enterprise';

export type PlanTierType = 'free' | 'pro' | 'company' | 'enterprise';

export type PlanTargetType = 'developer' | 'company' | 'all';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'free';

export type EntitlementKey =
  | 'repository_analyses'
  | 'advanced_ai_reviews'
  | 'career_insights_depth'
  | 'advanced_analytics'
  | 'profile_customization'
  | 'candidate_searches'
  | 'candidate_comparison_limit'
  | 'challenge_creation'
  | 'team_seat_limit'
  | 'api_monthly_requests'
  | 'api_rate_limit_rpm'
  | 'export_formats'
  | 'webhook_subscriptions_limit'
  | 'private_recruiter_notes'
  | 'priority_support';

export type EntitlementValue = number | boolean | string | string[];

export interface PlanTier {
  id: PlanId;
  name: string;
  tier: PlanTierType;
  target: PlanTargetType;
  description: string;
  priceMonthly: number; // in USD (0 for free)
  priceAnnualMonthly: number; // monthly equivalent if billed annually
  currency: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  entitlements: Record<EntitlementKey, EntitlementValue>;
  limitsDisplay: {
    repoAnalyses: string;
    aiReviews: string;
    apiRequests: string;
    candidateSearches?: string;
    teamSeats?: string;
  };
  isActive: boolean;
}

export type UsageMetric =
  | 'repository_analyses'
  | 'ai_reviews'
  | 'api_requests'
  | 'challenge_evaluations'
  | 'export_operations'
  | 'candidate_searches';

export interface UsagePeriodInfo {
  periodStart: string; // ISO string
  periodEnd: string; // ISO string
  daysRemaining: number;
}

export interface MetricUsageItem {
  metric: UsageMetric;
  label: string;
  used: number;
  limit: number | 'unlimited';
  unit: string;
  percentageUsed: number;
  isExceeded: boolean;
  resetsAt: string;
}

export interface UsageSummary {
  targetId: string;
  targetType: 'user' | 'company';
  planId: PlanId;
  period: UsagePeriodInfo;
  metrics: Record<UsageMetric, MetricUsageItem>;
  hasExceededAnyLimit: boolean;
}

export interface SubscriptionRecord {
  id: string;
  targetType: 'user' | 'company';
  targetId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  provider: 'mock' | 'stripe' | 'razorpay' | 'paddle';
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  feature: EntitlementKey;
  planId: PlanId;
  currentUsage?: number;
  limit?: EntitlementValue;
  remaining?: number;
  isUnlimited?: boolean;
  resetsAt?: string;
  reason?: string;
}

export interface BillingCustomer {
  id: string;
  targetType: 'user' | 'company';
  targetId: string;
  provider: string;
  providerCustomerId: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export type BillingCustomerResult = BillingCustomer;

export interface BillingAuditEvent {
  id: string;
  eventId: string;
  provider: string;
  eventType: BillingEventType;
  targetType?: 'user' | 'company';
  targetId?: string;
  payload: Record<string, any>;
  status: 'success' | 'ignored' | 'failed';
  errorMessage?: string | null;
  createdAt: string;
}

export type BillingEventType =
  | 'billing.subscription.created'
  | 'billing.subscription.updated'
  | 'billing.subscription.cancelled'
  | 'billing.payment.succeeded'
  | 'billing.payment.failed'
  | 'billing.usage.limit_reached'
  | 'billing.invoice.generated';

export interface CreateCustomerParams {
  targetId: string;
  targetType: 'user' | 'company';
  email: string;
  name: string;
}

export interface CreateCheckoutParams {
  targetId: string;
  targetType: 'user' | 'company';
  planId: PlanId;
  billingInterval: 'monthly' | 'yearly';
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
  mode: 'demo_instant_success' | 'redirect';
  expiresAt: string;
  planId: PlanId;
}

export interface SubscriptionDetails {
  id: string;
  status: SubscriptionStatus;
  planId: PlanId;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface BillingWebhookEventResult {
  received: boolean;
  processed: boolean;
  eventType: string;
  targetId?: string;
  error?: string;
}
