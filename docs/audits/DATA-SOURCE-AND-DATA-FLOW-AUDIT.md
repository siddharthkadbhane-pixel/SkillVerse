# SKILLVERSE — DATA SOURCE CLASSIFICATION & DATA FLOW AUDIT

**Workspace:** `D:\ANTIGRAVITY PROJECT\Sillverse`  
**Audit Date:** November 2026  
**Audit Focus:** Complete Data Flow, Data Source Classification & Fake Data Inventory (Part 4)  
**Status:** Complete & Final Discovery Report  

---

## 1. Data Source Classification Taxonomy

Every data point displayed on SkillVerse has been investigated and classified into one of seven objective categories:

| Data Classification | Formal Definition | Production Acceptability |
|---|---|---|
| **REAL DATABASE DATA** | Directly fetched from Neon Serverless PostgreSQL via Drizzle ORM queries scoped to the user or organization. | **Fully Production Ready** |
| **REAL EXTERNAL API DATA** | Retrieved from a verified external service API (e.g., GitHub REST API, Hugging Face LLM). | **Fully Production Ready** |
| **DERIVED DATA** | Statistically computed in memory from real database records (e.g., percentile rankings, aggregations). | **Fully Production Ready** |
| **STATIC CONFIGURATION** | Immutable system metadata (e.g., available role enums, UI themes, icon mappings). | **Fully Production Ready** |
| **MOCK DATA (DEV ONLY)** | Controlled fixtures in test scripts or seeded dev environments (`process.env.NODE_ENV !== 'production'`). | **Acceptable in Dev Only** |
| **HARDCODED DATA** | Static strings, scores, or arrays hardcoded directly inside frontend components (e.g. `score: 940`). | **Defective / Unacceptable** |
| **SYNTHETIC FALLBACK DATA** | Code that catches database errors or null results and silently substitutes fake high scores. | **Critical Defect / Misleading** |

---

## 2. Key Metrics & Data Point Traceability Matrix

The following table traces the 15 primary metrics across SkillVerse through the complete lifecycle:  
`User Action ➔ Component ➔ API Route ➔ Service ➔ Database Table ➔ Classification`

| Metric / UI Element | Display Component | API Route | Backing Service | Database Table | Classification | Failure / Missing Data Behavior |
|---|---|---|---|---|---|---|
| **Developer Trust Score** | `Sidebar.tsx`, `OverviewPage` | `/api/profile` | Direct DB query | `trustScores` | **MIXED:** Real DB or **Synthetic Fallback** | If null, falls back to `{ overallScore: 940, projectScore: 960 }`. Displays false 940 score. |
| **Radar Dimension Scores** | `RadarChartComponent.tsx` | Props from `/overview` | Direct DB query | `skillDna` | **MIXED:** Real DB or **Hardcoded Default** | If props empty, defaults to `{ Frontend: 96, Backend: 94, Database: 92, Tools: 88, CS: 95 }`. |
| **Verified Skill Badges** | `DCCVerifiedSkills.tsx` | `/api/dcc` | `DCCEvidenceService` | `userSkills` + `skills` | **REAL DATABASE DATA** | Empty array rendered with `EmptyState` component. |
| **Codebase Health Benchmark** | `app/(dashboard)/repositories/[id]` | `/api/repositories/[id]/review` | `AiReviewService` | `reviews.healthScores` | **MIXED:** Real AI or **Simulated Fallback** | In production, fails if HF key missing; in dev, generates mock review with 83/100 score. |
| **Repository Commit Velocity** | `app/(dashboard)/activity` | `/api/activity/sync` | `GitHubService` | `contributions` | **REAL EXTERNAL API DATA** | Fetches live from GitHub; updates local DB cache. |
| **DCC Overall Score & Level** | `DCCCapabilityOverview.tsx` | `/api/dcc` | `DeveloperCapabilityCardService` | `developerCapabilityCards` | **MIXED:** Real DB or **Synthetic Fallback** | If missing, calls `getDummyDCCData('00000000-0000-0000-0000-000000000001')`. |
| **Milestone Growth Deltas** | `DashboardGrowthSection.tsx` | `/api/dashboard/growth` | `CapabilityGrowthService` | `capabilityHistory` | **REAL DATABASE DATA** | Returns empty delta (`hasChanges: false`) if no records exist. |
| **Career Goal Readiness** | `CareerWidget.tsx`, `career/page` | `/api/career/progress` | `CareerEngine` | **None** (In-Memory Mock) | **MOCK DATA** | Bypasses database! Reads from `dummyData.ts`. Edits are lost on refresh. |
| **Open Job Postings** | `app/(dashboard)/jobs` | `/api/jobs` | Direct DB query | `jobs` + `companies` | **REAL DATABASE DATA** | Returns empty list if no active jobs exist. |
| **Recruiter Talent Pool** | `DeveloperDiscoveryCard.tsx` | `/api/candidates/search` | `SearchService` | `users` + `developerCapabilityCards` | **REAL DATABASE DATA** | Properly filtered by privacy settings and search terms. |
| **Candidate Comparison Matrix** | `app/(dashboard)/company/compare` | `/api/dcc/comparison` | `DeveloperCapabilityCardService` | `comparisonCache` | **MIXED:** Real DB or **Synthetic Fallback** | If DB fails, falls back to `getDummyUser` with 940 score. |
| **Company ATS Pipeline** | `CandidateCard.tsx` | `/api/company/applications` | `CompanyWorkspaceService` | `applications` | **REAL DATABASE DATA** | Scoped to active company membership via `requireCompanyMembership`. |
| **Company Team Members** | `app/(dashboard)/company/members` | `/api/company/members` | `CompanyWorkspaceService` | `companyMembers` + `users` | **REAL DATABASE DATA** | Scoped strictly to company workspace. |
| **Admin System Health** | `app/(dashboard)/admin` | `/api/admin/system` | `HealthService` | Neon DB ping (`SELECT 1`) | **REAL DATABASE DATA** | Returns true/false database connectivity state. |
| **Admin MRR & Subscribers** | `app/(dashboard)/admin` | `/api/admin/billing` | `BillingWebhookService` | **None** (Hardcoded array) | **HARDCODED DATA** | Returns hardcoded `$15,758` MRR and 4,454 active subscriptions. |

---

## 3. Comprehensive Inventory of Fake, Mock & Synthetic Data (59 Files)

A project-wide scan identified **59 files** actively referencing `dummyData.ts`, `DUMMY_USERS`, `DUMMY_REPOSITORIES`, `getDummyDCCData`, or hardcoded `940` scores:

```
┌────────────────────────────────────────────────────────┐
│      59 FILES WITH FAKE / SYNTHETIC DATA LEAKAGE       │
├───────────────────────────────┬────────────────────────┤
│ Subsystem Category            │ File Count             │
├───────────────────────────────┼────────────────────────┤
│ Frontend Pages (app/)         │ 14 pages               │
│ API Route Handlers (app/api/) │ 19 routes              │
│ UI & DCC Components           │ 8 components           │
│ Backend Services              │ 12 services            │
│ Scripts & Test Suites         │ 6 scripts              │
├───────────────────────────────┼────────────────────────┤
│ TOTAL                         │ 59 files               │
└───────────────────────────────┴────────────────────────┘
```

### 3.1 Primary Culprits & File Locations

#### 1. The Mock Motherlode: `lib/dummyData.ts` (1,020 lines)
Contains extensive mock objects that simulate an entire database in memory:
- `DUMMY_USERS`: 6 hardcoded user profiles (Siddharth Kadbhane, Sarah Chen, Alex Rivera, Elena Rostova, Marcus Vance, David Kim).
- `DUMMY_REPOSITORIES`: 15 mock repositories with fake star counts, commit histories, and review summaries.
- `DUMMY_DCC_DATA`: Hardcoded DCC objects where every profile has an overall score of `940` (Level: Elite).
- `DUMMY_JOBS`, `DUMMY_CHALLENGES`, `DUMMY_TEAMS`, `DUMMY_NOTIFICATIONS`.

#### 2. Frontend Pages Consuming Mock Data in Production Code
- [`app/(dashboard)/overview/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/overview/page.tsx#L43):
  `const dcc = getDummyDCCData('00000000-0000-0000-0000-000000000001');`
- [`app/(dashboard)/career/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/career/page.tsx#L48):
  Imports `DUMMY_USERS` and hardcodes current user score to `940`.
- [`app/(dashboard)/company/candidates/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/candidates/[id]/page.tsx):
  If candidate not found in database, loads mock candidate from `DUMMY_USERS`.
- [`app/(dashboard)/company/jobs/[jobId]/match/[candidateId]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/jobs/[jobId]/match/[candidateId]/page.tsx):
  Directly uses `DUMMY_REPOSITORIES` to calculate match percentages.
- [`app/(dashboard)/network/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/network/page.tsx):
  Renders developer network directly from `DUMMY_USERS`.
- [`app/(dashboard)/github/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/github/page.tsx):
  Falls back to `DUMMY_REPOSITORIES` if user has not synced GitHub.
- [`app/(dashboard)/projects/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/projects/page.tsx):
  Uses `DUMMY_REPOSITORIES` as project data source.
- [`app/(dashboard)/skill-dna/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/skill-dna/page.tsx):
  Uses `getDummyDCCData` to render the DNA visualizer.

#### 3. API Routes Returning Synthetic Fallbacks
- [`app/api/profile/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/profile/route.ts#L98-L104):
  Returns fallback trust score `{ overallScore: 940, projectScore: 960, contributionScore: 920 }` when database query returns null.
- [`app/api/repositories/[id]/review/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/repositories/[id]/review/route.ts#L78-L102):
  Catches DB lookup errors and returns `mockResult` with `overallScore: 83, confidenceScore: 90`.
- [`app/api/dcc/comparison/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/dcc/comparison/route.ts):
  Calls `getDummyDCCData` if candidates are not found in DB.
- [`app/api/admin/billing/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/admin/billing/route.ts#L22-L42):
  Hardcodes plan distribution: 4,120 Developer Free, 284 Pro ($3,408), 42 Hiring ($8,358), 8 Enterprise ($3,992). Total MRR: $15,758.
- [`app/api/career/tasks/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/career/tasks/route.ts) & all 7 `api/career/*` routes:
  Operate entirely on `DUMMY_USERS` in-memory structures.

---

## 4. Legitimate Test Fixtures vs. Misleading Production Data

SkillVerse contains two fundamentally different uses of non-production data that must be distinguished:

### Category A: Legitimate Test Fixtures (To Be Kept)
- Scripts located in [`scripts/`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/scripts):
  - `scripts/test-rbac-enforcement.ts`
  - `scripts/test-google-auth.ts`
  - `scripts/test-phase45-p0-remediation.ts`
- These files create isolated mock request objects (`new NextRequest(...)`) specifically to assert middleware and authorization logic in automated CI testing. They do not contaminate runtime database records or user-facing views.

### Category B: Misleading Production Fallbacks (To Be Eliminated)
- Fallback clauses inside production API handlers (e.g. `catch { return mockResult }`).
- Components that render hardcoded scores (`940`) when props are missing.
- Pages that import `DUMMY_USERS` and display fake peer networks on real user dashboards.
- **Architectural Mandate:** In production (`process.env.NODE_ENV === 'production'`), if a database record does not exist or fails to load, the system must render an empty state or return an HTTP 404/503. Silently serving synthetic data destroys platform credibility.

---

## 5. Environment Variables Inventory & Security Audit

The application reads **19 distinct environment variables**. Below is their complete inventory, functional purpose, and security classification:

| Environment Variable Name | Consuming File(s) | Functional Purpose | Required in Prod? | Security Classification |
|---|---|---|---|---|
| `BETTER_AUTH_SECRET` | `lib/auth.ts` | Master cryptographic key used by Better Auth to sign session cookies and tokens. | **YES (Strict)** | **CRITICAL SECRET** (Must be >= 32 chars with high entropy). |
| `BETTER_AUTH_URL` | `lib/auth.ts` | Canonical base URL of the application (e.g. `https://skillverse.com`). | **YES** | Public URL (Must use HTTPS in prod). |
| `DATABASE_URL` | `lib/drizzle.ts`, `lib/db-config.ts` | PostgreSQL connection string for Neon Serverless database. | **YES (Strict)** | **CRITICAL SECRET** (Contains DB username, password, host). |
| `GITHUB_CLIENT_ID` / `GITHUB_ID` | `lib/auth.ts` | OAuth Client ID for GitHub App sign-in. | **YES** | Public Client Identifier. |
| `GITHUB_CLIENT_SECRET` / `GITHUB_SECRET`| `lib/auth.ts` | OAuth Client Secret for GitHub App authentication. | **YES (Strict)** | **CRITICAL SECRET**. |
| `GITHUB_ACCESS_TOKEN` | `app/api/repositories/*` | Fallback personal access token for unauthenticated GitHub repo crawling. | No (Optional) | **HIGH SECRET**. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_ID` | `lib/auth.ts` | OAuth 2.0 Client ID for Google login. | **YES** | Public Client Identifier. |
| `GOOGLE_CLIENT_SECRET` / `GOOGLE_SECRET`| `lib/auth.ts` | OAuth 2.0 Client Secret for Google authentication. | **YES (Strict)** | **CRITICAL SECRET**. |
| `HUGGINGFACE_API_KEY` | `services/ai/service.ts` | API token for Hugging Face Inference API for LLM code reviews. | **YES** | **HIGH SECRET** (Missing in prod aborts reviews). |
| `HUGGINGFACE_MODEL` | `services/ai/service.ts` | Model ID (defaults to `Qwen/Qwen2.5-Coder-32B-Instruct`). | No (Defaulted) | Configuration String. |
| `NEXT_PUBLIC_APP_URL` | `lib/auth.ts`, `next.config.ts` | Public client base URL. | **YES** | Public URL. |
| `NODE_ENV` | Global | Runtime environment mode (`development`, `production`, `test`). | **YES** | Runtime Flag. |
| `ENABLE_DEMO_AUTH` | `services/auth/session.ts` | Flag allowing demo test user switcher (strictly disabled in prod). | No | Security Boundary Toggle. |
| `UPSTASH_REDIS_REST_URL` | `services/security/distributedRateLimiter.ts` | Redis URL for distributed edge rate limiting. | Optional | Service Endpoint URL. |
| `UPSTASH_REDIS_REST_TOKEN` | `services/security/distributedRateLimiter.ts` | Access token for Upstash Redis cluster. | Optional | **HIGH SECRET**. |
| `STRIPE_SECRET_KEY` | `services/billing/providers/stripe.ts` | Stripe API private key for payment processing. | Optional (Mock used)| **CRITICAL SECRET**. |
| `STRIPE_WEBHOOK_SECRET` | `app/api/billing/webhook/route.ts` | Stripe signature secret for verifying webhook payloads. | Optional | **CRITICAL SECRET**. |
| `NEXT_PUBLIC_GA_ID` | `app/layout.tsx` | Google Analytics measurement ID. | Optional | Public Tracking ID. |
| `LOG_LEVEL` | `lib/logger.ts` | Application log verbosity (`debug`, `info`, `warn`, `error`). | No | Configuration String. |

*Security Assurance:* No secrets, database passwords, or private environment values are hardcoded in the repository or exposed in this audit report.

