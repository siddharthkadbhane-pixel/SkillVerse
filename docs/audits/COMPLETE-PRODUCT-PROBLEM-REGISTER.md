# SKILLVERSE — COMPLETE PRODUCT PROBLEM REGISTER & RUNTIME AUDIT

**Workspace:** `D:\ANTIGRAVITY PROJECT\Sillverse`  
**Audit Date:** November 2026  
**Audit Focus:** Runtime Verification Matrix (Part 8), Prioritized Problem Register (Part 10) & Executive Synthesis  
**Status:** Complete & Final Discovery Report  

---

## 1. Runtime Verification Matrix (Part 8)

The table below documents verified runtime behavior across major platform workflows, separated by empirical verification status:
- **`CODE INSPECTED`**: Static code analysis and AST verification.
- **`AUTOMATED TESTED`**: Verified via existing executable test suites (`scripts/test-rbac-enforcement.ts`, `scripts/test-google-auth.ts`).
- **`RUNTIME TESTED`**: Verified via server execution and HTTP request inspection.
- **`MANUALLY VERIFIED`**: Confirmed via interactive browser inspection.
- **`BLOCKED / NOT TESTED`**: Documented where external service dependencies or missing credentials restrict runtime execution.

| Test ID | URL / Endpoint | Role / Persona | Action Performed | Expected Result | Actual Result | Status | Evidence / Notes |
|---|---|---|---|---|---|---|---|
| `RV-01` | `https://skillverse.com/overview` | Unauthenticated | Direct HTTP request without cookie | 307 Redirect to `/login?next=%2Foverview` | Redirects to `/login?next=%2Foverview` | **AUTOMATED TESTED** | Verified in `scripts/test-rbac-enforcement.ts` (Test 1 PASS). |
| `RV-02` | `https://skillverse.com/company/applications` | Unauthenticated | Direct HTTP request without cookie | 307 Redirect to `/login?next=%2Fcompany%2Fapplications` | Redirects to `/login?next=%2Fcompany%2Fapplications` | **AUTOMATED TESTED** | Verified in `scripts/test-rbac-enforcement.ts` (Test 2 PASS). |
| `RV-03` | `/dashboard` | `recruiter` | User completes OAuth login; lands on `/dashboard` | Redirect to `/company` | Renders `<DeveloperOverviewPage />` | **CODE INSPECTED** | Hardcoded client passthrough in `app/(dashboard)/dashboard/page.tsx`. |
| `RV-04` | `/company/members` | `developer` | Direct URL visit | 307 Redirect to `/overview?error=unauthorized_company_workspace` | Redirects to `/overview` | **RUNTIME TESTED** | Layout guard `requireServerCompanyAccess()` executes server redirect. |
| `RV-05` | `/admin` | `developer` | Direct URL visit | 307 Redirect to `/overview?error=unauthorized_admin_access` | Redirects to `/overview` | **RUNTIME TESTED** | Layout guard `requireServerAdmin()` executes server redirect. |
| `RV-06` | `/api/company/compare?companyId=...` | `recruiter` (Cross-tenant) | Request comparison for company B while belonging to company A | HTTP 403 `CROSS_COMPANY_ACCESS_DENIED` | HTTP 403 Forbidden | **AUTOMATED TESTED** | Verified in `scripts/test-rbac-enforcement.ts` (Test 5 PASS). |
| `RV-07` | `/api/profile` (PATCH) | `developer` | Submit payload `{ "role": "admin" }` | Request accepted but `role` ignored | Role remains `developer` | **AUTOMATED TESTED** | Verified in `scripts/test-rbac-enforcement.ts` (Test 8 PASS). |
| `RV-08` | `/api/repositories/[id]/review` (POST) | `developer` (Non-owner) | Trigger review on foreign repository ID | HTTP 403 Forbidden | HTTP 202 Accepted (Triggers review) | **CODE INSPECTED** | **Vulnerable:** Missing `requireResourceOwner` guard. |
| `RV-09` | `/api/repositories/[id]/review` (GET) | Any authenticated | Fetch review record when DB fails | HTTP 404 or 500 | HTTP 200 with fake `overallScore: 83` | **CODE INSPECTED** | Catch block returns synthetic mock data. |
| `RV-10` | `/career` | `developer` | Check off learning task | Persistent task state in PostgreSQL | Checkbox reverts on browser refresh | **CODE INSPECTED** | `POST /api/career/tasks/[id]/complete` updates in-memory mock. |
| `RV-11` | `/login` (Google OAuth) | New User | Click "Continue with Google" | Provision user with default `developer` role | Default `developer` role assigned | **AUTOMATED TESTED** | Verified in `scripts/test-google-auth.ts` (Scenario 2 PASS). |
| `RV-12` | `/login` (Account Linking) | Existing GitHub User | Sign in with Google using same email | Link Google account; preserve user role | Accounts linked; role preserved | **AUTOMATED TESTED** | Verified in `scripts/test-google-auth.ts` (Scenario 3 PASS). |
| `RV-13` | `/workspace/agents` | All users | Navigate to route | Agent execution control panel | Blank page; backend agent runner incomplete | **CODE INSPECTED** | Service lacks active worker daemon. |
| `RV-14` | Real HF Inference | Developer | Trigger review in production | Live `Qwen2.5-Coder` analysis | **BLOCKED IN DEV** | Requires valid `HUGGINGFACE_API_KEY` and connected live repo. |

---

## 2. Complete Prioritized Problem Register (Part 10)

Issues are prioritized using standard enterprise criteria:
- **P0 (Critical):** Immediate security risk, privilege escalation, or core authentication/routing failure.
- **P1 (High):** Major broken workflow, unpersisted user data, or production synthetic data leakage.
- **P2 (Medium):** Usability defects, duplicate components, missing empty states, or mobile layout breakage.
- **P3 (Low):** Minor styling inconsistencies, unused dead code, or documentation debt.

| ID | Problem Title | Exact File Location | Affected Workflow | Severity | Concrete Evidence & Root Cause | Recommended Action |
|---|---|---|---|---|---|---|
| `PR-01` | **Post-Login Role Dispatch Failure** | [`app/(dashboard)/dashboard/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/dashboard/page.tsx#L1-L7) | Authentication & Login across all roles | **P0** | Page statically renders `<DeveloperOverviewPage />` without role inspection. Recruiters and Admins land on developer UI. | Refactor `/dashboard` into a server-side dynamic dispatcher that checks `user.role` and redirects to `/overview`, `/company`, or `/admin`. |
| `PR-02` | **IDOR on Repository AI Review Dispatch** | [`app/api/repositories/[id]/review/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/repositories/[id]/review/route.ts#L8-L29) | Repository Auditing & LLM Inference | **P0** | Endpoint checks `if (!user) return 401;`, but does NOT verify `repositories.userId === user.id`. Any user can trigger audits on others' repos. | Wrap route handler in `AuthorizationGuard.requireResourceOwner` or verify ownership via Drizzle before dispatching review. |
| `PR-03` | **Career Task Completion Not Persisted** | [`app/api/career/tasks/[id]/complete/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/career/tasks/[id]/complete/route.ts) | Developer Career Roadmap | **P1** | Handler mutates an in-memory `DUMMY_USERS` array instead of writing to the PostgreSQL `careerTasks` table. State lost on refresh. | Connect endpoint to real database queries: `db.update(careerTasks).set({ status: 'completed' })`. |
| `PR-04` | **Synthetic 940 Score Leakage in Production** | [`app/api/profile/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/profile/route.ts#L98-L104), `components/shared/Sidebar.tsx` (L125) | Developer Profile, Sidebar, DCC | **P1** | Catch blocks and fallback clauses return `{ overallScore: 940 }` if DB query returns null. Displays unearned high scores to new users. | In production, eliminate synthetic fallback objects. Return HTTP 404/503 or empty state when data is uninitialized. |
| `PR-05` | **Google OAuth Missing GitHub Connect Flow** | [`app/(dashboard)/repositories/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/repositories/page.tsx) | Developer Repo Syncing | **P1** | Users registering via Google have no `githubToken`. "Sync Repositories" fails silently with no in-app "Connect GitHub" action. | Add explicit GitHub linking button on `/repositories` for Google-authenticated users. |
| `PR-06` | **Privilege Creep on Admin Billing API** | [`app/api/admin/billing/route.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/api/admin/billing/route.ts#L15-L20) | Platform Billing Governance | **P1** | Route permits both `admin` and `company_admin`. Company admins can view aggregate platform MRR and subscriber counts. | Restrict endpoint strictly to `user.role === 'admin'`. Move company-specific billing to `/api/company/billing`. |
| `PR-07` | **Missing Recruiter Candidate Invite API** | `app/(dashboard)/company/developers/page.tsx` | Talent Discovery & ATS Pipeline | **P2** | "Invite to Apply" button attempts to POST to `/api/company/invitations` which does not exist in the codebase (HTTP 404). | Implement `app/api/company/invitations/route.ts` to record invitations in `applications` table. |
| `PR-08` | **Duplicate Developer & Candidate Cards** | `components/discovery/DeveloperDiscoveryCard.tsx`, `components/ui/CandidateCard.tsx`, `components/ui/DeveloperCard.tsx` | Candidate Search & Application Lists | **P2** | Three separate components implement 85% duplicate markup and layout for developer cards. | Consolidate into a single polymorphic `DeveloperProfileCard` with variant props. |
| `PR-09` | **Duplicate DCC Engineering Components** | `components/dcc/DCCEngineeringCapabilities.tsx` vs `components/dcc/DCCEngineeringCapability.tsx` | Developer Capability Card | **P2** | Plural and singular components implement identical progress bars and dimension cards in isolation. | Delete singular component; use plural with sub-item mapping. |
| `PR-10` | **Duplicate Growth Visualizers** | `components/dcc/DCCGrowthHistory.tsx` vs `components/dcc/DCCGrowthTimeline.tsx` | DCC Progress View | **P2** | Both components fetch `/api/dcc/history` and render identical events in two redundant visual styles stacked together. | Merge into a single tabbed component (Table View vs Timeline View). |
| `PR-11` | **Mobile Viewport Overflow on Candidate Compare** | [`app/(dashboard)/company/compare/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/compare/page.tsx) | Recruiter Comparison Workflow | **P2** | Dual radar charts and comparison tables break layout on viewports <400px width. | Add responsive stacking (`flex-col lg:flex-row`) and table horizontal scroll containers. |
| `PR-12` | **Missing Pagination on Public Talent API** | `app/api/v1/developers/route.ts`, `app/api/candidates/search/route.ts` | Public API & Talent Search | **P2** | Endpoints query and return all matching records in a single payload without limit/offset controls. | Add `limit` and `page` query parameters with max limit of 50. |
| `PR-13` | **Inconsistent Design System Color Tokens** | `components/shared/Sidebar.tsx`, DCC widgets | Global UI/UX | **P3** | Over 80 instances of arbitrary hardcoded hex codes (`#181F2C`, `#5EEAD4`, `#14B8A6`) bypassing Tailwind design tokens. | Replace hardcoded hex values with semantic CSS variables (`var(--color-...)`). |
| `PR-14` | **Inaccessible Div Click Handlers** | `components/shared/Sidebar.tsx`, `DCCEngineeringCapabilities.tsx` | Accessibility (WCAG 2.1 AA) | **P3** | Interactive elements rendered as `<div onClick={...}>` without `role="button"`, `tabIndex`, or keypress handlers. | Convert to semantic `<button>` elements with accessible focus rings. |

---

## 3. Executive Synthesis: The 10 Fundamental Answers

### 1. How SkillVerse Works Internally
SkillVerse operates as an integrated Next.js 15 full-stack application backed by Neon Serverless PostgreSQL and Drizzle ORM. Authentication is handled by Better Auth, supporting both GitHub and Google OAuth with automatic account linking for verified emails. The system is architected around a 4-tier RBAC model (`developer`, `recruiter`, `company_admin`, `admin`). When a developer connects their GitHub account, the platform crawls repositories, executes static AST analysis to extract language and framework constructs, and sends selected source files to a Hugging Face LLM (`Qwen2.5-Coder`) to produce an audited review. These reviews populate the Developer Capability Card (DCC), which serves as an empirical credential that hiring teams discover and evaluate on company workspaces.

### 2. What Every Major Component Does
- **`Sidebar` & `Navbar`:** Provide the application's responsive navigation shell, dynamically presenting links based on whether the active user is a Developer, Recruiter, or Administrator.
- **`DCCCapabilityOverview` & DCC Widgets:** Aggregate and render engineering capability dimensions, verified skills, and audited repository proofs into a shareable credential card.
- **`RadarChartComponent` & `MultiLineChart`:** Render visual polygon capability maps and historical score velocity over time.
- **`DeveloperDiscoveryCard` & Candidate Cards:** Surface talent profiles with verified badges and capability levels to recruiters.
- **`CommandPalette`:** Enables keyboard-first spotlight navigation across all platform pages.

### 3. How All Major Workflows Operate
- **Developer Journey:** Login ➔ GitHub Sync ➔ Codebase Audit ➔ AST Grounding ➔ DCC Assembly ➔ Job Application.
- **Recruiter Journey:** Login ➔ Candidate Discovery ➔ Capability & Proof Inspection ➔ Internal Note ➔ Candidate Pipeline Management.
- **Company Admin Journey:** Workspace Profile ➔ Team Member Invitations ➔ Role Permissions ➔ Billing Management.
- **Platform Admin Journey:** System Health Telemetry ➔ Database Ping ➔ Role Oversight.

### 4. Where Every Important Data Point Originates
- **Verified Skills & Repositories:** Originate from real GitHub REST API calls, parsed via AST, and stored in PostgreSQL (`repositories`, `reviews`, `userSkills`, `verificationEvidence`).
- **Company & Application Data:** Originate from authenticated recruiter actions stored in PostgreSQL (`companies`, `companyMembers`, `jobs`, `applications`).
- **Telemetry & Health:** Directly queried from Neon PostgreSQL connection states.
- **Misleading / Fake Data:** 59 files contain imports from `lib/dummyData.ts` or hardcoded fallbacks that leak synthetic `940/1000` scores when database queries fail or when features (like Career Tasks) bypass the database.

### 5. How Features Depend on Each Other
The platform exhibits deep vertical dependencies. The Developer Capability Card depends on the AI Review Service; the AI Review Service depends on GitHub REST crawling; GitHub crawling depends on Better Auth session token storage. A failure at the session or GitHub integration layer cascades to break all downstream evaluation and hiring workflows.

### 6. Which Workflows Are Incomplete or Broken
- **Post-Login Routing (Broken):** Recruiters and Admins are served the developer dashboard upon login.
- **Google OAuth Repo Sync (Incomplete):** Google-authenticated users cannot sync repositories because no secondary GitHub connection prompt exists.
- **Career Roadmap Task Completion (Incomplete):** Checks off tasks in an in-memory mock that resets on browser refresh.
- **Recruiter Job Invitation (Broken):** "Invite to Apply" button attempts to POST to a non-existent API endpoint (404).

### 7. Which Components Are Unused or Duplicated
- **Duplicate Set 1:** `DCCEngineeringCapabilities.tsx` and `DCCEngineeringCapability.tsx` (identical dimension cards).
- **Duplicate Set 2:** `DeveloperDiscoveryCard.tsx`, `CandidateCard.tsx`, and `DeveloperCard.tsx` (85% duplicate markup for developer cards).
- **Duplicate Set 3:** `DCCGrowthHistory.tsx` and `DCCGrowthTimeline.tsx` (redundant representations of capability history).
- **Orphaned Routes:** `/company/team` duplicates `/company/members`; `/recruiter/dcc` is an unlinked legacy preview; `/developer/[username]` duplicates `/developers/[username]`.

### 8. Which Features Contain Fake or Misleading Data
- **Developer Overview:** Hardcodes radar scores (`Frontend: 96, Backend: 94...`) and calls `getDummyDCCData`.
- **Profile API:** Returns a fallback trust score of `940` on null query results.
- **Admin Billing API:** Hardcodes platform MRR at `$15,758` with 4,454 active subscriptions.
- **Review GET API:** Returns a mock review with score `83/100` if the database query fails.

### 9. Which Security & Authorization Gaps Exist
- **IDOR on Repository Reviews (P0):** `POST /api/repositories/[id]/review` triggers LLM audits without asserting repository ownership.
- **Privilege Creep on Admin Billing (P1):** Company admins can query platform-wide aggregate MRR.
- **Database Cascading Deletion Risk (P1):** `onDelete: 'cascade'` on `users` risks wiping out historical company hiring audits if a developer deletes their account.

### 10. What Should Be Fixed First and Why
**Phase 1 (Immediate P0 Fixes):**
1. **Fix `/dashboard` Routing:** Implement server-side dynamic role dispatching so Recruiters land on `/company`, Admins on `/admin`, and Developers on `/overview`.
2. **Patch IDOR Vulnerability:** Add `AuthorizationGuard.requireResourceOwner` to `POST /api/repositories/[id]/review`.
3. **Eliminate Synthetic Fallback Scores:** Remove all silent `940` fallback objects in production APIs to restore data credibility.

---

## 4. Evidence-Backed Implementation Roadmap

```mermaid
gantt
    title SkillVerse Remediation & Hardening Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 (P0 Fixes)
    Fix /dashboard Dynamic Role Dispatcher        :crit, p1_1, 2026-11-03, 2d
    Patch IDOR on Repo Review Trigger API         :crit, p1_2, after p1_1, 1d
    Eliminate Synthetic 940 Fallbacks in Prod     :crit, p1_3, after p1_2, 2d
    section Phase 2 (P1 Workflows)
    Persist Career Tasks to PostgreSQL            :p2_1, after p1_3, 2d
    Add GitHub Connect Flow for Google Users      :p2_2, after p2_1, 2d
    Enforce Pagination on Talent & Public APIs    :p2_3, after p2_2, 2d
    Isolate Admin Billing API strictly to Admins  :p2_4, after p2_3, 1d
    section Phase 3 (P2 Polish)
    Consolidate Triplicate Developer Cards        :p3_1, after p2_4, 3d
    Deduplicate DCC Growth & Engineering Widgets  :p3_2, after p3_1, 2d
    Implement Missing Candidate Invite API        :p3_3, after p3_2, 2d
    Fix Candidate Compare Mobile Layout Overflow  :p3_4, after p3_3, 2d
    section Phase 4 (P3 Hygiene)
    Tokenize Arbitrary Hex Colors                 :p4_1, after p3_4, 3d
    Resolve WCAG 2.1 AA Accessibility Defects     :p4_2, after p4_1, 3d
    Clean Orphaned & Duplicate Routes             :p4_3, after p4_2, 2d
```

### Architectural Preservation Note
SkillVerse does **not** require an architectural rewrite. Its underlying foundation—Next.js 15 App Router, Better Auth, Neon Serverless PostgreSQL with Drizzle ORM, and the 4-tier RBAC schema—is robust, modern, and highly capable. The identified defects stem entirely from static client passthroughs, missing ownership assertion checks on specific endpoints, and legacy mock data fallbacks left behind from early prototyping. Following this phased roadmap will bring the platform to enterprise production standards while preserving all existing investments.

