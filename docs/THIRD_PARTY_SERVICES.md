# SkillVerse Third-Party Service Register (Phase 41)

This register documents all third-party service providers that process or store data in connection with the operation of **SkillVerse**.

---

## 1. Third-Party Service Register

| Service Provider | Entity / Location | Purpose | Data Shared | Necessity | Privacy / Security Safeguards |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GitHub** (GitHub, Inc.) | USA | OAuth authentication, fetching repository metadata, trees, and commit histories | GitHub username, OAuth tokens, public repository URLs | **Required** for GitHub integration; optional if using manual profile | Scoped OAuth permissions; tokens stored encrypted/hashed; disconnectable anytime |
| **Supabase** (Supabase, Inc.) | USA / AWS ap-southeast-2 | Managed PostgreSQL database, authentication, Row Level Security (RLS) | Encrypted user profiles, DCC scores, verified skills, tokens, audit logs | **Required** core backend storage | Dedicated VPC database instance, SSL encrypted in transit, Row Level Security active |
| **Hugging Face** (Hugging Face, Inc.) | USA / France | Multi-agent AI code review and architecture analysis (Serverless Inference) | Temporary AST code snippets, dependency manifests, readme summaries (< 500KB cap) | **Required** for AI reviews; optional if using basic AST rules | Ephemeral in-flight inference; zero training data usage; fallback AST parser on outage |
| **Vercel** (Vercel, Inc.) | USA | Next.js serverless compute hosting, global CDN, edge middleware | IP address, User-Agent, HTTP headers for request routing | **Required** platform hosting | HTTPS / TLS 1.3 enforced; edge DDoS protection; strict CSP and HSTS headers |

---

## 2. Services Explicitly NOT Used

To protect developer privacy and avoid unnecessary data proliferation, SkillVerse **DOES NOT** employ:
- ❌ Third-party advertising trackers (Google Ads, Facebook Pixel, TikTok Pixel).
- ❌ Cross-site behavioral fingerprinting networks.
- ❌ Third-party data brokers or contact scrapers.
- ❌ Third-party cookie syndication networks.
