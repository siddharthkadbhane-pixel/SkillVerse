# SkillVerse Master Architecture Spec & Brain Map

This document details the complete system architecture, database schema dictionary, API specifications, and codebase structure of **SkillVerse** (The Proof-of-Capability Platform through Phase 33).

---

## 🏗️ Core Architecture Overview

SkillVerse operates as a decentralized, verifiable developer capability intelligence platform. It replaces keyword-stuffed resumes and unverified claims with cryptographic Git audit trails, AST code structure heuristics, AI multi-agent audits, deterministic opportunity matching, verification challenges, and granular team collaboration attribution.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Next.js 15 (App Router)                                  │
│   ┌────────────────────────────────────────┐ ┌──────────────────────────────────────┐  │
│   │        Developer & Recruiter UI        │ │         REST API & Endpoints         │  │
│   │  (DCC 2.0, Discovery, Jobs, Teams,     │ │ (/api/dcc, /api/developers,          │  │
│   │   Challenges, Activity, Skill DNA)     │ │  /api/jobs, /api/challenges,         │  │
│   │                                        │ │  /api/teams, /api/company)           │  │
│   └───────────────────┬────────────────────┘ └──────────────────┬───────────────────┘  │
└───────────────────────┼─────────────────────────────────────────┼──────────────────────┘
                        │ Client Actions                          │ Engine Service Calls
                        ▼                                         ▼
   ┌──────────────────────────────────────────┐    ┌──────────────────────────────────┐
   │             Supabase Auth                │    │           Drizzle ORM            │
   │      OAuth (GitHub / Google Sync)        │    │    PostgreSQL Database (Tables)  │
   └──────────────────────────────────────────┘    └──────────────────┬───────────────┘
                                                                      │
     ┌────────────────────────────────────────────────────────────────┴─────────────────────────────────┐
     │                                     Core Intelligence Engines                                    │
     ├─────────────────────────────┬─────────────────────────────┬──────────────────────────────────────┤
     │  1. DCC 2.0 Service Engine  │ 2. AST Repository Analyzer  │  3. Multi-Agent Orchestrator         │
     │  4. Verification Integrity  │ 5. Skill Capability Mapping │  6. Contribution Intelligence        │
     │  7. Opportunity Match Engine│ 8. Challenge AST Evaluator  │  9. Team Attribution Matrix          │
     └─────────────────────────────┴─────────────────────────────┴──────────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Dependencies

* **Frontend**: Next.js 15 (App Router), React 19, Vanilla CSS & Tailwind CSS tokens (Zinc palette, V2 Linear dark theme), Lucide React, Framer Motion.
* **Database & ORM**: PostgreSQL (Supabase Pooler), Drizzle ORM with resilient fallback execution & timeout handlers.
* **Authentication**: Supabase Auth (OAuth GitHub/Google session syncing).
* **Intelligence & AST Analysis**: AST Heuristic Code Analysis, Multi-Agent pipelines (`Code Reviewer`, `Architecture Evaluator`, `Security Sentinel`, `Test Validator`, `Documentation Auditor`), and Hugging Face Serverless API (`meta-llama/Meta-Llama-3-70B-Instruct`).
* **Caching & Reliability**: In-memory multi-tiered caching, deterministic fallback states, and connection timeouts with offline tolerance.

---

## 💾 Comprehensive Database Schema Reference

Defined in `database/schema.ts` (90+ production tables with composite unique indexes):

### 1. Developer Capability & Profile Core
* **`users`**: Developer profile metadata, roles (`developer`, `recruiter`), GitHub token sync.
* **`developer_capability_cards` (DCC 2.0)**: Composite capability rating (0–1000), overall level (`Explorer`, `Builder`, `Proficient`, `Specialist`, `Expert`, `Elite`), verification status, and confidence score.
* **`capability_dimensions`**: 6 granular dimensions (`engineering`, `skills`, `projects`, `collaboration`, `growth`, `career`).
* **`capability_history`**: Chronological log of capability promotions, AST audit verifications, and score updates.
* **`capability_insights`**: AI-synthesized strengths, growth opportunities, and recommendations.
* **`verification_evidence`**: Evidence items indexed by source repo, freshness (`current`, `aging`, `stale`), confidence, and audit weight (`strong`, `moderate`, `weak`).

### 2. Repository & Intelligence Audits
* **`repositories`**: GitHub repositories tracked and synchronized with analysis states.
* **`reviews`**: Multi-agent review reports with AST metrics (code quality, architecture, security, documentation).
* **`user_skills` & `skills`**: Normalized skill records mapped to repositories and verified evidence.
* **`activity_events` & `engineering_timeline`**: Contextual activity events (commits, PRs, releases) tagged with AST density.

### 3. Company & Recruiter Workspaces (Phase 30)
* **`companies`**: Company profiles, logos, verification status, and hiring workspace attributes.
* **`company_members`**: Authorized recruiters and hiring managers.
* **`saved_developers`**: Candidate bookmarks, tags, and private recruiter notes.
* **`recruiter_notes`**: Isolated private candidate notes.
* **`recently_viewed_developers`**: Recruiter browsing telemetry.

### 4. Job & Opportunity Engine (Phase 31)
* **`jobs`**: Technical career vacancies, internships, freelance gigs, and project listings with skill & capability requirements.
* **`applications`**: One-click DCC applications with snapshot match scores and structured review statuses (`applied`, `reviewing`, `shortlisted`, `interview`, `rejected`, `accepted`).
* **`saved_opportunities`**: Bookmarked vacancies for developers.

### 5. Verification Challenges & Competitions (Phase 32)
* **`challenges`**: Multi-category competitions (`coding`, `frontend`, `backend`, `devops`, `ai_ml`, `full_project`) with configurable AST criteria weights (`functionality`, `codeQuality`, `architecture`, `testing`, `documentation`).
* **`challenge_participants`**: Registered developers and joint teams.
* **`challenge_submissions`**: Repository submissions audited by AST engine.
* **`challenge_evaluations`**: Deterministic scoring and AST Quality Tier assignment (`Verified Elite`, `Verified Expert`, `Verified Proficient`).
* **`challenge_judges`**: Judge assignments and internal evaluations.

### 7. AI Career & Learning Intelligence (Phase 35)
* **`career_goals`**: Developer active/custom career goals, milestone intents (`Prepare for First Job`, `Prepare for Internship`, `Promote to Senior`), target timeframes, and privacy controls (`is_public`).
* **`learning_roadmaps`**: Cached 4-stage personalized progression roadmaps hashed by capability state and target role.
* **`learning_tasks`**: Actionable daily, weekly, and monthly tasks with zero-score-inflation completion guards.
* **`career_recommendations_cache`**: Cached AI explainability guidance, project recommendations, matching challenges, and matched opportunities.

---

## ⚡ API Endpoint Specification

### 1. Developer Capability Cards & Intelligence
* **`GET /api/dcc`** / **`GET /api/developer/[username]`**: Complete sanitized DCC 2.0 profile, 6 dimensions, evidence, and growth history.
* **`GET /api/developer/[username]/activity`**: Activity cadence, contextual narrative, and monthly contribution density.
* **`GET /api/developer/[username]/capabilities`**: 9-category engineering capability mapping (`Frontend`, `Backend`, `DevOps`, `Systems`, etc.).
* **`GET /api/developer/[username]/verification`**: Evidence freshness and verification integrity audit.
* **`GET /api/developers`**: Multi-filter developer discovery engine (search by skill, role, level, min score).

### 2. AI Career & Learning Intelligence (Phase 35)
* **`GET /api/career`**: Master career overview aggregating active goal, role fits, readiness tier, roadmap, and tasks.
* **`GET /api/career/goals`** & **`POST /api/career/goals`**: Retrieve and configure developer career goals and timelines.
* **`GET /api/career/roles`** & **`GET /api/career/roles/[id]`**: 10-role fit matrix evaluation and deep-dive criteria comparison.
* **`GET /api/career/roadmap`** & **`POST /api/career/roadmap`**: 4-stage personalized learning roadmap.
* **`GET /api/career/tasks`**: Daily, weekly, and monthly actionable learning tasks checklist.
* **`POST /api/career/tasks/[id]/complete`**: Complete/uncomplete learning task without inflating DCC score.
* **`GET /api/career/progress`**: Learning streaks, completed tasks count, and milestone history.
* **`GET /api/career/recommendations`**: Curated project specs, matching public challenges, and matched opportunities.

### 3. Opportunity Engine (Phase 31)
* **`GET /api/jobs`** & **`POST /api/jobs`**: Discover and publish opportunities with live DCC match scores.
* **`GET /api/jobs/[id]`**: Detailed job requirements, company profile, and DCC proof preview.
* **`POST /api/jobs/[id]/apply`**: 1-click apply with DCC proof snapshot.
* **`POST /api/jobs/[id]/save`** & **`DELETE /api/jobs/[id]/save`**: Bookmark/unbookmark opportunities.
* **`GET /api/applications`**: Developer submitted applications pipeline.
* **`GET /api/company/applications`** & **`PATCH /api/company/applications`**: Recruiter applicant review pipeline.

### 4. Verification Challenges Engine (Phase 32)
* **`GET /api/challenges`** & **`POST /api/challenges`**: Discover and create technical challenges with AST criteria weighting.
* **`GET /api/challenges/[id]`**: Challenge problem statement, rules, and live leaderboard.
* **`POST /api/challenges/[id]/join`** & **`DELETE /api/challenges/[id]/join`**: Register / leave challenge.
* **`POST /api/challenges/[id]/submit`**: Submit repository solution and trigger automated AST evaluation.
* **`GET /api/challenges/[id]/leaderboard`**: Deterministic challenge ranking table.

### 5. Team Formation & Collaboration Engine (Phase 33)
* **`GET /api/teams`** & **`POST /api/teams`**: Discover public teams and create engineering guilds.
* **`GET /api/teams/[id]`**: Team workspace overview, roster, tasks, milestones, and projects.
* **`POST /api/teams/[id]/invite`**: Invite developers with complementary verified skills.
### 6. VS Code IDE Integration (Phase 37)
* **`POST /api/ide/auth`**: Issues secure IDE session tokens and validates developer identity with live DCC scores.
* **`GET /api/ide/status`**: Lightweight heartbeat returning developer capability level, top skills, career goal, and active workspace repository verification status.
* **`POST /api/ide/inspect-file`**: Ephemeral contextual AST file review and explainability without persisting source code.

---

## 📁 Codebase Directory Structure

```
Sillverse/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication Screens (login, signup)
│   ├── (dashboard)/              # Core Dashboard Applications
│   │   ├── overview/             # Main Developer Hub + Career Widget
│   │   ├── career/               # AI Career & Learning Intelligence (Phase 35)
│   │   ├── developers/           # Developer Discovery (Phase 26)
│   │   ├── activity/             # Contribution Intelligence (Phase 27)
│   │   ├── skills/               # Skill Intelligence & Capabilities (Phase 28)
│   │   ├── jobs/                 # Opportunity Discovery (Phase 31)
│   │   │   └── [id]/             # Opportunity Detail & 1-Click Apply
│   │   ├── challenges/           # Verification Challenges Discovery (Phase 32)
│   │   │   └── [id]/             # Challenge Detail, Submission & Leaderboard
│   │   ├── teams/                # Team Formation Discovery (Phase 33)
│   │   │   └── [id]/             # Team Collaboration Workspace (4 Tabs)
│   │   ├── community/            # Developer Community & Knowledge Hub (Phase 34)
│   │   │   ├── questions/[id]/   # Dedicated Q&A Discussion & Solutions
│   │   │   └── reviews/[id]/     # Peer Code Review Workspace
│   │   ├── company/              # Company & Recruiter Portal (Phase 30)
│   │   ├── profile/              # Developer Profile Settings
│   │   └── projects/             # Tracked Repositories & Audits
│   ├── developer/[username]/     # Public Shareable Developer Capability Card (DCC)
│   └── api/                      # REST API Endpoints
│       ├── career/               # Phase 35 Career Endpoints (overview, goals, roles, roadmap, tasks)
│       └── ide/                  # Phase 37 IDE Integration Endpoints (auth, status, inspect-file)
├── packages/                     # Independent Extension Packages
│   └── vscode-extension/         # Official SkillVerse VS Code Extension (Phase 37)
│       ├── package.json          # Extension manifest, commands, views, configuration
│       ├── tsconfig.json         # Extension TypeScript build config
│       └── src/
│           ├── extension.ts      # Activation & command registration entrypoint
│           ├── api/client.ts     # Typed SkillVerse API Client
│           ├── auth/manager.ts   # VS Code SecretStorage authentication manager
│           ├── providers/        # DCCTreeProvider & RepoTreeProvider
│           ├── status/           # SkillVerseStatusBar item
│           ├── views/            # DCCWebviewPanel
│           └── commands/         # Auth, repo, file review, & view commands
├── components/                   # React UI Components
│   ├── shared/                   # Header, Navbar, Sidebar, CommandPalette
│   ├── dashboard/                # CareerWidget, DashboardGrowthSection
│   ├── dcc/                      # DCC 2.0 Cards, DCCCareerDirection, Radars
│   └── ui/                       # Design System Primitives
├── database/                     # Database Layer
│   └── schema.ts                 # Tables 1–93 with foreign keys and indexes
├── services/                     # Business Logic Engine Layer
│   ├── career/                   # Phase 35 Career Intelligence, Taxonomy & Engine
│   ├── dcc/                      # DCC 2.0 synthesis, evidence, insights, growth
│   ├── capability/               # Skill capability mapping (Phase 28)
│   ├── verification/             # Verification confidence & integrity (Phase 29)
│   ├── opportunity/              # Job & opportunity engine (Phase 31)
│   ├── challenge/                # Verification challenges engine (Phase 32)
│   ├── team/                     # Team formation & attribution engine (Phase 33)
│   └── community/                # Developer community & knowledge network (Phase 34)
├── scripts/                      # Automated Verification & Test Suites
│   ├── test-all.ts               # Master 18-Subsystem Test Runner (100% Passing)
│   ├── test-ide-extension.ts     # Phase 37 VS Code Extension Test Suite (36/36 assertions)
│   ├── test-career-engine.ts     # Phase 35 Test Suite (66/66 assertions)
│   ├── test-opportunity-engine.ts# Phase 31 Test Suite (28/28 assertions)
│   ├── test-challenge-engine.ts  # Phase 32 Test Suite (25/25 assertions)
│   ├── test-team-engine.ts       # Phase 33 Test Suite (14/14 assertions)
│   └── test-community-engine.ts  # Phase 34 Test Suite (24/24 assertions)
└── types/                        # TypeScript Domain Contracts
    ├── career.ts                 # Phase 35 career, role fit, roadmap, & task models
    ├── dcc.ts                    # DCC 2.0 schemas & dimensions
    ├── opportunity.ts            # Phase 31 opportunity & application models
    ├── challenge.ts              # Phase 32 challenge & evaluation models
    ├── team.ts                   # Phase 33 team, task, & contribution models
    └── community.ts              # Phase 34 community, Q&A, & peer review models
```

---

## 🧪 Master Test Suite Summary (18/18 Subsystems)

All subsystems have been tested with comprehensive dummy datasets and verified passing:

1. **DCC 2.0 Engine** — Dimension calculation, overall rating, and level assignment.
2. **Repository Intelligence & AST Heuristics** — AST structure analysis and code depth evaluation.
3. **Repository Health & Quality Scoring** — Architecture and code quality grading.
4. **Trust Score & Developer Reputation** — Deterministic developer trust calculation.
5. **Multi-Agent Orchestrator** — Multi-agent code review pipeline.
6. **Public Profile & DCC Sanitizer** — Shareable public DCC serialization.
7. **Evidence Engine & Growth Timeline** — Freshness-weighted evidence tracking.
8. **Developer Discovery & Search** — Multi-facet developer search.
9. **Activity & Contribution Intelligence** — Cadence, contextual narrative, and density.
10. **Skill Intelligence & Capability Mapping** — 9-category engineering capability matrix.
11. **Verification Confidence & Integrity** — Freshness distribution and confidence index.
12. **Company & Recruiter Workspace** — Recruiter portal, shortlist, and candidate notes.
13. **Job & Opportunity Engine** — Deterministic DCC matching, 1-click apply, and application pipeline.
14. **Verification Challenges Engine** — AST criteria weighting, repo submissions, and leaderboards.
15. **Team Formation & Attribution Engine** — Team workspaces, tasks, milestones, and granular DCC attribution.
16. **Developer Community & Knowledge Network Engine** — Technical writeups, Q&A, peer code reviews, and community reputation.
17. **AI Career & Learning Intelligence Engine (Phase 35)** — 10-role fit matrix, evidence-supported gap analysis, 4-stage roadmaps, cadenced tasks, and cached recommendations.
18. **SkillVerse VS Code IDE Integration Engine (Phase 37)** — Token authentication, workspace repository detection, AST file inspection, DCC/Repo TreeDataProviders, and Status Bar.


