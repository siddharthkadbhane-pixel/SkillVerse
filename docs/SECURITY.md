# SkillVerse Production Security Architecture & Policies

This document outlines the security controls, authentication mechanisms, Row Level Security (RLS) enforcement, authorization boundaries, and vulnerability reporting procedures for **SkillVerse**.

---

## 1. Authentication Architecture

SkillVerse supports two primary authentication models:
1. **First-Party Web Sessions**: Supabase Auth with OAuth 2.0 (GitHub / Google) session cookies managed via `@supabase/ssr`.
2. **Developer API & IDE Tokens (Phase 38)**: Cryptographic Personal Access Tokens (PAT).
   - High-entropy raw tokens with prefix `sk_live_...`.
   - Stored in the database exclusively as **SHA-256 hashes**.
   - Raw tokens are returned exactly once upon creation.
   - Bound to granular scopes (`read:profile`, `read:dcc`, `write:analysis`, `write:webhooks`).

---

## 2. Server-Side Authorization & Anti-IDOR Protections

All protected endpoints enforce authorization server-side through `AuthorizationGuard` (`services/security/authorizer.ts`):
- **Resource Ownership**: Users cannot view, modify, or delete another user's private data or tokens.
- **Company Workspace Boundaries**: Recruiters and company admins are strictly isolated to their own organization's candidate shortlists, pipeline notes, and challenge configurations.
- **Role Hierarchy**:
  - `developer`: Access to personal DCC, AST analyses, public challenges, team guild creation, and personal PAT tokens.
  - `recruiter`: Access to candidate discovery filters, private recruiter notes, and company talent pipelines.
  - `company_admin`: Member management, company billing, and challenge hosting.
  - `admin`: Superuser administrative visibility and audit log inspection.
- **Anti-Tampering**: Client-side role claims are discarded; roles are strictly verified from the server session.

---

## 3. Row Level Security (RLS) Policies

All 18 primary tables feature PostgreSQL Row Level Security enabled (see `database/rls.sql`):
- **Developer Privacy**: Code reviews, PAT tokens, and private repositories are accessible only by the owning developer.
- **Company Data Isolation**: Recruiter candidate notes and member rosters are accessible only by active members of that specific company.
- **Audit Logs**: Immutable and readable only by platform administrators.

---

## 4. Webhook Security & Anti-Replay Safeguards

SkillVerse event webhooks (`services/webhooks/engine.ts`, `services/billing/webhooks.ts`):
1. **HMAC-SHA256 Signatures**: Injected as header `X-SkillVerse-Signature: sha256=<hash>`.
2. **Timestamp Verification**: Payloads with timestamps older than 300 seconds are rejected to eliminate replay attacks.
3. **Idempotency Protection**: Inbound events are keyed by unique `event_id` preventing duplicate execution.

---

## 5. Defense-in-Depth HTTP Security Headers

Injected globally via Next.js `middleware.ts`:
- `Content-Security-Policy`: Restricts scripts, styles, images, and frame ancestors.
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff`
- `X-Frame-Options`: `DENY` (Clickjacking defense)
- `X-XSS-Protection`: `1; mode=block`
- `Referrer-Policy`: `strict-origin-when-cross-origin`
- `Permissions-Policy`: `camera=(), microphone=(), geolocation=()`

---

## 6. Secret Management & Log Sanitization

1. **Zero Secret Leakage**: Secrets (`DATABASE_URL`, `GITHUB_ACCESS_TOKEN`, `HUGGINGFACE_API_KEY`, `BILLING_WEBHOOK_SECRET`) are never included in client-side bundles.
2. **Structured Log Masking**: `Logger` automatically redacts `sk_live_*`, `Bearer *`, `ghp_*`, `whsec_*`, passwords, and DB connection strings before outputting.

---

## 7. Vulnerability Disclosure Policy

If you discover a security vulnerability in SkillVerse, please email `security@skillverse.dev`. We will acknowledge receipt within 24 hours and provide regular updates until resolution.
