# SkillVerse Product Scope & Architectural Guardrails

This document establishes the official product boundaries and guardrails for SkillVerse. It defines the core foundation, supporting ecosystem modules, and deliberately deferred future areas.

---

## 1. CORE (Primary Product Loop)

The Core represents the fundamental value proposition of SkillVerse: **"Proof Over Claims"** for developers and recruiters.

* **Developer Capability Card (DCC)**: Evidence-backed engineering assessment reflecting real demonstrated code quality, architectural depth, and verified technical domains.
* **Repository Analysis Engine**: Deterministic Abstract Syntax Tree (AST) analysis, language discovery, framework identification, and code health scoring.
* **Evidence Engine**: Hierarchical evidence evaluation (`Strong`, `Moderate`, `Weak`) tying every capability claim directly to audited commits, repositories, or verified challenges.
* **Skill Intelligence & Capability Mapping**: Strict separation of technology detection from verified engineering capability.
* **Capability History & Provenance**: Chronological, immutable audit trail of capability transitions and repository provenance (`original`, `fork`, `collaborative`).
* **Public Developer Passport & Profile**: Public, tamper-resistant developer profile with granular privacy controls.

---

## 2. SUPPORTING (Platform Ecosystem)

Supporting features enhance developer growth, team collaboration, and verified opportunity discovery without overriding the core DCC evaluation engine.

* **Developer Discovery**: Search and talent filtering based on multidimensional verified capabilities rather than popularity metrics.
* **Opportunities & Job Matching**: Role-fit scoring based on concrete required vs. demonstrated capabilities.
* **Verification Challenges**: Time-bounded, test-driven coding challenges that directly yield `Strong` verified evidence.
* **Teams & Collaborative Workspaces**: Multi-developer project formation and peer code reviews.
* **Developer Community & Q&A**: Knowledge-sharing and peer code reviews.
* **Career & Learning Roadmaps**: Actionable learning recommendations derived from verified skill gaps.

---

## 3. FUTURE (Explicitly Deferred)

The following areas are **out of scope** for the current phase and must not be implemented prematurely:

* **Autonomous AI Recruiter Agent**: Automated hiring decisions without human review.
* **Autonomous AI Software Engineer**: Code writing bots or automated pull-request generators.
* **Global Developer Leaderboard**: Gaming mechanics and global ranking tables that incentivize score manipulation.
* **Complex Microservices / Kubernetes**: Premature infrastructure migrations beyond current Next.js/Serverless architecture.
* **Commercial Payment Gateway Integrations**: Enterprise multi-currency payment providers (rely on Phase 39 free-first billing foundation).
* **Stand-alone Mobile Applications**: Native iOS/Android builds.

---

## 4. Architectural Principles

1. **Evidence-First**: Popularity (stars, forks, followers) must never dictate engineering capability.
2. **Conservative Evaluation**: A package manifest or README mention is weak evidence and can never independently produce a `Verified` skill or `Strong` capability tier.
3. **AI as Analyst, Not Judge**: Capability decisions combine deterministic AST proofs, historical evidence, contribution context, and AI analysis.
4. **Idempotent Re-analysis**: Re-analyzing a repository updates existing evidence rather than duplicating scores.
5. **Human-Centric Transparency**: Every capability must have a concise, plain-language explanation without exposing internal mathematical formulas.
