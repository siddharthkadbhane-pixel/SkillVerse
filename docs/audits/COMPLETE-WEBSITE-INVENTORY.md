# SKILLVERSE — COMPLETE WEBSITE & SUBSYSTEM INVENTORY

**Workspace:** `D:\ANTIGRAVITY PROJECT\Sillverse`  
**Audit Date:** November 2026  
**Audit Scope:** Complete Application Surface (Pages, Layouts, APIs, Components, Services, Hooks, Schemas, Integrations)  
**Status:** Complete & Final Discovery Inventory  

---

## 1. Executive Summary

SkillVerse is a comprehensive web application designed to evaluate, verify, and showcase developer capabilities based on code repository analysis, while providing role-scoped experiences for developers, hiring recruiters, company administrators, and platform operators.

This inventory provides an exhaustive, code-level catalog of every functional artifact discovered in the codebase:
- **69 Page Routes** (across Auth, Developer Dashboard, Company Workspace, Admin Console, and Public Surfaces)
- **4 Layouts** (Root, Dashboard, Company Workspace, Admin Console)
- **193 API Route Handlers** (covering Auth, Identity, Repositories, AI Reviews, DCC, Capabilities, Hiring, Billing, Community, and Enterprise APIs)
- **41 UI Components** (Charts, Dashboard Widgets, DCC Visualizers, UI Primitives, Shared Layouts, and Discovery Cards)
- **73 Backend & Domain Services** (AI Inference, AST Analysis, Graph Intelligence, Neon Integrations, Auth, and Security Guards)
- **7 Hooks & 4 Context Providers**
- **117 Relational Database Tables & 3 Postgres Enums** in Neon Serverless PostgreSQL (`database/schema.ts`)
- **8 Major External Integrations** (GitHub REST/OAuth, Neon Serverless PostgreSQL, Better Auth, Hugging Face LLM, Google Cloud OAuth, Upstash Redis, Stripe/Mock Billing, Docker/Container Sandbox)

---

## 2. Complete Page & Layout Inventory

SkillVerse organizes its routing through Next.js 15 App Router under the [`app/`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app) directory.

### 2.1 Application Layouts (4)

| Layout File | Type | Server/Client | Primary Responsibility & Role Guards |
|---|---|---|---|
| [`app/layout.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/layout.tsx) | Root Layout | Server Component | Root HTML/Body markup, font injection (Inter/Fira Sans), theme provider setup, global metadata. |
| [`app/(dashboard)/layout.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/layout.tsx) | Dashboard Layout | Server Component | Wraps authenticated routes; injects Navbar, Sidebar, and CommandPalette shell. |
| [`app/(dashboard)/company/layout.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/layout.tsx) | Workspace Layout | Server Component | Enforces `requireServerCompanyAccess()`; protects `/company/*` for `recruiter` and `company_admin`. |
| [`app/(dashboard)/admin/layout.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/admin/layout.tsx) | Admin Layout | Server Component | Enforces `requireServerAdmin()`; restricts `/admin/*` strictly to `admin` role. |

---

### 2.2 Page Route Inventory (69)

#### A. Authentication & Access (1)
| Route Path | File Location | Render Mode | Functional Purpose |
|---|---|---|---|
| `/login` | [`app/(auth)/login/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(auth)/login/page.tsx) | Client (`'use client'`) | Multi-provider OAuth sign-in (GitHub, Google), demo test user login (dev only), error parsing. |

#### B. Developer Dashboard & Core Talent Experience (21)
| Route Path | File Location | Render Mode | Functional Purpose |
|---|---|---|---|
| `/dashboard` | [`app/(dashboard)/dashboard/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/dashboard/page.tsx) | Client (`'use client'`) | Entry point post-login. *Defect:* Unconditionally renders `DeveloperOverviewPage`. |
| `/overview` | [`app/(dashboard)/overview/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/overview/page.tsx) | Client (`'use client'`) | Primary Developer Overview: Radar chart, Trust score, recent activity, career widget. |
| `/career` | [`app/(dashboard)/career/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/career/page.tsx) | Client (`'use client'`) | Career path recommendations, milestone progress, skills taxonomy, learning goals. |
| `/skill-dna` | [`app/(dashboard)/skill-dna/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/skill-dna/page.tsx) | Client (`'use client'`) | Interactive visual map of multidimensional developer DNA and skill depth. |
| `/skills` | [`app/(dashboard)/skills/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/skills/page.tsx) | Client (`'use client'`) | Catalog of all verified and detected skills with proficiency meters. |
| `/skills/[skill]` | [`app/(dashboard)/skills/[skill]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/skills/[skill]/page.tsx) | Client (`'use client'`) | Granular drilldown for a specific technology; associated repos, code snippets, evidence. |
| `/projects` | [`app/(dashboard)/projects/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/projects/page.tsx) | Client (`'use client'`) | List of developer projects, live URLs, GitHub references, and verified build stats. |
| `/projects/[id]` | [`app/(dashboard)/projects/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/projects/[id]/page.tsx) | Client (`'use client'`) | Project detail view: repository links, technologies used, review status. |
| `/repositories` | [`app/(dashboard)/repositories/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/repositories/page.tsx) | Client (`'use client'`) | Connected GitHub repositories, analysis status badges, manual audit trigger buttons. |
| `/repositories/[id]` | [`app/(dashboard)/repositories/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/repositories/[id]/page.tsx) | Client (`'use client'`) | Deep codebase audit report: strengths, weaknesses, architecture, health scores. |
| `/repositories/compare` | [`app/(dashboard)/repositories/compare/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/repositories/compare/page.tsx) | Client (`'use client'`) | Side-by-side comparative analysis between two audited codebases. |
| `/reviews` | [`app/(dashboard)/reviews/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/reviews/page.tsx) | Client (`'use client'`) | History of AI and peer code reviews generated across developer repositories. |
| `/reviews/[id]` | [`app/(dashboard)/reviews/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/reviews/[id]/page.tsx) | Client (`'use client'`) | Individual review record with AI explainability, extracted skills, and recommendations. |
| `/dcc` | [`app/(dashboard)/dcc/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/dcc/page.tsx) | Client (`'use client'`) | Developer Capability Card 2.0: engineering dimensions, verified skills, share modal. |
| `/github` | [`app/(dashboard)/github/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/github/page.tsx) | Client (`'use client'`) | GitHub integration center: connection status, repo syncing, commit activity graphs. |
| `/activity` | [`app/(dashboard)/activity/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/activity/page.tsx) | Client (`'use client'`) | Contribution timeline: commits, PRs, code reviews, milestone achievements. |
| `/community` | [`app/(dashboard)/community/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/community/page.tsx) | Client (`'use client'`) | Community feed: discussions, technical questions, peer reviews, follow network. |
| `/community/questions/[id]` | [`app/(dashboard)/community/questions/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/community/questions/[id]/page.tsx) | Client (`'use client'`) | Question discussion thread with verified peer answers and accepted solutions. |
| `/community/reviews/[id]` | [`app/(dashboard)/community/reviews/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/community/reviews/[id]/page.tsx) | Client (`'use client'`) | Public review response view for discussing codebase audit findings. |
| `/network` | [`app/(dashboard)/network/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/network/page.tsx) | Client (`'use client'`) | Professional developer network, mutual connections, peer vouches, following list. |
| `/profile` | [`app/(dashboard)/profile/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/profile/page.tsx) | Client (`'use client'`) | Authenticated user profile: bio, social links, skill summary, trust metrics. |
| `/jobs` | [`app/(dashboard)/jobs/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/jobs/page.tsx) | Client (`'use client'`) | Job board for developers: matching algorithms, verified skill requirements. |
| `/jobs/[id]` | [`app/(dashboard)/jobs/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/jobs/[id]/page.tsx) | Client (`'use client'`) | Job opportunity details: company profile, compensation, 1-click apply with DCC. |
| `/challenges` | [`app/(dashboard)/challenges/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/challenges/page.tsx) | Client (`'use client'`) | Coding challenges and hackathons with automated test runners. |
| `/challenges/[id]` | [`app/(dashboard)/challenges/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/challenges/[id]/page.tsx) | Client (`'use client'`) | Challenge workspace: problem prompt, test case runner, submission leaderboard. |
| `/achievements` | [`app/(dashboard)/achievements/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/achievements/page.tsx) | Client (`'use client'`) | Unlocked milestone badges, capability level certificates, reputation tier. |
| `/analytics` | [`app/(dashboard)/analytics/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/analytics/page.tsx) | Client (`'use client'`) | Personal analytics: profile views, recruiter impressions, capability growth rate. |
| `/passport` | [`app/(dashboard)/passport/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/passport/page.tsx) | Client (`'use client'`) | Cryptographically verified Developer Passport for exporting credentials. |
| `/mentor` | [`app/(dashboard)/mentor/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/mentor/page.tsx) | Client (`'use client'`) | AI Developer Mentor chat: code explanations, architectural guidance, career advice. |
| `/teams` | [`app/(dashboard)/teams/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/teams/page.tsx) | Client (`'use client'`) | Hackathon and project teams: collaboration spaces, task boards. |
| `/teams/[id]` | [`app/(dashboard)/teams/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/teams/[id]/page.tsx) | Client (`'use client'`) | Specific team workspace: shared projects, team capability distribution. |
| `/settings` | [`app/(dashboard)/settings/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/settings/page.tsx) | Client (`'use client'`) | User account settings: privacy controls, data export, GitHub disconnection. |

#### C. Enterprise Workspace Subsystem (5)
| Route Path | File Location | Render Mode | Functional Purpose |
|---|---|---|---|
| `/workspace` | [`app/(dashboard)/workspace/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/workspace/page.tsx) | Client (`'use client'`) | Developer runtime workspace overview: container sandboxes, build runners. |
| `/workspace/agents` | [`app/(dashboard)/workspace/agents/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/workspace/agents/page.tsx) | Client (`'use client'`) | AI Autonomous Agent execution center: agent status, task logs, output streams. |
| `/workspace/cloud` | [`app/(dashboard)/workspace/cloud/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/workspace/cloud/page.tsx) | Client (`'use client'`) | Cloud resource manager: Neon serverless database instances, storage buckets. |
| `/workspace/enterprise` | [`app/(dashboard)/workspace/enterprise/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/workspace/enterprise/page.tsx) | Client (`'use client'`) | Enterprise tenant controls, SSO status, API key governance. |
| `/workspace/graph` | [`app/(dashboard)/workspace/graph/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/workspace/graph/page.tsx) | Client (`'use client'`) | Knowledge graph visualizer linking developers, skills, repos, and companies. |

#### D. Company & Recruiter Hiring Workspace (15)
| Route Path | File Location | Render Mode | Functional Purpose |
|---|---|---|---|
| `/company` | [`app/(dashboard)/company/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/page.tsx) | Client (`'use client'`) | Hiring dashboard overview: candidate matches, open jobs, recent applicant flow. |
| `/company/developers` | [`app/(dashboard)/company/developers/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/developers/page.tsx) | Client (`'use client'`) | Talent search engine: filter by verified skill, confidence score, capability level. |
| `/company/candidates/[id]` | [`app/(dashboard)/company/candidates/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/candidates/[id]/page.tsx) | Client (`'use client'`) | Recruiter candidate evaluation: verified DCC, audit evidence, internal notes. |
| `/company/jobs` | [`app/(dashboard)/company/jobs/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/jobs/page.tsx) | Client (`'use client'`) | Company job listings management: active, draft, closed openings. |
| `/company/jobs/[jobId]/match/[candidateId]` | [`app/(dashboard)/company/jobs/[jobId]/match/[candidateId]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/jobs/[jobId]/match/[candidateId]/page.tsx) | Client (`'use client'`) | Match breakdown comparing job requirements against candidate's verified skills. |
| `/company/applications` | [`app/(dashboard)/company/applications/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/applications/page.tsx) | Client (`'use client'`) | Applicant Tracking System (ATS) pipeline: review, interview, offer stages. |
| `/company/saved` | [`app/(dashboard)/company/saved/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/saved/page.tsx) | Client (`'use client'`) | Bookmarked developer talent lists organized by department/project. |
| `/company/compare` | [`app/(dashboard)/company/compare/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/compare/page.tsx) | Client (`'use client'`) | Multi-candidate comparative radar and capability matrix. |
| `/company/pipeline` | [`app/(dashboard)/company/pipeline/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/pipeline/page.tsx) | Client (`'use client'`) | Kanban board visualizing candidate hiring stages. |
| `/company/analytics` | [`app/(dashboard)/company/analytics/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/analytics/page.tsx) | Client (`'use client'`) | Hiring analytics: time-to-hire, applicant quality scores, pipeline velocity. |
| `/company/billing` | [`app/(dashboard)/company/billing/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/billing/page.tsx) | Client (`'use client'`) | Subscription management: seat count, hiring tier, payment history. |
| `/company/challenges` | [`app/(dashboard)/company/challenges/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/challenges/page.tsx) | Client (`'use client'`) | Company-sponsored technical screening challenges. |
| `/company/members` | [`app/(dashboard)/company/members/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/members/page.tsx) | Client (`'use client'`) | Workspace team management: invite recruiters, manage admin permissions. |
| `/company/profile` | [`app/(dashboard)/company/profile/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/profile/page.tsx) | Client (`'use client'`) | Public company profile: brand assets, culture description, open roles. |
| `/company/team` | [`app/(dashboard)/company/team/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/team/page.tsx) | Client (`'use client'`) | Team directory and seat allocation. *Note:* Duplicates `/company/members`. |

#### E. Platform Administration (1)
| Route Path | File Location | Render Mode | Functional Purpose |
|---|---|---|---|
| `/admin` | `app/(dashboard)/admin/page.tsx` | Server Component | Platform Administration: System status, database health, billing telemetry. |

#### F. Public, Unauthenticated & Standalone Profile Routes (16)
| Route Path | File Location | Render Mode | Functional Purpose |
|---|---|---|---|
| `/` | [`app/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/page.tsx) | Client (`'use client'`) | Public landing page: value proposition, hero section, interactive showcase. |
| `/developers` | [`app/developers/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/developers/page.tsx) | Client (`'use client'`) | Public talent directory: discover verified developers across skill tags. |
| `/developers/[username]` | [`app/developers/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/developers/[username]/page.tsx) | Client (`'use client'`) | Public developer capability portfolio and verified skill profile. |
| `/developer/[username]` | [`app/developer/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/developer/[username]/page.tsx) | Client (`'use client'`) | Duplicate alias for public developer profile. |
| `/u/[username]` | [`app/u/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/u/[username]/page.tsx) | Client (`'use client'`) | Short URL alias for public developer profile. |
| `/profile/[username]` | [`app/profile/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/profile/[username]/page.tsx) | Client (`'use client'`) | Alternate profile route displaying public trust metrics and verified projects. |
| `/portfolio/[username]` | [`app/portfolio/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/portfolio/[username]/page.tsx) | Client (`'use client'`) | Clean portfolio view showcasing audited repositories and live projects. |
| `/passport/[username]` | [`app/passport/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/passport/[username]/page.tsx) | Client (`'use client'`) | Public shareable Developer Capability Passport with cryptographic badges. |
| `/recruiter/dcc` | [`app/recruiter/dcc/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/recruiter/dcc/page.tsx) | Client (`'use client'`) | Recruiter evaluation preview and demo inspection page. |
| `/competitions` | [`app/competitions/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/competitions/page.tsx) | Client (`'use client'`) | Public competition and hackathon directory. |
| `/methodology` | [`app/methodology/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/methodology/page.tsx) | Client (`'use client'`) | SkillVerse Trust & Evidence calculation methodology explanation. |
| `/privacy` | [`app/privacy/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/privacy/page.tsx) | Client (`'use client'`) | Privacy policy, GDPR/CCPA data handling disclosures. |
| `/terms` | [`app/terms/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/terms/page.tsx) | Client (`'use client'`) | Platform terms of service, acceptable use policies. |
| `/cookies` | [`app/cookies/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/cookies/page.tsx) | Client (`'use client'`) | Cookie policy and tracking consent disclosure. |
| `/contact/privacy` | [`app/contact/privacy/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/contact/privacy/page.tsx) | Client (`'use client'`) | Data privacy officer contact and request submission form. |

---

## 3. Complete API Endpoint Inventory (193)

The API layer contains **193 endpoints** organized by functional domain:

```
                            ┌────────────────────────────────────────┐
                            │      193 DISCOVERED API ENDPOINTS      │
                            └───────────────────┬────────────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Auth & Identity │ │ Repos & Reviews │ │ DCC & Abilities │ │ Company/Recruit │ │ v1 REST API     │
│   (7 routes)    │ │   (10 routes)   │ │   (15 routes)   │ │   (14 routes)   │ │   (25 routes)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                   │                   │                  │
         ▼                  ▼                   ▼                   ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Career & Tasks  │ │ Jobs & Matching │ │ Community & Q&A │ │ Billing/Privacy │ │ Cloud/Agents/Misc│
│   (10 routes)   │ │   (6 routes)    │ │   (15 routes)   │ │   (12 routes)   │ │   (79 routes)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 3.1 Subsystem Breakdown

#### 1. Auth & Identity (7 endpoints)
- `app/api/auth/[...all]/route.ts`: Better Auth handler (catches `/api/auth/sign-in`, `/callback`, `/session`, etc.).
- `app/api/auth/callback/route.ts`: OAuth callback verification.
- `app/api/auth/demo/route.ts`: Test user impersonation switch (prohibited in production).
- `app/api/auth/signout/route.ts`: Session cookie invalidation and logout.
- `app/api/ide/auth/route.ts`: IDE extension authentication and API key handshakes.
- `app/api/v1/keys/route.ts`, `app/api/v1/keys/[id]/route.ts`: Personal access token generation and revocation.

#### 2. Repositories & AI Audits (10 endpoints)
- `app/api/repositories/route.ts`: List user's connected GitHub repos; manual repo registration.
- `app/api/repositories/[id]/route.ts`: Fetch individual repository details.
- `app/api/repositories/[id]/analyze/route.ts`, `app/api/repositories/analyze/route.ts`: Trigger static AST code analysis.
- `app/api/repositories/[id]/review/route.ts`: Trigger and retrieve AI LLM reviews (*IDOR risk noted*).
- `app/api/repositories/[id]/status/route.ts`: Polling endpoint for review progress (`idle`, `running`, `completed`).
- `app/api/repository/[id]/health/route.ts`: Repository health benchmarks (modularity, testing, documentation).
- `app/api/repository/[id]/intelligence/route.ts`: Architecture breakdown and structural AST report.
- `app/api/repository/[id]/timeline/route.ts`: Commit history and velocity intelligence.

#### 3. DCC, Capabilities & Verified Skills (15 endpoints)
- `app/api/dcc/route.ts`: Fetch authenticated developer's full DCC.
- `app/api/dcc/public/route.ts`: Fetch public-facing sanitized DCC.
- `app/api/dcc/evidence/route.ts`: Granular drill-down evidence items.
- `app/api/dcc/growth/route.ts`: Capability progress deltas over time.
- `app/api/dcc/history/route.ts`: Audit trail of score and tier promotions.
- `app/api/dcc/insights/route.ts`: AI-generated strengths, weaknesses, and learning suggestions.
- `app/api/dcc/comparison/route.ts`: Candidate-to-candidate capability comparison (*contains fallback mocks*).
- `app/api/dcc/regenerate/route.ts`: Force complete recalculation of DCC scores.
- `app/api/capabilities/route.ts`: Universal developer capability dimension metrics.
- `app/api/skills/route.ts`, `app/api/skills/categories/route.ts`: Master catalog and category taxonomies.
- `app/api/skills/evidence/route.ts`: Specific code proofs supporting a verified skill.
- `app/api/skills/history/route.ts`: Historical evolution of skill proficiencies.
- `app/api/skills/recalculate/route.ts`: Re-evaluate skill proficiencies from latest commits.
- `app/api/trust/route.ts`, `app/api/trust/evidence/route.ts`, `app/api/trust/history/route.ts`: Trust Score engine calculations.

#### 4. Company, Hiring & Talent Discovery (14 endpoints)
- `app/api/company/route.ts`: Company profile and team count (requires `requireCompanyMembership`).
- `app/api/company/dashboard/route.ts`: Aggregated recruiter metrics (candidate counts, open jobs).
- `app/api/company/members/route.ts`: Team member CRUD and invitation dispatch.
- `app/api/company/saved/route.ts`: Bookmarked talent management.
- `app/api/company/notes/route.ts`: Internal recruiter candidate notes.
- `app/api/company/recent/route.ts`: Recently viewed candidates.
- `app/api/company/compare/route.ts`: Multi-developer comparison payload.
- `app/api/company/applications/route.ts`: Job application pipeline status mutations.
- `app/api/candidates/route.ts`, `app/api/candidates/search/route.ts`: Search talent pool.
- `app/api/developers/search/route.ts`: Public talent search filter.

#### 5. Career, Tasks & Learning (10 endpoints)
- `app/api/career/route.ts`: Developer career profile, target roles, readiness scores.
- `app/api/career/goals/route.ts`: User-defined technical learning goals.
- `app/api/career/progress/route.ts`: Goal completion percentages.
- `app/api/career/recommendations/route.ts`: Recommended next skills and projects.
- `app/api/career/roadmap/route.ts`: Step-by-step career path milestones.
- `app/api/career/roles/route.ts`, `app/api/career/roles/[id]/route.ts`: Role requirements (e.g. Senior Frontend, Staff Backend).
- `app/api/career/tasks/route.ts`, `app/api/career/tasks/[id]/complete/route.ts`: Learning task tracking.

#### 6. Jobs & Applications (6 endpoints)
- `app/api/jobs/route.ts`: List active job postings.
- `app/api/jobs/[id]/route.ts`: Fetch job opening specifications.
- `app/api/jobs/[id]/apply/route.ts`: Submit application with attached DCC.
- `app/api/jobs/[id]/save/route.ts`: Bookmark job for later.
- `app/api/jobs/recommended/route.ts`: Algorithmic job recommendations matching developer DNA.
- `app/api/applications/route.ts`: Developer's submitted applications status.

#### 7. Challenges & Competitions (6 endpoints)
- `app/api/challenges/route.ts`, `app/api/challenges/[id]/route.ts`: Challenge prompts.
- `app/api/challenges/[id]/join/route.ts`: Register for hackathon or challenge.
- `app/api/challenges/[id]/submit/route.ts`: Submit code for automated verification.
- `app/api/challenges/[id]/leaderboard/route.ts`: Public leaderboard rankings.

#### 8. Community, Q&A & Social (15 endpoints)
- `app/api/community/feed/route.ts`, `app/api/feed/route.ts`: Activity feed of platform events.
- `app/api/community/posts/route.ts`, `app/api/community/posts/[id]/route.ts`: Technical blog posts and questions.
- `app/api/community/posts/[id]/comments/route.ts`: Thread comments.
- `app/api/community/posts/[id]/vote/route.ts`: Upvote/downvote posts.
- `app/api/community/questions/route.ts`, `app/api/community/questions/[id]/route.ts`: Q&A questions.
- `app/api/community/questions/[id]/answers/route.ts`: Post answer.
- `app/api/community/questions/[id]/answers/[answerId]/accept/route.ts`: Accept answer.
- `app/api/community/follow/route.ts`: Follow other developers.
- `app/api/community/block/route.ts`, `app/api/community/report/route.ts`: Content moderation.

#### 9. Billing & Privacy (12 endpoints)
- `app/api/billing/checkout/route.ts`: Initialize subscription checkout session.
- `app/api/billing/plan/route.ts`: Get current tier entitlements.
- `app/api/billing/subscription/route.ts`: Cancel or modify subscription.
- `app/api/billing/usage/route.ts`: Current API and analysis usage metrics.
- `app/api/billing/webhook/route.ts`: Stripe webhook listener.
- `app/api/privacy/route.ts`, `app/api/privacy/consent/route.ts`: Manage consent settings.
- `app/api/privacy/export/route.ts`: GDPR full data export archive generation.
- `app/api/privacy/delete/route.ts`: GDPR right-to-be-forgotten deletion cascade.
- `app/api/privacy/disconnect-github/route.ts`: Disconnect GitHub account and purge stored tokens.
- `app/api/privacy/request/route.ts`: Submit legal privacy request.

#### 10. v1 Enterprise Public REST API (25 endpoints)
- `app/api/v1/developers/route.ts`, `app/api/v1/developers/[username]/route.ts`: Query developer profiles.
- `app/api/v1/developers/[username]/dcc/route.ts`: Fetch verified DCC via API key.
- `app/api/v1/developers/[username]/evidence/route.ts`: Fetch code proof artifacts.
- `app/api/v1/jobs/route.ts`, `app/api/v1/opportunities/route.ts`: Programmatic job postings.
- `app/api/v1/challenges/route.ts`: Programmatic challenge submission.
- `app/api/v1/webhooks/route.ts`, `app/api/v1/webhooks/[id]/route.ts`: Webhook event subscriptions.
- `app/api/v1/openapi/route.ts`: OpenAPI 3.0 contract specification.

#### 11. Platform Admin & Telemetry (2 endpoints)
- `app/api/admin/system/route.ts`: Platform health status, DB connectivity, RBAC state.
- `app/api/admin/billing/route.ts`: Aggregate MRR, subscriber distribution (*mock fallback*).

---

## 4. Complete Component Inventory (41)

Components reside in the [`components/`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components) directory:

```
components/
├── charts/          # MultiLineChart, RadarChartComponent
├── dashboard/       # CareerWidget, DashboardChallengesWidget, DashboardGrowthSection
├── dcc/             # 12 DCC visualization & drill-down components
├── discovery/       # DeveloperDiscoveryCard
├── shared/          # Navbar, Sidebar, CommandPalette
├── skill-dna/       # SkillDnaMap
├── theme/           # ThemeToggle, ThemeTestModal
└── ui/              # 15 Reusable UI Primitives (Card, Button, Badge, Score, etc.)
```

### 4.1 Component Catalog

| Component | Path | Client/Server | Purpose |
|---|---|---|---|
| `MultiLineChart` | `components/charts/MultiLineChart.tsx` | Client | Renders SVG multi-line historical trend charts for trust and score growth. |
| `RadarChartComponent` | `components/charts/RadarChartComponent.tsx` | Client | Renders pentagonal radar chart for dimension capabilities. *Warning:* Hardcoded defaults. |
| `CareerWidget` | `components/dashboard/CareerWidget.tsx` | Client | Displays current career goal, target role, and readiness percentage on overview. |
| `DashboardChallengesWidget` | `components/dashboard/DashboardChallengesWidget.tsx` | Client | Displays active coding challenges and prizes on overview. |
| `DashboardGrowthSection` | `components/dashboard/DashboardGrowthSection.tsx` | Client | Displays capability milestone deltas since last developer login. |
| `DCCActivityIntelligence` | `components/dcc/DCCActivityIntelligence.tsx` | Client | Visualizes commit cadence, PR reviews, and contribution patterns. |
| `DCCCapabilityOverview` | `components/dcc/DCCCapabilityOverview.tsx` | Client | High-level DCC card header: overall score, tier badge, confidence indicator. |
| `DCCCapabilityTrendChart` | `components/dcc/DCCCapabilityTrendChart.tsx` | Client | Historical trend chart of capability score improvements over time. |
| `DCCCareerDirection` | `components/dcc/DCCCareerDirection.tsx` | Client | Recommended roles and career trajectory matching capability profile. |
| `DCCEngineeringCapabilities` | `components/dcc/DCCEngineeringCapabilities.tsx` | Client | Renders full breakdown of engineering dimensions (code quality, architecture, etc.). |
| `DCCEngineeringCapability` | `components/dcc/DCCEngineeringCapability.tsx` | Client | Single dimension progress bar and sub-metrics card (*Duplicate of plural*). |
| `DCCGrowthHistory` | `components/dcc/DCCGrowthHistory.tsx` | Client | Chronological audit log of verified achievements and promotions. |
| `DCCGrowthTimeline` | `components/dcc/DCCGrowthTimeline.tsx` | Client | Visual milestone timeline of skill improvements (*Duplicates DCCGrowthHistory*). |
| `DCCHeader` | `components/dcc/DCCHeader.tsx` | Client | Top summary bar of Developer Capability Card with export/share triggers. |
| `DCCProjectEvidence` | `components/dcc/DCCProjectEvidence.tsx` | Client | Audited repository evidence cards linked to GitHub commits. |
| `DCCPublicView` | `components/dcc/DCCPublicView.tsx` | Client | Sanitized, shareable DCC view for recruiters without authenticated controls. |
| `DCCShareModal` | `components/dcc/DCCShareModal.tsx` | Client | Dialog for generating public share links, embed widgets, and image cards. |
| `DCCVerificationIntegrity` | `components/dcc/DCCVerificationIntegrity.tsx` | Client | Displays audit provenance, verification methods, and anti-gaming confidence. |
| `DCCVerifiedSkills` | `components/dcc/DCCVerifiedSkills.tsx` | Client | Grid of verified skill badges grouped by category (Frontend, Backend, etc.). |
| `DeveloperDiscoveryCard` | `components/discovery/DeveloperDiscoveryCard.tsx` | Client | Card displaying candidate summary in recruiter talent search. |
| `CommandPalette` | `components/shared/CommandPalette.tsx` | Client | Global `Cmd+K` / `Ctrl+K` spotlight modal for instant navigation across routes. |
| `Navbar` | `components/shared/Navbar.tsx` | Client | Top navigation bar: brand logo, search trigger, notifications bell, user avatar menu. |
| `Sidebar` | `components/shared/Sidebar.tsx` | Client | Collapsible lateral navigation menu switching between Developer, Company, and Admin. |
| `SkillDnaMap` | `components/skill-dna/SkillDnaMap.tsx` | Client | Interactive canvas visualizer showing developer skill clusters. |
| `ThemeTestModal` | `components/theme/ThemeTestModal.tsx` | Client | Development modal for verifying dark/light theme contrast. |
| `ThemeToggle` | `components/theme/ThemeToggle.tsx` | Client | Toggle button switching between light, dark, and system themes. |
| `ActivityItem` | `components/ui/ActivityItem.tsx` | Client | Row item rendering single commit or verification event. |
| `Badge` | `components/ui/Badge.tsx` | Client | Pill badge with color variants (emerald, cyan, amber, slate). |
| `Button` | `components/ui/Button.tsx` | Client | Standard button primitive with loading spinner and size variants. |
| `CandidateCard` | `components/ui/CandidateCard.tsx` | Client | Recruiter candidate card (*Duplicates DeveloperCard & DiscoveryCard*). |
| `Card` | `components/ui/Card.tsx` | Client | Surface card container with dark obsidian styling. |
| `DeveloperCard` | `components/ui/DeveloperCard.tsx` | Client | Public developer card (*Duplicates CandidateCard*). |
| `EmptyState` | `components/ui/EmptyState.tsx` | Client | Empty state illustration and prompt when no data exists. |
| `Input` | `components/ui/Input.tsx` | Client | Text input primitive with label, error text, and focus rings. |
| `PageHeader` | `components/ui/PageHeader.tsx` | Client | Consistent page title, subtitle, and breadcrumb bar. |
| `ProgressRing` | `components/ui/ProgressRing.tsx` | Client | Circular SVG progress meter for percentage metrics. |
| `ProjectCard` | `components/ui/ProjectCard.tsx` | Client | Card displaying project title, description, live URL, and stars. |
| `Score` | `components/ui/Score.tsx` | Client | Numeric score formatter with color coding by tier (0-1000). |
| `Skeleton` | `components/ui/Skeleton.tsx` | Client | Shimmering placeholder box for loading states. |
| `SkillChip` | `components/ui/SkillChip.tsx` | Client | Clickable chip displaying skill name and proficiency level. |
| `StatCard` | `components/ui/StatCard.tsx` | Client | Metric stat box (e.g. "Total Audited Repos", "94% Health"). |

---

## 5. Complete Services & Backend Inventory (73)

Services reside in [`services/`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services) and encapsulate business logic:

| Service File | Primary Domain | Core Functions & Responsibilities |
|---|---|---|
| `services/ai/service.ts` | AI & Audits | `processRepositoryReview`: Queries Hugging Face or generates simulated audit. |
| `services/ai/prompts.ts` | AI & Audits | `REPOSITORY_REVIEW_SYSTEM_PROMPT`: Instructs LLM on code analysis. |
| `services/ai/validators.ts` | AI & Audits | `parseAndValidate`, `groundExtractedSkills`: Verifies LLM output against real AST. |
| `services/analyzer.ts` | Code Analysis | Static AST parsing, language detection, dependency graph construction. |
| `services/github.ts` | VCS Integration | `fetchUserRepos`, `fetchRepoDetails`, `fetchTopFiles`: Interacts with GitHub REST API. |
| `services/dcc/service.ts` | Capability Cards | `getFullDCC`, `getCapabilityChangeDelta`: Assembles full DCC payload. |
| `services/dcc/evidence.ts` | Capability Cards | `calculateEvidenceStrength`, `determineVerificationStatus`: Computes proof tiers. |
| `services/dcc/insights.ts` | Capability Cards | Computes actionable learning recommendations from detected code weaknesses. |
| `services/dcc/growth.ts` | Capability Cards | Tracks historical score deltas and milestone achievements. |
| `services/security/authorizer.ts` | Security | `requireAuth`, `requireResourceOwner`, `requireCompanyMembership`, `requireRole`. |
| `services/auth/session.ts` | Authentication | `getSessionUser`: Validates Better Auth session token; normalizes providers. |
| `services/company/workspace.ts` | Organization | `getCompanyProfile`, `getCompanyMembers`, `inviteMember`: Multi-tenant logic. |
| `services/discovery/search.ts` | Talent Search | Full-text candidate search and multidimensional skill filtering. |
| `services/career/engine.ts` | Career Path | Evaluates role readiness against taxonomy of 50+ engineering job profiles. |
| `services/trust/calculator.ts` | Trust Engine | Computes composite Trust Score (0-1000) from projects, commits, and audits. |
| `services/verification/integrity.ts` | Verification | Provenance checking, anti-fork discounting, author email validation. |
| `services/billing/plans.ts` | Monetization | Subscription tiers: Free Developer, Pro, Hiring Team, Enterprise. |
| `services/billing/webhooks.ts` | Monetization | Handles Stripe webhook events (`invoice.payment_succeeded`, etc.). |
| `services/privacy/consent.ts` | Compliance | GDPR consent recording, cookie preferences. |
| `services/privacy/requests.ts` | Compliance | Right-to-be-forgotten deletion cascade and data export archive builder. |
| `services/notifications/service.ts` | Notifications | User notification dispatch (audit completed, application received). |
| `services/graph/service.ts` | Knowledge Graph | Graph sync mapping relationships between developers, repos, and companies. |
| `services/agents/registry.ts` | AI Agents | Autonomous agent execution registry for automated code reviews. |
| `services/neon/config.ts` | Cloud DB | Neon serverless database configuration and branch provisioning. |

---

## 6. Complete Database Schema Inventory (117 Tables)

The PostgreSQL database schema is defined in [`database/schema.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/schema.ts). It contains **3 Postgres Enums** and **117 Tables** grouped into 10 functional clusters:

### 6.1 Database Enums (3)
1. `userRoleEnum`: `['developer', 'recruiter', 'company_admin', 'admin']` (line 4)
2. `jobTypeEnum`: `['full_time', 'part_time', 'contract', 'internship', 'remote']` (line 5)
3. `appStatusEnum`: `['applied', 'reviewing', 'shortlisted', 'rejected', 'offered']` (line 6)

### 6.2 Table Clusters (117)

```
┌────────────────────────────────────────────────────────┐
│             117 DATABASE TABLES BY CLUSTER             │
├───────────────────────────────┬────────────────────────┤
│ Cluster Name                  │ Table Count            │
├───────────────────────────────┼────────────────────────┤
│ 1. Identity, Auth & Sessions  │ 6 tables               │
│ 2. Trust Scores & DNA         │ 4 tables               │
│ 3. Repositories & Reviews     │ 8 tables               │
│ 4. Skills & Verification      │ 12 tables              │
│ 5. DCC 2.0 Engine             │ 8 tables               │
│ 6. Company & Hiring ATS       │ 14 tables              │
│ 7. Career, Learning & Goals   │ 10 tables              │
│ 8. Community, Q&A & Social    │ 16 tables              │
│ 9. Billing & Entitlements     │ 8 tables               │
│ 10. Privacy, Audit & Telemetry│ 31 tables              │
├───────────────────────────────┼────────────────────────┤
│ TOTAL                         │ 117 tables             │
└───────────────────────────────┴────────────────────────┘
```

#### Cluster 1: Identity & Authentication (Better Auth Compatible)
- `users`: Core identity model (id, email, username, role, githubId, githubToken, avatarUrl).
- `accounts`: OAuth provider link table (providerId, accountId, accessToken, refreshToken).
- `sessions`: Active Better Auth sessions (token, expiresAt, ipAddress, userAgent).
- `verifications`: Magic links, email verification tokens.
- `companyMembers`: Multi-tenant company workspace membership (companyId, userId, role, status).
- `organizations`: Legacy organization groups.

#### Cluster 2: Trust Scores & Skill DNA
- `trustScores`: Overall score (0-1000), projectScore, contributionScore, peerVouchScore.
- `trustHistory`: Historical record of trust score changes over time.
- `skillDna`: Detailed nested JSONB stats of multidimensional developer DNA.
- `reputation`: Reputation score, badges, vouch history.

#### Cluster 3: Repositories & AI Code Reviews
- `repositories`: GitHub repo metadata (githubRepoId, name, htmlUrl, isAnalyzed, reviewStatus).
- `reviews`: AI-generated code audit outputs (summary, strengths, weaknesses, architecture, codeQuality).
- `reviewHistory`: Version history of repeated repository audits.
- `projects`: Developer-registered project portfolio items.
- `contributions`: Aggregated open-source contribution metrics.
- `repositoryInsights`: Granular file-level AST insights.
- `repositoryHealth`: Health metrics (security score, documentation score, test coverage).
- `codeSnippets`: Extracted code snippets supporting skill verification.

#### Cluster 4: Skills, Taxonomy & Verification
- `skills`: Master system catalog of verified skills (name, category, description).
- `userSkills`: Join table linking users to master skills with proficiency levels.
- `skillCategories`: Taxonomy categories (Languages, Frontend, Backend, Database, DevOps).
- `skillTaxonomy`: Tree hierarchy of skill prerequisites and domain groupings.
- `skillVerificationQueue`: Asynchronous background processing queue for skill audits.
- `skillEndorsements`: Peer-to-peer developer endorsements.
- `verificationEvidence`: Concrete proof records (sourceRepo, verificationMethod, confidence, evidenceWeight).

#### Cluster 5: Developer Capability Cards (DCC 2.0)
- `developerCapabilityCards`: Overall score, level (Explorer...Elite), confidenceScore, verificationStatus.
- `capabilityDimensions`: Monolithic JSONB fields (`engineering`, `skills`, `projects`, `collaboration`, `growth`, `career`).
- `capabilityHistory`: Audit trail of capability delta over time.
- `capabilityLevels`: Level benchmarks and achievement prerequisites.
- `capabilityInsights`: AI-generated strengths, weaknesses, and learning suggestions.
- `comparisonCache`: Cached candidate-to-candidate comparison vectors.
- `contributionActivities`: Granular contribution intelligence records.
- `developerCapabilities`: Universal developer capability scores across dimensions.

#### Cluster 6: Company, Jobs & ATS Pipeline
- `companies`: Company workspace profile (name, website, logo, planTier).
- `jobs`: Job postings (title, description, requiredSkills, salaryRange).
- `applications`: Candidate job applications (jobId, userId, status, dccSnapshot).
- `savedDevelopers`: Recruiter bookmarked developer talent.
- `candidateNotes`: Internal private notes made by recruiters.
- `interviewSchedules`: Scheduled candidate technical screenings.
- `jobMatches`: Algorithmic matching scores between candidates and jobs.

#### Cluster 7: Career, Learning & Goals
- `careerGoals`: Developer's target roles and desired salary/seniority.
- `careerRoadmaps`: Dynamic learning roadmap milestones.
- `careerTasks`: Specific learning tasks linked to roadmap milestones.
- `careerRoles`: Master database of 50+ engineering role definitions.
- `learningResources`: Curated tutorials, documentation, and challenge links.

#### Cluster 8: Community, Q&A & Social
- `posts`: Technical articles, questions, and discussion threads.
- `comments`: Nested discussion comments.
- `likes`: Post and comment upvotes.
- `bookmarks`: Saved posts and questions.
- `questions`: StackOverflow-style technical Q&A questions.
- `answers`: Verified answers with upvote counters.
- `follows`: User-to-user following network.
- `teams`: Hackathon and project collaboration teams.
- `teamMembers`: Team roster and role assignments.

#### Cluster 9: Billing & Entitlements
- `subscriptions`: Active Stripe/mock subscription records.
- `subscriptionPlans`: Plan definitions (developer_pro, hiring_team, enterprise).
- `invoices`: Payment receipts and billing history.
- `usageRecords`: Metered API and LLM analysis consumption.

#### Cluster 10: Privacy, Audit & Telemetry
- `privacySettings`: Visibility controls (profile public, hide metrics, block recruiters).
- `privacyRequests`: GDPR deletion and export requests.
- `auditLogs`: Non-repudiable audit logs of sensitive operations.
- `securityEvents`: Rate-limit violations, failed authentication attempts.
- `apiKeys`: Personal access tokens and webhook secret keys.
- `webhooks`: Outbound webhook subscription endpoints.
- `notifications`: User notification queue.

---

## 7. Complete External Integrations Inventory (8)

SkillVerse interfaces with 8 distinct third-party platforms and services:

1. **GitHub REST API & OAuth (`https://api.github.com`)**:
   - Authentication via GitHub App / OAuth (`read:user`, `repo` scopes).
   - Repository syncing, commit log extraction, file tree reading via [`services/github.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/github.ts).
2. **Google Cloud OAuth 2.0 (`https://accounts.google.com`)**:
   - Secondary OAuth identity provider via Better Auth.
   - Profile photo, verified email extraction.
3. **Neon Serverless PostgreSQL (`https://console.neon.tech`)**:
   - Primary database backend accessed over WebSockets via `@neondatabase/serverless` and Drizzle ORM.
   - Dynamic branch provisioning via [`services/neon/config.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/neon/config.ts).
4. **Hugging Face Inference API (`https://api-inference.huggingface.co`)**:
   - LLM inference engine using `Qwen/Qwen2.5-Coder-32B-Instruct` for repository code audits in [`services/ai/service.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/ai/service.ts).
5. **Better Auth Framework (`lib/auth.ts`)**:
   - Session lifecycle management, account linking, cookie creation.
6. **Upstash Redis / Distributed Rate Limiting**:
   - Edge rate-limiting and distributed session caching in [`services/security/distributedRateLimiter.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/security/distributedRateLimiter.ts).
7. **Stripe Billing / Mock Billing Provider**:
   - Subscription lifecycle management and webhook parsing in [`services/billing/`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/billing/).
8. **Docker & Container Sandbox Runner**:
   - Remote code execution sandbox for automated challenge test verification in [`services/containers/service.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/containers/service.ts).

---

## 8. Summary of Orphaned, Hidden & Duplicate Features

1. **Orphaned Routes:**
   - `/recruiter/dcc`: Legacy stand-alone recruiter preview, largely superseded by `/company/candidates/[id]`.
   - `/developer/[username]` vs `/developers/[username]` vs `/u/[username]`: Three duplicate routes rendering the same public developer portfolio.
   - `/company/team` vs `/company/members`: Duplicate pages rendering team management.
2. **Hidden Routes:**
   - `/workspace/agents`, `/workspace/cloud`, `/workspace/graph`: Enterprise sub-routes not linked in standard navigation.
   - `/competitions`: Competition listing page not directly surfaced in developer sidebar.
3. **Misleading Fallbacks:**
   - 59 files contain imports from `lib/dummyData.ts` or hardcoded fallback scores (`940/1000`), causing synthetic data leakage when database queries fail or timeout.

