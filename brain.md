# SkillVerse Project Brain Map & Architecture Spec

This document details the complete system architecture, database schema dictionary, API specifications, and codebase structure of **SkillVerse** (The Proof-of-Skill Platform).

---

## 🏗️ Core Architecture Overview

SkillVerse operates as a decentralized reputation system for developers, replacing traditional resumes with verified cryptographic/Git audit trails.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Next.js (App)                          │
│   ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│   │    Client Views (React)     │ │  Server API routes      │   │
│   └──────────────┬──────────────┘ └────────────┬────────────┘   │
└──────────────────┼─────────────────────────────┼────────────────┘
                   │ Client actions              │ DB/Service calls
                   ▼                             ▼
  ┌─────────────────────────────────┐   ┌─────────────────────────┐
  │         Supabase Auth           │   │       Drizzle ORM       │
  │   GitHub / Google OAuth sign-in │   │    PostgreSQL database  │
  └─────────────────────────────────┘   └────────────┬────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────┐
                                        │  Hugging Face AI Client │
                                        │  Llama-3-70B reviews    │
                                        └─────────────────────────┘
```

---

## 🛠️ Tech Stack & Dependencies

* **Frontend**: Next.js 15 (App Router), React, TailwindCSS (Zinc palette, V2 Linear design tokens), Lucide React.
* **Database & ORM**: PostgreSQL (Supabase), Drizzle ORM.
* **Authentication**: Supabase Auth (OAuth GitHub/Google, Session cookies syncing).
* **AI Processing Engine**: Hugging Face Serverless API (`meta-llama/Meta-Llama-3-70B-Instruct`).

---

## 💾 Database Schema Reference

Below is a detailed dictionary of tables defined in `database/schema.ts`:

### 1. `users`
Stores user profile information synced from Supabase authentication metadata.
* `id` (`uuid`, Primary Key) - Matches the Supabase Auth user ID.
* `email` (`varchar`, Unique) - Email address.
* `name` (`varchar`) - Display name.
* `username` (`varchar`, Unique) - GitHub username.
* `avatarUrl` (`text`) - URL of profile photo.
* `githubId` (`varchar`) - GitHub user profile ID.
* `githubToken` (`text`) - Secured token for querying repositories.
* `role` (`varchar`) - User permission role (`developer` or `recruiter`).
* `createdAt` / `updatedAt` (`timestamp`).

### 2. `passports`
Represents the verified "Trust Passport" configuration.
* `id` (`uuid`, Primary Key) - Unique identifier.
* `userId` (`uuid`, References `users.id`) - Owner of the passport.
* `visibility` (`varchar`) - Profile visibility (`public` or `private`).
* `theme` (`varchar`) - Theme styling preferences (`dark` or `light`).
* `viewCount` (`integer`) - Telemetry view count.
* `generatedSummary` (`text`) - LLM-summarized bio derived from audit history.

### 3. `passport_views`
Telemetry table logging profile view trends.
* `id` (`serial`, Primary Key) - Entry ID.
* `passportId` (`uuid`, References `passports.id`) - Target passport.
* `viewerRole` (`varchar`) - Role of viewer (`anonymous` or `recruiter`).
* `viewedAt` (`timestamp`).

### 4. `trust_scores`
Stores the calculated credit-style coding score.
* `id` (`uuid`, Primary Key) - Rating ID.
* `userId` (`uuid`, References `users.id`) - Targeted developer.
* `overallScore` (`integer`) - Composite score (0 - 1000).
* `projectScore` (`integer`) - Quality score derived from active repos.
* `contributionScore` (`integer`) - Score based on commit consistency.
* `competitionScore` (`integer`) - Score based on challenge outputs.
* `peerVouchScore` (`integer`) - Score derived from client/peer verifications.
* `confidence` (`integer`) - Data reliability index (0 - 100).
* `lastCalculated` / `engineVersion`.

### 5. `skill_dna`
DNA matrix storing JSON representation of coding experience.
* `id` (`uuid`, Primary Key) - Skill ID.
* `userId` (`uuid`, References `users.id`) - Associated developer.
* `dnaStructure` (`jsonb`) - Nested array of mapped skills, experience levels, and verification status.

### 6. `repositories`
Tracked repos analyzed by SkillVerse.
* `id` (`serial`, Primary Key) - Repository record ID.
* `userId` (`uuid`, References `users.id`) - Owner.
* `githubRepoId` (`integer`) - GitHub internal repository ID.
* `name` / `fullName` (`varchar`).
* `description` (`text`).
* `htmlUrl` (`varchar`).
* `language` (`varchar`) - Primary language.
* `stars` / `forks` (`integer`).
* `isAnalyzed` (`boolean`) - Audit status flag.
* `analyzedAt` (`timestamp`).

### 7. `reviews`
Detailed AI review reports.
* `id` (`uuid`, Primary Key).
* `repositoryId` (`integer`, References `repositories.id`).
* `overallScore` (`integer`) - AI rating.
* `summary` (`text`) - Executive summary.
* `strengths` / `weaknesses` (`jsonb`) - Array list.
* `architecture` / `codeQuality` / `documentation` / `bestPractices` (`integer`) - Metrics (0 - 100).
* `suggestedLearning` (`jsonb`) - Personalized modules list.

---

## ⚡ API Endpoint Specification

### Authentication & Sessions
* **`GET /api/auth/callback`**
  * **Input**: `?code=string` (OAuth Authorization code)
  * **Flow**: 
    1. Exchange code for session token.
    2. Sync user profile data to database `users` table.
    3. Update the encrypted `githubToken`.
    4. Redirect to `/dashboard`.
  * **Returns**: `307 Redirect` to `/dashboard`.

### Developer Profile
* **`GET /api/profile`**
  * **Headers**: Supabase Session Cookie.
  * **Returns**: `{ success: true, data: { profile, trustScore, skillDna } }`.
* **`PATCH /api/profile`**
  * **Input**: `{ name?: string, bio?: string, website?: string, location?: string }` (Validated via Zod schema).
  * **Returns**: `{ success: true, data: updatedUserProfile }`.

### Repository & Review Audits
* **`GET /api/repositories`**
  * **Headers**: Supabase Session Cookie.
  * **Returns**: `{ success: true, data: Array<GithubRepositoryWithSyncState> }`.
* **`DELETE /api/repositories?githubRepoId=number`**
  * **Returns**: `{ success: true, message: "Repository analysis deleted successfully" }`.

### Telemetry & Career Vacancies
* **`GET /api/dashboard/analytics`**
  * **Returns**: View stats breakdown (Total views, recruiter visits, bookmarks).
* **`GET /api/dashboard/recommendations`**
  * **Returns**: Tailored growth and skill recommendations.
* **`GET /api/jobs`**
  * **Returns**: List of active career vacancies.
* **`POST /api/jobs`**
  * **Input**: `{ title, description, requiredSkills, minTrustScore, salary, locationType }`.

---

## 🧠 AI Review Engine (How it works)

When a developer triggers **Analyze Repo**, the platform initiates the following lifecycle:

```
1. Fetch Files   ──>  2. Filter Source   ──>  3. Build Prompts   ──>  4. Hugging Face
Query GitHub          Identify code files        Inject file content       Send to Llama-3-70B
File Tree API         (.ts, .py, .rs, etc)       into audit template       Inference endpoint
                                                                                 │
                                                                                 ▼
7. Update Profile <──  6. Save Report    <──  5. Calculate Score <──  5. Parse Response
Trigger Skill DNA     Insert review           Synthesize modular      Extract JSON rating,
re-calculation        record into DB          scores into metrics     strengths/weaknesses
```

---

## 📁 Codebase Directory Map

```
Sillverse/
├── app/                  # Next.js App Router Pages & Layouts
│   ├── (auth)/           # Authentication Screens (login, setup)
│   ├── (dashboard)/      # Core Workspace, Dashboard, Repos, Skills pages
│   ├── api/              # Backend endpoints and OAuth Callback handlers
│   ├── passport/         # Public Reputation Passport views
│   └── u/                # Public developer portfolios
├── components/           # Reusable UI widgets
│   ├── shared/           # Header, Sidebar, V2 Breadcrumbs
│   └── ui/               # Base styled primitives (buttons, tables, cards)
├── database/             # Drizzle schemas, migrations, and seed scripts
│   ├── schema.ts         # Central database table models
│   └── seed.ts           # Skills seeder script
├── lib/                  # Helper classes (Drizzle DB configuration)
├── services/             # Core Business Logic services
│   ├── passport/         # Vouching, Badges, and Activity Timeline compile
│   ├── skill-dna/        # DNA synthesis and score recalculations
│   └── supabase.ts       # Server-side Auth helpers
└── tailwind.config.ts    # Custom Design Tokens & font mappings
```
