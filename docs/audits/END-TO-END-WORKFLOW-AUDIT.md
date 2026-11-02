# SKILLVERSE — END-TO-END WORKFLOW AUDIT & ROLE CROSS-CHECK

**Workspace:** `D:\ANTIGRAVITY PROJECT\Sillverse`  
**Audit Date:** November 2026  
**Audit Focus:** Complete User Journeys (Part 3) & Role/Permission Cross-Checks (Part 7)  
**Status:** Complete & Final Discovery Report  

---

## 1. End-to-End Workflow Audit Methodology

Each major user journey was traced across all 10 architectural tiers:
1. **Starting Point** (Initial URL/page state)
2. **User Action** (Click, form input, OAuth consent)
3. **Frontend Component** (Rendered React view)
4. **API Endpoint** (Next.js route handler)
5. **Service Function** (Backend business logic)
6. **Database Operations** (Drizzle ORM queries/mutations)
7. **External Dependencies** (GitHub REST, Hugging Face, Neon, Google)
8. **HTTP Response** (Status code, payload shape)
9. **UI State Change** (Optimistic updates, state mutation)
10. **Final Outcome** (Rendered destination or error state)

---

## 2. Complete User Journeys by Role

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       END-TO-END WORKFLOW TAXONOMY                              │
├─────────────────────┬───────────────────────────────────────────────────────────┤
│ Role                │ Audited Journeys                                          │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Universal / Auth    │ Journey 1: Authentication, OAuth & Role Resolution        │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Developer           │ Journey 2: GitHub Connection & Repository Sync            │
│                     │ Journey 3: Repository Selection & AI Codebase Audit       │
│                     │ Journey 4: Skill Evaluation & Evidence Generation         │
│                     │ Journey 5: Developer Capability Card (DCC) & Sharing      │
│                     │ Journey 6: Career Roadmap & Task Completion               │
│                     │ Journey 7: Job Discovery & 1-Click Application            │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Recruiter           │ Journey 8: Talent Discovery, Filtering & Comparison       │
│                     │ Journey 9: Candidate Evaluation, Proof Inspection & Notes │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Company Admin       │ Journey 10: Company Workspace & Team Member Management    │
├─────────────────────┼───────────────────────────────────────────────────────────┤
│ Platform Admin      │ Journey 11: System Telemetry, Health & Role Governance    │
└─────────────────────┴───────────────────────────────────────────────────────────┘
```

---

### Journey 1: Authentication, OAuth & Role Resolution (Universal)

1. **Starting Point:** Unauthenticated user visits `https://skillverse.com/` or is redirected to `/login?next=/career`.
2. **User Action:** Clicks "Continue with Google" or "Continue with GitHub".
3. **Frontend Component:** [`app/(auth)/login/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(auth)/login/page.tsx) (`handleGoogleLogin` / `handleGithubLogin`).
4. **API Endpoint:** Better Auth internal route: `POST /api/auth/sign-in/social`.
5. **Service Function:** Better Auth OAuth handler in [`lib/auth.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/lib/auth.ts).
6. **Database Operations:**
   - Reads `accounts` and `users` to check for existing email.
   - If user exists: preserves existing `users.role` and links account.
   - If new user: inserts `users` with default `role: 'developer'`, sets `emailVerified: true`, inserts `accounts`.
7. **External Dependencies:** Google OAuth 2.0 or GitHub OAuth authorization servers.
8. **Response:** 302 Redirect with Set-Cookie: `better-auth.session_token; HttpOnly; Secure; SameSite=Lax`.
9. **UI State Change:** Browser follows redirect to callback URL.
10. **Final Outcome & Identified Problem:**
    - **Expected:** Developer lands on `/overview`; Recruiter lands on `/company`; Admin lands on `/admin`.
    - **Actual Defect:** In `app/(auth)/login/page.tsx`, `getCallbackUrl()` defaults to `/dashboard`. `/dashboard` unconditionally mounts `<DeveloperOverviewPage />`. **Recruiters and Admins are served the Developer dashboard!**

---

### Journey 2: GitHub Connection & Repository Sync (Developer)

1. **Starting Point:** Developer logs in and navigates to `/repositories`.
2. **User Action:** Clicks "Sync Repositories" button.
3. **Frontend Component:** [`app/(dashboard)/repositories/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/repositories/page.tsx).
4. **API Endpoint:** `POST /api/repositories` and `POST /api/activity/sync`.
5. **Service Function:** [`services/github.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/github.ts) (`GitHubService.fetchUserRepos`).
6. **Database Operations:**
   - Queries `users.githubToken`.
   - Upserts into `repositories` table matching on `githubRepoId`.
   - Populates `name`, `fullName`, `language`, `stars`, `forks`, `isAnalyzed: false`.
7. **External Dependencies:** GitHub REST API (`GET https://api.github.com/user/repos`).
8. **Response:** HTTP 200 `{ success: true, count: 12, data: [...] }`.
9. **UI State Change:** Repositories list re-renders with repository cards and "Not Audited" status badges.
10. **Final Outcome & Identified Gaps:**
    - **Working:** Repositories sync correctly if user authenticated via GitHub.
    - **Dead End / Gap:** If user signed up via Google OAuth, `users.githubToken` is null! The UI displays "Sync Repositories", but clicking it fails silently or returns an unhelpful error. There is no in-app workflow prompting Google users to connect a secondary GitHub account.

---

### Journey 3: Repository Selection & AI Codebase Audit (Developer)

1. **Starting Point:** Developer viewing connected repositories at `/repositories`.
2. **User Action:** Clicks "Analyze Codebase" on repository card (e.g. `repoId: 38f4...`).
3. **Frontend Component:** `app/(dashboard)/repositories/page.tsx` (`triggerAnalysis`).
4. **API Endpoint:** `POST /api/repositories/[id]/review`.
5. **Service Function:** [`services/ai/service.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/ai/service.ts) (`AiReviewService.processRepositoryReview`).
6. **Database Operations:**
   - Reads `repositories` by `id`.
   - Inserts `reviews` record (`summary`, `strengths`, `weaknesses`, `architecture`, `codeQuality`, `healthScores`, `skillsExtracted`, `provenanceStatus`).
   - Updates `repositories.isAnalyzed = true`, `repositories.reviewStatus = 'completed'`.
   - Inserts `reviewHistory` entry.
7. **External Dependencies:**
   - GitHub API: Fetches top 15 source files, `package.json`, `README.md`.
   - Hugging Face Inference API: `Qwen/Qwen2.5-Coder-32B-Instruct` executes analysis prompt.
8. **Response:** HTTP 202 Accepted `{ success: true, status: 'running' }` (Background job).
9. **UI State Change:** Card status transitions to "Auditing..." with spinning loader; frontend polls `/api/repositories/[id]/status`.
10. **Final Outcome & Identified Vulnerability:**
    - **Critical Security Defect:** `POST /api/repositories/[id]/review` does **not** verify whether the requesting user owns `repoId` (Missing Anti-IDOR check). Any authenticated user can trigger LLM audits on other users' repositories.
    - **Mock Fallback:** If `HUGGINGFACE_API_KEY` fails, non-production environments generate a simulated fake review with `provenanceStatus: 'simulated'`.

---

### Journey 4: Skill Evaluation & Evidence Generation (Developer)

1. **Starting Point:** AI review completes for an analyzed repository.
2. **User Action:** System processes completion hook (or user triggers `/api/skills/recalculate`).
3. **Frontend Component:** `app/(dashboard)/skills/page.tsx`.
4. **API Endpoint:** `POST /api/skills/recalculate` and `POST /api/verify/recalculate`.
5. **Service Function:**
   - [`services/ai/validators.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/ai/validators.ts) (`AiOutputValidator.groundExtractedSkills`).
   - [`services/dcc/evidence.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/dcc/evidence.ts) (`DCCEvidenceService.determineVerificationStatus`).
6. **Database Operations:**
   - Checks `skills` master catalog.
   - Upserts `userSkills` (`proficiencyLevel`, `provenanceStatus`, `reviewId`).
   - Inserts rows into `verificationEvidence` (`dimension`, `sourceRepo`, `verificationMethod: 'AI Agent Audit'`, `confidence`, `evidenceWeight: 'strong'`).
7. **External Dependencies:** None (Internal static grounding).
8. **Response:** HTTP 200 `{ success: true, skillsEvaluated: 6, verifiedCount: 4 }`.
9. **UI State Change:** Skills page updates with verified skill badges and green shield icons.
10. **Final Outcome & Identified Gaps:**
    - **Working:** Extracted skills are grounded against file presence (Phase 42 logic).
    - **Problem:** Weak evidence (e.g. package.json only) can sometimes mark a skill as "Detected", but the UI does not distinguish between "Verified via AST code" vs "Detected in package.json".

---

### Journey 5: Developer Capability Card (DCC) Assembly & Sharing (Developer)

1. **Starting Point:** Developer navigates to `/dcc`.
2. **User Action:** Views complete DCC; clicks "Share Card".
3. **Frontend Component:** [`app/(dashboard)/dcc/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/dcc/page.tsx), [`components/dcc/DCCShareModal.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCShareModal.tsx).
4. **API Endpoint:** `GET /api/dcc`.
5. **Service Function:** [`services/dcc/service.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/dcc/service.ts) (`DeveloperCapabilityCardService.getFullDCC`).
6. **Database Operations:**
   - Reads `developerCapabilityCards` for `userId`.
   - Reads `capabilityDimensions`, `capabilityHistory`, `verificationEvidence`, `userSkills`.
7. **External Dependencies:** None.
8. **Response:** HTTP 200 with full nested JSON: `{ overallScore, level, dimensions, verifiedSkills, evidenceSummary }`.
9. **UI State Change:** DCC card renders with engineering progress bars; Share Modal displays public URL: `https://skillverse.com/developers/[username]`.
10. **Final Outcome & Identified Gaps:**
    - **Problem:** If user has 0 audited repos, `DeveloperCapabilityCardService` falls back to `getDummyDCCData('00000000-0000-0000-0000-000000000001')`, rendering a misleading 940 score instead of an empty profile!

---

### Journey 6: Career Roadmap & Task Progress (Developer)

1. **Starting Point:** Developer navigates to `/career`.
2. **User Action:** Selects target role (e.g., "Staff Backend Engineer") and clicks "Complete Task".
3. **Frontend Component:** [`app/(dashboard)/career/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/career/page.tsx).
4. **API Endpoint:** `POST /api/career/tasks/[id]/complete`.
5. **Service Function:** [`services/career/engine.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/career/engine.ts).
6. **Database Operations:**
   - Intended: updates `careerTasks` status to `'completed'`.
   - **Discovered Actual:** `app/api/career/tasks/[id]/complete/route.ts` imports `dummyData` and updates a local memory mock!
7. **External Dependencies:** None.
8. **Response:** HTTP 200 `{ success: true, newReadiness: 88 }`.
9. **UI State Change:** Checkbox checks; readiness bar increments.
10. **Final Outcome & Identified Defect:**
    - **Dead End / Mock State:** Career progress is **not persisted** to PostgreSQL. Reloading the page resets task state because the API handler operates on in-memory mock structures.

---

### Journey 7: Job Discovery & 1-Click Application (Developer)

1. **Starting Point:** Developer visits `/jobs`.
2. **User Action:** Inspects job posting "Senior Full Stack Engineer at Neon"; clicks "Quick Apply with DCC".
3. **Frontend Component:** [`app/(dashboard)/jobs/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/jobs/[id]/page.tsx).
4. **API Endpoint:** `POST /api/jobs/[id]/apply`.
5. **Service Function:** Internal application service.
6. **Database Operations:**
   - Inserts record into `applications` (`jobId`, `userId`, `status: 'applied'`, `dccSnapshot`).
7. **External Dependencies:** None.
8. **Response:** HTTP 201 `{ success: true, applicationId: '...' }`.
9. **UI State Change:** Button changes to "Applied", status pill displays "Under Review".
10. **Final Outcome:** Application record successfully reaches database.

---

### Journey 8: Talent Discovery, Filtering & Comparison (Recruiter)

1. **Starting Point:** Recruiter logs in and navigates to `/company/developers`.
2. **User Action:** Filters by skill: "TypeScript", min confidence: "High", level: "Senior/Elite".
3. **Frontend Component:** [`app/(dashboard)/company/developers/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/developers/page.tsx).
4. **API Endpoint:** `GET /api/candidates/search?skill=typescript&confidence=high`.
5. **Service Function:** [`services/discovery/search.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/discovery/search.ts).
6. **Database Operations:**
   - Queries `developerCapabilityCards` joined with `userSkills` and `users`.
   - Applies privacy filter: `privacySettings.hideFromRecruiters === false`.
7. **External Dependencies:** None.
8. **Response:** HTTP 200 `{ success: true, count: 8, candidates: [...] }`.
9. **UI State Change:** Grid renders `DeveloperDiscoveryCard` instances with score chips.
10. **Final Outcome & Identified Defect:**
    - When selecting two candidates to "Compare", the UI routes to `/company/compare?ids=user1,user2`.
    - In `app/api/dcc/comparison/route.ts`: if database query fails, **it falls back to `getDummyUser` and hardcoded 940 comparison metrics!**

---

### Journey 9: Candidate Evaluation, Proof Inspection & Notes (Recruiter)

1. **Starting Point:** Recruiter clicks on candidate card to open `/company/candidates/[id]`.
2. **User Action:** Views verified skills, inspects repository proof, types an internal note: "Strong AST modularity, schedule technical screen", clicks "Save Note".
3. **Frontend Component:** [`app/(dashboard)/company/candidates/[id]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/candidates/[id]/page.tsx).
4. **API Endpoint:** `POST /api/company/notes`.
5. **Service Function:** [`services/company/workspace.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/company/workspace.ts).
6. **Database Operations:**
   - Enforces `requireCompanyMembership`.
   - Inserts row into `candidateNotes` (`companyId`, `candidateUserId`, `recruiterUserId`, `content`).
7. **External Dependencies:** None.
8. **Response:** HTTP 201 `{ success: true, noteId: '...' }`.
9. **UI State Change:** Note appears in candidate notes timeline.
10. **Final Outcome:** Note is saved and isolated to the recruiter's company workspace.

---

### Journey 10: Company Workspace & Team Management (Company Admin)

1. **Starting Point:** Company Admin navigates to `/company/members`.
2. **User Action:** Enters colleague email: `hiring.lead@company.com`, selects role `recruiter`, clicks "Send Invite".
3. **Frontend Component:** [`app/(dashboard)/company/members/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/company/members/page.tsx).
4. **API Endpoint:** `POST /api/company/members`.
5. **Service Function:** [`services/company/workspace.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/company/workspace.ts) (`CompanyWorkspaceService.inviteMember`).
6. **Database Operations:**
   - Enforces `requireCompanyMembership` with `minRole: 'company_admin'`.
   - Inserts row into `companyMembers` (`companyId`, `userId: null`, `invitedEmail`, `role: 'recruiter'`, `status: 'pending'`).
7. **External Dependencies:** Email dispatch service (or mock invite link).
8. **Response:** HTTP 201 `{ success: true, inviteId: '...' }`.
9. **UI State Change:** Team member table displays pending invitation with revoke button.
10. **Final Outcome:** Workspace membership properly protected against non-admin company users.

---

### Journey 11: Platform Telemetry, Health & Governance (Platform Admin)

1. **Starting Point:** Platform Admin navigates to `/admin`.
2. **User Action:** Views system health metrics and database connectivity.
3. **Frontend Component:** `app/(dashboard)/admin/page.tsx`.
4. **API Endpoint:** `GET /api/admin/system`.
5. **Service Function:** [`services/health/service.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/services/health/service.ts).
6. **Database Operations:**
   - Enforces `AuthorizationGuard.requireRole(['admin'])`.
   - Executes `SELECT 1` health query via `checkDbAvailability()`.
7. **External Dependencies:** Neon Serverless PostgreSQL connection.
8. **Response:** HTTP 200 `{ status: 'healthy', databaseAvailable: true, rbacModel: '4-Tier' }`.
9. **UI State Change:** Green indicators light up across telemetry cards.
10. **Final Outcome:** Restrictive layout guard prevents any lower role from accessing this surface.

---

## 3. Role & Permission Cross-Check (Part 7)

A cross-check was executed across all 69 pages and 193 APIs against the four supported database roles:

| Route or Subsystem | Expected Permitted Roles | Actual Enforcement Mechanism | Discovered Discrepancy or Access Leak |
|---|---|---|---|
| `/dashboard` | Dynamic by role | None (Static Client Component) | **CRITICAL DEFECT:** Any role can access; all roles see Developer UI. |
| `/overview` | `developer`, `admin` | Edge session cookie only | Recruiter landing on `/overview` sees developer stats instead of company dashboard. |
| `/career/*` | `developer`, `admin` | Edge session cookie only | Recruiter can view and check off developer learning tasks. |
| `/company/*` | `recruiter`, `company_admin`, `admin` | `requireServerCompanyAccess()` in layout | **Secure.** Developers visiting directly are redirected to `/overview`. |
| `/company/members` | `company_admin`, `admin` | In-page check + API `minRole: 'company_admin'` | **Secure.** Recruiter is blocked from mutating company members. |
| `/admin/*` | `admin` strictly | `requireServerAdmin()` in layout | **Secure.** All non-admins redirected to `/overview`. |
| `/api/repositories/[id]/review` (POST) | Repository Owner | `if (!user) return 401;` only | **CRITICAL DEFECT:** Any user can trigger review on another user's repo (IDOR). |
| `/api/company/*` | Verified Company Member | `requireCompanyMembership` | **Secure.** Cross-company tenant isolation is strictly enforced. |
| `/api/admin/system` | `admin` strictly | `requireRole(['admin'])` | **Secure.** Returns 403 for non-admins. |
| `/api/admin/billing` | `admin`, `company_admin` | In-handler check | **Discrepancy:** Developer receives 403; company_admin sees aggregate platform MRR (should be restricted to platform admin). |
| `/api/profile` (PATCH) | Profile Owner | `getSessionUser()` + Zod Schema | **Secure.** Role cannot be self-escalated. |

---

## 4. Summary of Broken Transitions & Dead Ends

1. **The OAuth Redirect Dead End:**
   - After signing in with GitHub/Google, recruiters and company admins land on `/dashboard`, which mounts the developer view. There is no automated prompt redirecting them to their company workspace.
2. **Google OAuth Repo Sync Dead End:**
   - A user who signs in via Google OAuth has no GitHub token. When navigating to `/repositories`, the UI shows a "Sync Repositories" button that fails silently without an "Authenticate GitHub" connect action.
3. **The Career Task Persistence Dead End:**
   - Checking off career milestones on `/career` calls an in-memory mock API. Reloading the page loses all progress.
4. **Missing Recruiter Candidate Invite Link:**
   - On `/company/developers`, clicking "Invite to Apply" opens a modal that lists jobs, but submitting the invitation returns a 404 on `/api/company/invitations` (unimplemented endpoint).
5. **Duplicate Team Management Routes:**
   - Navigation in Sidebar points to `/company/members`, but `/company/team` exists as an orphaned duplicate page with stale mock data.

