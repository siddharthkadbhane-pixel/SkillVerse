# SkillVerse Data Flow & Trust Boundaries (Phase 41)

This document visualizes and explains the data flow pathways, network boundaries, and encryption layers across the SkillVerse platform.

---

## 1. End-to-End System Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Developer Browser / IDE                                │
│       • HTTPS Web Dashboard (Next.js 15 UI)                                            │
│       • VS Code IDE Extension / CLI (sk_live_... Bearer Token)                         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ TLS 1.3 Encrypted (x-request-id tagged)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Next.js 15 Edge & Middleware                              │
│       • Rate Limiter (180 req/min/IP)                                                  │
│       • Security Headers (CSP, HSTS, X-Frame-Options: DENY)                            │
│       • Request Size Guard (Max 5MB Payload)                                           │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Internal Process Boundary
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           AuthorizationGuard & Domain Engines                          │
│       • Anti-IDOR Resource Ownership Checks                                            │
│       • Role Hierarchy & Scope Checks (read:dcc, write:analysis)                       │
│       • Structured Log Masking (Redacts Tokens & Secrets)                              │
│       • Response Sanitizer (Strips Token Hashes, Passwords)                            │
└──────────────┬────────────────────────────┬─────────────────────────────┬──────────────┘
               │ OAuth & Manifests          │ Ephemeral Manifests (<500KB)│ Relational Data
               ▼                            ▼                             ▼
┌──────────────────────────────┐ ┌──────────────────────┐ ┌──────────────────────────────┐
│       GitHub REST API        │ │ Hugging Face API     │ │    Supabase PostgreSQL       │
│ • Commit History (< 15)      │ │ • In-flight LLM      │ │ • 104 Normalized Tables      │
│ • Package.json / Manifest    │ │   Inference          │ │ • Row Level Security (RLS)   │
│ • Top 5 Source Files (<100KB)│ │ • Ephemeral Context  │ │ • Circuit Breaker (150ms)    │
│ • 500KB Aggregated Limit     │ │ • Zero Model Training│ │ • In-Memory Fallback Cache   │
└──────────────────────────────┘ └──────────────────────┘ └──────────────────────────────┘
```

---

## 2. Trust Boundaries & Privacy Controls

1. **Browser ↔ Server Boundary**:
   - Strictly enforced HTTPS with TLS 1.3.
   - HttpOnly, Secure session cookies for web application authentication.
   - Personal Access Tokens (PAT) validated via Bearer header and compared against SHA-256 hashes.

2. **Server ↔ GitHub Boundary**:
   - User-authorized OAuth tokens used exclusively for repository metadata, trees, and manifests.
   - Private repositories are **never** queried without explicit developer authorization in Settings.
   - GitHub connection can be disconnected at any time, instantly revoking local token access.

3. **Server ↔ AI Boundary**:
   - Only truncated structural manifests and top source files under 500KB total context are transmitted.
   - No private keys, database credentials, or secret configuration files (`.env`, `id_rsa`) are ever sent to AI.
   - Hugging Face endpoint executes in ephemeral inference mode with zero data retention for training.

4. **Server ↔ Database Boundary**:
   - Row Level Security (RLS) isolates developer private data and recruiter workspace tenant records.
   - Database credentials are never exposed in client bundles or API error responses.
