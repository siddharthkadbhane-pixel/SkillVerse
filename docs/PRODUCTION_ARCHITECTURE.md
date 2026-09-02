# SkillVerse Production System Architecture

SkillVerse is a decentralized, evidence-backed developer capability intelligence platform deployed on **Next.js 15 (App Router)**, **Vercel Serverless**, and **PostgreSQL (Supabase Pooler)** with **Drizzle ORM**.

---

## 1. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 15 App Router on Vercel                           │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │         Developer & Recruiter UI        │  │       REST API & Edge Middleware    │  │
│  │   (DCC 2.0, Discovery, Jobs, Teams,     │  │   (middleware.ts: Rate Limit, CSP,  │  │
│  │    Challenges, Settings, Billing)       │  │    /api/v1/..., /api/billing/...)   │  │
│  └────────────────────┬────────────────────┘  └──────────────────┬──────────────────┘  │
└───────────────────────┼──────────────────────────────────────────┼─────────────────────┘
                        │ Client Actions                           │ Authenticated Calls
                        ▼                                          ▼
     ┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
     │            Supabase Auth             │     │      AuthorizationGuard Layer        │
     │      OAuth 2.0 (GitHub / Google)     │     │  (Anti-IDOR, Role & Scope Checks)    │
     └──────────────────────────────────────┘     └──────────────────┬───────────────────┘
                                                                     │
     ┌───────────────────────────────────────────────────────────────┴───────────────────┐
     │                           Core Intelligence & Domain Engines                      │
     ├───────────────────────────────┬───────────────────────────────┬───────────────────┤
     │  1. DCC 2.0 Engine            │ 2. AST Codebase Analyzer      │ 3. Multi-Agent AI │
     │  4. Verification Integrity    │ 5. Skill DNA & Capabilities   │ 6. Entitlements   │
     │  7. Opportunity Match Engine  │ 8. Challenge AST Evaluator    │ 9. Webhook Engine │
     └───────────────────────────────┴──────────────┬────────────────┴───────────────────┘
                                                    │
                                                    ▼
                             ┌──────────────────────────────────────────────┐
                             │       Drizzle ORM & Database Layer           │
                             │   • PostgreSQL (102 Normalized Tables)       │
                             │   • Resilient Circuit Breaker (150ms timeout)│
                             │   • Row Level Security (RLS) Active          │
                             │   • In-Memory Multi-Tiered Fallback Store    │
                             └──────────────────────────────────────────────┘
```

---

## 2. Trust Boundaries & External Dependencies

| Dependency | Purpose | Failure Mode Behavior |
| :--- | :--- | :--- |
| **Supabase PostgreSQL** | Primary relational store (102 tables) | Circuit breaker opens on 150ms timeout -> Seamlessly operates in resilient in-memory fallback mode with pre-seeded data |
| **GitHub REST API** | Commit, PR, and source file metadata | 500KB cap per repo analysis, rate-limit headers detection, cached metadata fallback |
| **Hugging Face Serverless** | Multi-agent code reviews | Fallback parser automatically generates deterministic AST structural analysis on API timeout or outage |
| **Developer API & CLI** | IDE and programmatic integrations | SHA-256 hashed PAT authentication, scope validation, rate-limited per IP/token |
| **Billing Engine** | Monetization & Quota gating | `MockBillingProvider` active ($0 dev), free-first guarantee, zero score inflation |

---

## 3. Data Integrity & Credibility Guarantee

SkillVerse enforces strict separation between capability evaluation and commercial features:
1. **Developer Capability Cards (DCC)**, **Trust Scores**, and **Skill Evidence** are derived **100% deterministically from Git audit trails and AST code heuristics**.
2. **Subscriptions only affect compute quotas and recruiter workflow tools** (never capability score inflation).
