# SkillVerse Legal, Privacy & Compliance Launch Checklist (Phase 41)

This checklist tracks engineering readiness for public launch under global privacy standards and the **Digital Personal Data Protection Act, 2023 (DPDP)** of India.

---

## 1. Transparency & Privacy Notice
- [x] Clear, plain-language Privacy Policy published at `/privacy`.
- [x] Terms of Service published at `/terms`.
- [x] Cookie & Tracking disclosure published at `/cookies`.
- [x] Dedicated Privacy & Grievance Request portal published at `/contact/privacy`.
- [x] Notice versioning established (`v1.0`) for auditability.
- [x] Plain explanations of GitHub repository reads and AI multi-agent review mechanics.

## 2. Consent & User Rights Architecture
- [x] Granular purpose tracking implemented (`user_consents` table).
- [x] Specific consent for private repository analysis, public profile indexing, and telemetry.
- [x] Immediate consent withdrawal supported in Settings (`services/privacy/consent.ts`).
- [x] One-click "Download My Data" (GDPR / DPDP data subject access) at `/api/privacy/export`.
- [x] Two-step account deletion & data anonymization at `/api/privacy/delete`.
- [x] Disconnect GitHub integration workflow at `/api/privacy/disconnect-github`.

## 3. Data Protection & Security Controls
- [x] PostgreSQL Row Level Security (RLS) active on all primary entities (`database/rls.sql`).
- [x] Anti-IDOR guards enforcing resource ownership and company workspace isolation (`AuthorizationGuard`).
- [x] Structured logs automatically redacting secrets, tokens (`sk_live_...`), and passwords (`Logger.maskSecrets`).
- [x] Ephemeral AI processing with strict < 500KB context caps and zero full-code storage.
- [x] Personal Access Tokens stored exclusively as SHA-256 hashes (`personal_access_tokens`).
- [x] Security headers (CSP, HSTS, X-Frame-Options: DENY) enforced via `middleware.ts`.

## 4. India DPDP Act 2023 Engineering Alignment
- [x] Clear notice describing data collected and processing purposes prior to consent.
- [x] Consent is free, specific, informed, and capable of being withdrawn with comparable ease.
- [x] Technical mechanism to access and review processed personal data.
- [x] Technical mechanism to request erasure/anonymization of personal data when no longer needed.
- [x] Grievance redressal contact portal (`/contact/privacy`).
- [x] Age consideration: Intended for adult developers (18+); child-directed features intentionally excluded.

---

> [!NOTE]
> This checklist tracks technical and engineering readiness. Prior to commercial public launch, final review by qualified legal counsel in applicable operating jurisdictions is recommended.
