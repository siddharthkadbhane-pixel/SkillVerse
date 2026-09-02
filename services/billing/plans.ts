// SkillVerse Plan Catalog & Configuration (Phase 39)

import { PlanTier, PlanId, EntitlementKey, EntitlementValue } from '@/types/billing';

/**
 * Master Plan Definitions
 * 
 * PHILOSOPHY:
 * 1. FREE-FIRST: Core developer proof-of-capability (DCC, skills, AST analysis, trust score, public sharing) is 100% free forever.
 * 2. NO PAY-TO-WIN: Scores and capability levels are purely evidence-based and NEVER boosted by subscription tier.
 * 3. TRANSPARENT LIMITS: Generous development allocations with clear reset intervals.
 */
export const PLANS: Record<PlanId, PlanTier> = {
  free: {
    id: 'free',
    name: 'Developer Free',
    tier: 'free',
    target: 'developer',
    description: 'Core proof-of-capability engine for every software engineer. Complete Git audits and verified skills.',
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    currency: 'USD',
    badge: 'Free Forever',
    features: [
      'Full Developer Capability Card (DCC 2.0)',
      '10 Repository AST code analyses / mo',
      '5 AI-powered architectural reviews / mo',
      'Evidence-backed Skill DNA & Trust Score',
      'Public Shareable DCC & Profile URL',
      '1,000 Developer API requests / mo',
      '3 Event Webhook subscriptions',
      'Unlimited Opportunity & Challenge Discovery',
      '1-Click DCC Job Applications',
    ],
    entitlements: {
      repository_analyses: 10,
      advanced_ai_reviews: 5,
      career_insights_depth: 'basic',
      advanced_analytics: false,
      profile_customization: false,
      candidate_searches: 0,
      candidate_comparison_limit: 0,
      challenge_creation: false,
      team_seat_limit: 1,
      api_monthly_requests: 1000,
      api_rate_limit_rpm: 60,
      export_formats: ['json', 'markdown'],
      webhook_subscriptions_limit: 3,
      private_recruiter_notes: false,
      priority_support: false,
    },
    limitsDisplay: {
      repoAnalyses: '10 / month',
      aiReviews: '5 / month',
      apiRequests: '1,000 / month',
    },
    isActive: true,
  },

  developer_pro: {
    id: 'developer_pro',
    name: 'Developer Pro',
    tier: 'pro',
    target: 'developer',
    description: 'For engineers seeking unlimited AST reviews, deep multi-agent insights, and high-frequency API automation.',
    priceMonthly: 12,
    priceAnnualMonthly: 9,
    currency: 'USD',
    badge: 'Power Developer',
    popular: true,
    features: [
      'All Free features included',
      '100 Repository AST analyses / mo',
      '50 Multi-agent AI deep reviews / mo',
      'Deep AI Career Gap Analysis & Roadmap Simulation',
      'Custom Profile Badging & Markdown Exports',
      '25,000 Developer API requests / mo',
      '20 Event Webhook subscriptions',
      'Advanced Activity & Cadence Analytics',
      'Priority AST analysis queue execution',
    ],
    entitlements: {
      repository_analyses: 100,
      advanced_ai_reviews: 50,
      career_insights_depth: 'deep',
      advanced_analytics: true,
      profile_customization: true,
      candidate_searches: 10,
      candidate_comparison_limit: 2,
      challenge_creation: false,
      team_seat_limit: 3,
      api_monthly_requests: 25000,
      api_rate_limit_rpm: 300,
      export_formats: ['json', 'markdown', 'pdf', 'csv'],
      webhook_subscriptions_limit: 20,
      private_recruiter_notes: false,
      priority_support: true,
    },
    limitsDisplay: {
      repoAnalyses: '100 / month',
      aiReviews: '50 / month',
      apiRequests: '25,000 / month',
    },
    isActive: true,
  },

  company: {
    id: 'company',
    name: 'Company Hiring Workspace',
    tier: 'company',
    target: 'company',
    description: 'For engineering hiring teams seeking verified technical talent with AST code proof and candidate comparisons.',
    priceMonthly: 199,
    priceAnnualMonthly: 149,
    currency: 'USD',
    badge: 'Recruiter & Hiring',
    features: [
      'Unlimited Developer DCC & Trust Score Search',
      '500 Direct Candidate Evidence Audits / mo',
      'Side-by-Side Candidate AST Capability Comparison',
      'Host up to 5 Technical Verification Challenges / mo',
      '5 Recruiter & Hiring Manager Seats',
      'Private Candidate Notes & Pipeline Tags',
      '100,000 Platform API requests / mo',
      'Recruiting Funnel & Verification Analytics',
    ],
    entitlements: {
      repository_analyses: 250,
      advanced_ai_reviews: 100,
      career_insights_depth: 'unlimited',
      advanced_analytics: true,
      profile_customization: true,
      candidate_searches: 500,
      candidate_comparison_limit: 10,
      challenge_creation: 5,
      team_seat_limit: 5,
      api_monthly_requests: 100000,
      api_rate_limit_rpm: 600,
      export_formats: ['json', 'markdown', 'pdf', 'csv'],
      webhook_subscriptions_limit: 50,
      private_recruiter_notes: true,
      priority_support: true,
    },
    limitsDisplay: {
      repoAnalyses: '250 / month',
      aiReviews: '100 / month',
      apiRequests: '100,000 / month',
      candidateSearches: '500 / month',
      teamSeats: '5 seats',
    },
    isActive: true,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Organization',
    tier: 'enterprise',
    target: 'all',
    description: 'Custom scale, dedicated challenge hosting, unbounded team seats, SSO, and custom SLA integrations.',
    priceMonthly: 499,
    priceAnnualMonthly: 399,
    currency: 'USD',
    badge: 'Scale & Custom',
    features: [
      'Unlimited Candidate Search & AST Inspections',
      'Unlimited Recruiter & Engineering Seats',
      'Unlimited Custom Challenge Hosting with Custom AST weights',
      'Dedicated API Rate Limits (500k+ requests / mo)',
      'Custom AST Rule Plugins & Audit Sentinel Rules',
      'SSO (SAML, Okta, Azure AD) & Audit Log Streaming',
      'Dedicated Technical Solutions Engineer & SLA',
    ],
    entitlements: {
      repository_analyses: -1, // -1 means unlimited
      advanced_ai_reviews: -1,
      career_insights_depth: 'unlimited',
      advanced_analytics: true,
      profile_customization: true,
      candidate_searches: -1,
      candidate_comparison_limit: -1,
      challenge_creation: -1,
      team_seat_limit: -1,
      api_monthly_requests: 500000,
      api_rate_limit_rpm: 2000,
      export_formats: ['json', 'markdown', 'pdf', 'csv'],
      webhook_subscriptions_limit: 200,
      private_recruiter_notes: true,
      priority_support: true,
    },
    limitsDisplay: {
      repoAnalyses: 'Unlimited',
      aiReviews: 'Unlimited',
      apiRequests: '500,000 / month',
      candidateSearches: 'Unlimited',
      teamSeats: 'Unlimited',
    },
    isActive: true,
  },
};

export class PlanService {
  public static getPlan(planId: string): PlanTier {
    const key = (planId || 'free').toLowerCase() as PlanId;
    return PLANS[key] || PLANS.free;
  }

  public static getAllPlans(): PlanTier[] {
    return Object.values(PLANS);
  }

  public static getDeveloperPlans(): PlanTier[] {
    return Object.values(PLANS).filter((p) => p.target === 'developer' || p.target === 'all');
  }

  public static getCompanyPlans(): PlanTier[] {
    return Object.values(PLANS).filter((p) => p.target === 'company' || p.target === 'all');
  }

  public static getEntitlementLimit(planId: string, feature: EntitlementKey): EntitlementValue {
    const plan = this.getPlan(planId);
    return plan.entitlements[feature] ?? false;
  }

  public static getDefaultPlanForRole(role?: string): PlanId {
    if (role === 'recruiter' || role === 'company_admin') {
      return 'company';
    }
    return 'free';
  }
}
