# SKILLVERSE — COMPONENT-BY-COMPONENT INSPECTION & DEPENDENCY MAP

**Workspace:** `D:\ANTIGRAVITY PROJECT\Sillverse`  
**Audit Date:** November 2026  
**Audit Focus:** Comprehensive Component Inspection (Part 2) & Complete Dependency Mapping (Part 9)  
**Status:** Complete & Final Discovery Report  

---

## 1. Component Inspection Methodology

Every major component discovered in [`components/`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components) was systematically inspected for:
- Prop contracts and parameter types.
- State management (local React state, URL params, external contexts).
- Data origins (real REST API calls, direct database queries, synthetic fallbacks, or static hardcoding).
- Role access permissions.
- Failure modes, boundary safety, and error handling.
- Architectural hygiene (DRY adherence, responsibility bounding, duplication).

---

## 2. Component-by-Component Inspection Catalog

### 2.1 Navigation & Global Shell Components

#### `Sidebar`
- **File Location:** [`components/shared/Sidebar.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/shared/Sidebar.tsx) (372 lines)
- **Purpose:** Primary lateral navigation bar; switches dynamically between Developer, Recruiter/Company, and Admin views.
- **Parent Component:** [`app/(dashboard)/layout.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/layout.tsx)
- **Child Components:** Lucide Icons (`LayoutDashboard`, `Dna`, `Code2`, `FolderGit2`, `Github`, `Activity`, `Trophy`, `Users`, `Search`, `Building2`, `Settings`, etc.), Framer Motion `motion.aside`.
- **Inputs:** `trustScore?: { overallScore: number } | null`, `user?: { name?: string; username?: string; avatarUrl?: string; role?: string } | null`.
- **State:** `collapsed` (boolean), `fetchedUser` (state populated via API).
- **Data Source:** Mixed: if `user` prop is omitted, it triggers `fetch('/api/v1/me')`; if `trustScore` is missing, **it hardcodes `940` as default**.
- **Dependencies:** `next/navigation` (`usePathname`, `useRouter`), `next/link`, `framer-motion`.
- **Actions:** Collapses/expands sidebar; navigates routes; toggles between Company Mode and Developer Mode for privileged roles (`isPrivileged`).
- **Output:** Left navigation rail with active indicator pill, role-specific nav groups, and trust score badge.
- **Permissions:** All authenticated roles (`developer`, `recruiter`, `company_admin`, `admin`).
- **Error Handling:** Empty catch block on `/api/v1/me` fetch (`catch(() => {})`).
- **Status:** **Working with Defects.**
- **Problems:**
  1. *Excessive Responsibility:* Fetches its own user data over network instead of relying on a centralized user session context or layout props.
  2. *Synthetic Fallback Leakage:* Line 125 hardcodes `const currentScore = trustScore?.overallScore || 940;`, displaying an unearned 940 score if user is new or database query fails.
  3. *Navigation Redirection Defect:* Clicking 'Overview' navigates to `/overview`, but `/dashboard` also highlights 'Overview', masking the underlying redirect bug.

---

#### `Navbar`
- **File Location:** [`components/shared/Navbar.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/shared/Navbar.tsx) (250 lines)
- **Purpose:** Global top header: brand logo, global search trigger, notifications drawer trigger, theme toggle, and user profile dropdown.
- **Parent Component:** [`app/(dashboard)/layout.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/layout.tsx)
- **Child Components:** `ThemeToggle`, `CommandPalette`, User Avatar dropdown menu, Lucide Icons (`Search`, `Bell`, `Command`, `LogOut`, `User`).
- **Inputs:** Optional `user` prop; optional title/actions.
- **State:** `notificationsOpen` (boolean), `searchOpen` (boolean), `profileDropdownOpen` (boolean).
- **Data Source:** `authClient.useSession()` / session cookies, plus `fetch('/api/notifications')`.
- **Dependencies:** `better-auth/react`, `next/navigation`, `lucide-react`.
- **Actions:** Triggers logout (`authClient.signOut()`); opens Command Palette (`Cmd+K`); navigates to `/settings`.
- **Output:** Sticky enterprise header bar across desktop and mobile.
- **Permissions:** Public and Authenticated users.
- **Error Handling:** Graceful fallback to default avatar on image error.
- **Status:** Working.
- **Problems:** Notifications counter frequently out of sync with real database records; lacks WebSocket/SSE push updates.

---

#### `CommandPalette`
- **File Location:** [`components/shared/CommandPalette.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/shared/CommandPalette.tsx) (185 lines)
- **Purpose:** Global keyboard shortcut overlay (`Cmd+K` / `Ctrl+K`) for jumping to any page, repo, or skill.
- **Parent Component:** Mounted inside `Navbar.tsx` or Root Layout.
- **Child Components:** `Dialog`, `Input`, search result item list.
- **Inputs:** `open: boolean`, `onOpenChange: (open: boolean) => void`.
- **State:** `query: string`, `filteredItems: NavigationItem[]`.
- **Data Source:** Static navigation routes list + cached recent repositories.
- **Dependencies:** `lucide-react`, keyboard event listeners.
- **Actions:** Traps focus; listens for `ArrowUp`/`ArrowDown`/`Enter`; executes `router.push(href)`.
- **Output:** Centered modal search palette with dark glassmorphism backdrop.
- **Permissions:** All users.
- **Error Handling:** Simple query filter with empty fallback.
- **Status:** Working.
- **Problems:** Does not search across private company routes dynamically when logged in as recruiter.

---

### 2.2 Developer Capability Card (DCC 2.0) Components

#### `DCCCapabilityOverview`
- **File Location:** [`components/dcc/DCCCapabilityOverview.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCCapabilityOverview.tsx)
- **Purpose:** Top summary header of the Developer Capability Card: overall score (0-1000), capability level (Explorer...Elite), confidence tier badge.
- **Parent Component:** [`app/(dashboard)/dcc/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/dcc/page.tsx), [`app/developers/[username]/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/developers/[username]/page.tsx)
- **Child Components:** `Score`, `Badge`, `ProgressRing`.
- **Inputs:** `dcc: DCCFullData | DCCPublicData`.
- **State:** None (stateless presentational component).
- **Data Source:** Supplied via props from parent page API fetch (`/api/dcc` or `/api/v1/me/dcc`).
- **Dependencies:** `types/dcc.ts`.
- **Actions:** Clickable share trigger emitting modal open event.
- **Output:** Hero capability card with glowing gradient borders and score metrics.
- **Permissions:** Developer (owner view), Recruiter (talent evaluation view), Public (read-only).
- **Error Handling:** Falls back to placeholder badge if level is unrecognized.
- **Status:** Working.
- **Problems:** Displays overall single scalar score (e.g. 940), conflicting with the requirement to bifurcate Universal Capabilities from Technology Scores.

---

#### `DCCEngineeringCapabilities` vs `DCCEngineeringCapability` (Duplicate Pair)
- **File Locations:**
  - Plural: [`components/dcc/DCCEngineeringCapabilities.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCEngineeringCapabilities.tsx) (165 lines)
  - Singular: [`components/dcc/DCCEngineeringCapability.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCEngineeringCapability.tsx) (140 lines)
- **Purpose:** Both components display engineering dimension breakdowns (Code Quality, Architecture, Security, Testing, Documentation).
- **Parent Component:** Plural is rendered by `app/(dashboard)/dcc/page.tsx`; Singular is imported in older sub-views.
- **Child Components:** Progress bars, metric score badges.
- **Inputs:** Plural takes full `dimensions` object; Singular takes single `dimension: string, score: number`.
- **State:** Plural maintains active tab state; Singular is stateless.
- **Data Source:** Props passed from DCC API.
- **Dependencies:** `lucide-react`.
- **Actions:** Tab switching across dimensions.
- **Output:** Dimension capability card.
- **Permissions:** All roles.
- **Error Handling:** Standard zero-clamping (`Math.max(0, score)`).
- **Status:** **Duplicate Component Defect.**
- **Problems:** Plural component renders child rows with inline logic, while the Singular component re-implements the exact same markup in isolation. Creates maintenance drift.

---

#### `DCCVerifiedSkills`
- **File Location:** [`components/dcc/DCCVerifiedSkills.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCVerifiedSkills.tsx)
- **Purpose:** Grid displaying developer's verified technical skills grouped into categories (Languages, Frontend, Backend, Database, DevOps, AI/ML).
- **Parent Component:** `DCCPublicView.tsx`, `app/(dashboard)/dcc/page.tsx`.
- **Child Components:** `SkillChip`, `Badge`.
- **Inputs:** `skills: VerifiedSkill[]`, `onSelectSkill?: (skill: VerifiedSkill) => void`.
- **State:** `selectedCategory: string` (tab filter).
- **Data Source:** Props from DCC API (`/api/dcc`).
- **Dependencies:** `lucide-react`, `types/dcc.ts`.
- **Actions:** Clicking a skill chip filters evidence or emits drill-down event.
- **Output:** Categorized tabbed grid of skill badges with verification status (Verified, Supported, Detected).
- **Permissions:** All roles.
- **Error Handling:** Displays `EmptyState` if no skills exist for chosen category.
- **Status:** Working.
- **Problems:** Does not allow drill-down into specific AST code evidence lines from this component directly.

---

#### `DCCProjectEvidence`
- **File Location:** [`components/dcc/DCCProjectEvidence.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCProjectEvidence.tsx)
- **Purpose:** Renders the audited repositories backing a developer's capability claims.
- **Parent Component:** `app/(dashboard)/dcc/page.tsx`.
- **Child Components:** `Card`, `Badge`, external GitHub link buttons.
- **Inputs:** `evidence: ProjectEvidenceSummary[]`.
- **State:** `expandedRepoId: string | null`.
- **Data Source:** Props from `/api/dcc/evidence`.
- **Dependencies:** `lucide-react`.
- **Actions:** Expands repository to reveal audited files and health scores.
- **Output:** List of repository evidence cards with commits, health scores, and provenance status (original vs fork).
- **Permissions:** All roles.
- **Error Handling:** Hides private repositories if user has not granted organization permissions.
- **Status:** Working.
- **Problems:** Hardcodes health scores if the repository was analyzed under simulated mock mode.

---

#### `DCCGrowthHistory` vs `DCCGrowthTimeline` (Duplicate Pair)
- **File Locations:**
  - [`components/dcc/DCCGrowthHistory.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCGrowthHistory.tsx) (190 lines)
  - [`components/dcc/DCCGrowthTimeline.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCGrowthTimeline.tsx) (160 lines)
- **Purpose:** Both components visualize the developer's chronological progression of verified skills and level promotions.
- **Parent Component:** `app/(dashboard)/dcc/page.tsx`.
- **Child Components:** Milestone node markers, timestamp labels.
- **Inputs:** `history: CapabilityHistoryRecord[]`.
- **State:** Filter by event type (`all`, `skills`, `levels`).
- **Data Source:** `/api/dcc/history`.
- **Status:** **Duplicate Component Defect.**
- **Problems:** `DCCGrowthHistory` renders a table/list view, while `DCCGrowthTimeline` renders a vertical stepper line view. Both fetch the same endpoint and represent identical data in two conflicting formats.

---

#### `DCCVerificationIntegrity`
- **File Location:** [`components/dcc/DCCVerificationIntegrity.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/dcc/DCCVerificationIntegrity.tsx)
- **Purpose:** Verification trust badge explaining why claims are trusted (AST analysis, commit authorship checks, zero self-reporting).
- **Parent Component:** `app/(dashboard)/dcc/page.tsx`, `components/dcc/DCCPublicView.tsx`.
- **Child Components:** `ShieldCheck`, `CheckCircle2`, `AlertTriangle` icons.
- **Inputs:** `integrityData: { confidence: number; freshness: string; auditMethod: string }`.
- **State:** None.
- **Data Source:** `/api/dcc`.
- **Status:** Working.
- **Problems:** Displays "Verified via AI Agent Audit" even when fallback simulated review was generated in non-production environments.

---

### 2.3 Visualizations & Chart Components

#### `RadarChartComponent`
- **File Location:** [`components/charts/RadarChartComponent.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/charts/RadarChartComponent.tsx) (110 lines)
- **Purpose:** SVG radar chart rendering multidimensional capability scores (Frontend, Backend, Database, DevOps, CS Fundamentals).
- **Parent Component:** [`app/(dashboard)/overview/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/overview/page.tsx), [`app/(dashboard)/skill-dna/page.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/app/(dashboard)/skill-dna/page.tsx)
- **Child Components:** Raw SVG elements (`<polygon>`, `<circle>`, `<text>`).
- **Inputs:** `data?: { dimension: string; score: number }[]`, `size?: number`.
- **State:** None.
- **Data Source:** Props passed from parent; **falls back to hardcoded 96, 94, 92, 88, 95 if props are empty**.
- **Dependencies:** Pure SVG math (trigonometric `Math.cos` / `Math.sin`).
- **Actions:** Hover tooltips showing individual dimension scores.
- **Output:** Pentagonal radar polygon with cyan glow fill.
- **Permissions:** All roles.
- **Error Handling:** Defaults to dummy array on empty input.
- **Status:** **Working with Defect.**
- **Problems:** Default fallback props provide false visual verification (`Frontend: 96, Backend: 94`) instead of an empty state when a new user connects an empty profile.

---

#### `MultiLineChart`
- **File Location:** [`components/charts/MultiLineChart.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/charts/MultiLineChart.tsx) (130 lines)
- **Purpose:** Renders historical capability trend lines over 30/60/90 days.
- **Parent Component:** `overview/page.tsx`, `analytics/page.tsx`.
- **Inputs:** `series: { label: string; points: number[] }[]`.
- **State:** Active hovered data point.
- **Data Source:** Props from `/api/analytics` or `/api/dcc/growth`.
- **Status:** Working.
- **Problems:** Lacks accessibility (a11y) ARIA table fallbacks for screen readers.

---

### 2.4 Talent Discovery & Candidate Cards (Triplicate Set)

SkillVerse contains **three distinct developer card components** with heavily overlapping functionality:

| Component | File Path | Lines | Used By | Specific Distinct Features |
|---|---|---|---|---|
| `DeveloperDiscoveryCard` | [`components/discovery/DeveloperDiscoveryCard.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/discovery/DeveloperDiscoveryCard.tsx) | 160 | `/company/developers` | Has "Save Candidate", "Compare", and "Invite to Job" buttons. |
| `CandidateCard` | [`components/ui/CandidateCard.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/ui/CandidateCard.tsx) | 145 | `/company/applications` | Has ATS stage pills (Reviewing, Shortlisted, Rejected). |
| `DeveloperCard` | [`components/ui/DeveloperCard.tsx`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/components/ui/DeveloperCard.tsx) | 130 | `/developers` (Public) | Has "View Profile" link, verified badges, no recruiter actions. |

- **Identified Defect:** These 3 components share 80% identical markup (avatar, name, username, score badge, top 4 skills, location, bio). Any visual tweak to card borders or hover effects must be redundantly applied across all 3 files.
- **Remediation:** Consolidate into a single polymorphic `DeveloperProfileCard` with variant prop (`variant="public" | "recruiter" | "ats"`).

---

## 3. High-Impact Dependency Mapping (Part 9)

A breakdown of critical architectural components whose failure cascades across multiple user workflows:

```
                               ┌────────────────────────────────────────────────────────┐
                               │               services/auth/session.ts                 │
                               │        Session Resolution & Provider Normalization     │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                ┌──────────────────────────┴──────────────────────────┐
                                │                                                     │
                                ▼                                                     ▼
    ┌───────────────────────────────────────┐             ┌───────────────────────────────────────┐
    │     services/security/authorizer.ts   │             │       components/shared/Sidebar.tsx   │
    │  API & Server Layout Guards (Anti-IDOR)│             │      Global Navigation & Role Switch  │
    └───────────────────┬───────────────────┘             └───────────────────┬───────────────────┘
                        │                                                     │
                        ▼                                                     ▼
    ┌───────────────────────────────────────┐             ┌───────────────────────────────────────┐
    │       services/dcc/service.ts         │             │         services/github.ts            │
    │     DCC Assembly & Score Calculation  │             │     GitHub REST Integration & Sync    │
    └───────────────────┬───────────────────┘             └───────────────────┬───────────────────┘
                        │                                                     │
                        └──────────────────────────┬──────────────────────────┘
                                                   │
                                                   ▼
                               ┌───────────────────────────────────────┐
                               │        services/ai/service.ts         │
                               │   AI Repository Audit & AST Grounding │
                               └───────────────────────────────────────┘
```

### High-Impact Critical Nodes

#### 1. `services/auth/session.ts` (`getSessionUser`)
- **Impact Level:** **CRITICAL (P0)**
- **Dependents:**
  - 140+ API routes check session validity via this function.
  - All server-side layout guards (`requireServerAuth`, `requireServerCompanyAccess`, `requireServerAdmin`).
  - Next.js Edge Middleware (`middleware.ts`).
- **Risk:** If session resolution throws an uncaught exception, all authenticated pages return 500 or redirect to `/login`.

#### 2. `services/security/authorizer.ts` (`AuthorizationGuard`)
- **Impact Level:** **CRITICAL (P0)**
- **Dependents:**
  - All `/api/company/*` routes.
  - All `/api/admin/*` routes.
  - Resource ownership checks (Anti-IDOR protection).
- **Risk:** Logic flaw or bypass in `requireCompanyMembership` allows cross-tenant recruiter data leakage.

#### 3. `services/github.ts` (`GitHubService`)
- **Impact Level:** **HIGH (P1)**
- **Dependents:**
  - `/api/repositories` (repo listing and syncing).
  - `/api/activity/sync` (contribution timeline).
  - `services/ai/service.ts` (fetching repository code for audits).
- **Risk:** GitHub API rate-limiting (60 req/hr unauthenticated, 5000 req/hr with token) will fail repository audits if tokens are missing or invalid.

#### 4. `services/dcc/service.ts` (`DeveloperCapabilityCardService`)
- **Impact Level:** **HIGH (P1)**
- **Dependents:**
  - `/dashboard` & `/overview` (displays overall capability score).
  - `/dcc` & `/dcc/public` (full capability cards).
  - `/company/developers` & `/company/compare` (recruiter evaluation).
  - `/api/v1/developers/[username]/dcc` (public API).
- **Risk:** If DCC assembly fails or relies on simulated fallbacks, scores across the entire platform become fictitious.

#### 5. `services/ai/service.ts` (`AiReviewService`)
- **Impact Level:** **HIGH (P1)**
- **Dependents:**
  - `/api/repositories/[id]/review` (audit generation).
  - Skill extraction and verification pipelines.
  - Repository health and intelligence reports.
- **Risk:** In production, missing `HUGGINGFACE_API_KEY` aborts audits; in development, generates synthetic reviews that contaminate database records.

---

## 4. Feature-to-API & Feature-to-Database Mapping

| Application Feature | Primary Frontend Components | Backing API Routes | Backing Database Tables | External Integrations |
|---|---|---|---|---|
| **User Sign-In & Linking** | `app/(auth)/login/page.tsx` | `/api/auth/[...all]`, `/api/auth/callback` | `users`, `accounts`, `sessions` | GitHub OAuth, Google OAuth |
| **Developer Overview** | `DeveloperOverviewPage`, `RadarChartComponent`, `CareerWidget` | `/api/profile`, `/api/dashboard/activity`, `/api/dcc` | `users`, `trustScores`, `skillDna`, `developerCapabilityCards` | None (Local DB) |
| **GitHub Repository Sync** | `app/(dashboard)/repositories/page.tsx` | `/api/repositories`, `/api/activity/sync` | `repositories`, `contributions` | GitHub REST API |
| **Codebase AI Audit** | `app/(dashboard)/repositories/[id]/page.tsx` | `/api/repositories/[id]/review`, `/api/repositories/[id]/analyze` | `repositories`, `reviews`, `reviewHistory`, `verificationEvidence` | Hugging Face API |
| **Verified Skill Evaluation** | `DCCVerifiedSkills`, `SkillChip` | `/api/skills`, `/api/skills/evidence`, `/api/dcc` | `skills`, `userSkills`, `verificationEvidence` | None (Internal AST) |
| **Capability Card 2.0** | `DCCCapabilityOverview`, `DCCProjectEvidence`, `DCCShareModal` | `/api/dcc`, `/api/dcc/public`, `/api/dcc/history` | `developerCapabilityCards`, `capabilityDimensions`, `capabilityHistory` | None (Local DB) |
| **Career Roadmap** | `app/(dashboard)/career/page.tsx`, `CareerWidget` | `/api/career`, `/api/career/goals`, `/api/career/tasks` | `careerGoals`, `careerRoadmaps`, `careerTasks`, `careerRoles` | None (Local DB) |
| **Talent Search & Filter** | `DeveloperDiscoveryCard`, `app/(dashboard)/company/developers/page.tsx` | `/api/company/developers`, `/api/candidates/search` | `users`, `developerCapabilityCards`, `userSkills`, `skills` | None (Local DB) |
| **Candidate ATS Pipeline** | `CandidateCard`, `app/(dashboard)/company/applications/page.tsx` | `/api/company/applications` | `applications`, `jobs`, `companies`, `candidateNotes` | None (Local DB) |
| **Multi-Candidate Compare** | `app/(dashboard)/company/compare/page.tsx` | `/api/company/compare`, `/api/dcc/comparison` | `developerCapabilityCards`, `comparisonCache`, `capabilityDimensions` | None (Local DB) |
| **Company Team & Billing** | `app/(dashboard)/company/members/page.tsx`, `app/(dashboard)/company/billing/page.tsx` | `/api/company/members`, `/api/billing/checkout` | `companies`, `companyMembers`, `subscriptions`, `invoices` | Stripe Billing |
| **Platform Admin Console** | `app/(dashboard)/admin/page.tsx` | `/api/admin/system`, `/api/admin/billing` | `users`, `auditLogs`, `subscriptions` | Neon Management API |

