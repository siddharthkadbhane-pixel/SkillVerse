# SkillVerse Production Incident Response Runbook

This runbook outlines standard operating procedures for identifying, responding to, mitigating, and documenting production incidents on SkillVerse.

---

## 1. Incident Severity Levels

| Level | Severity | Description | Response SLA |
| :--- | :--- | :--- | :--- |
| **SEV-1** | Critical Outage | Core platform down (DCC unavailable, auth failing, major data corruption) | < 15 minutes |
| **SEV-2** | Major Degradation | Core AST analysis failing, AI services timeout, GitHub rate-limited | < 1 hour |
| **SEV-3** | Minor Degradation | Non-critical feature degraded (e.g. badge export, delayed webhook delivery) | < 4 hours |
| **SEV-4** | Low Priority | Cosmetic UI bugs, non-blocking telemetry warnings | Next business day |

---

## 2. Immediate Triage & Diagnostics

### Step 1: Health Check & System Status
Check the live health endpoint:
```bash
curl -I https://skillverse.dev/api/health
```
- **200 OK (`status: healthy`)**: Next.js runtime and database circuit breaker operational.
- **200 OK (`status: degraded`)**: Remote Supabase pooler offline; application operating smoothly in resilient fallback mode.
- **500 / 502 / 504**: Vercel serverless timeout or upstream fatal error.

### Step 2: Inspect Structured Logs
Check Vercel deployment logs or local server logs:
- Search for `[ERROR]` or `level: "ERROR"`.
- All credentials (`sk_live_*`, `ghp_*`, `whsec_*`) are automatically masked.
- Extract the correlated `requestId` from the error message.

---

## 3. Mitigation Procedures for Common Failure Modes

### Scenario A: Remote Database (Supabase) Unavailability / Timeouts
1. **Current State**: SkillVerse features a high-speed circuit breaker in `lib/drizzle.ts` (150ms timeout).
2. **Behavior**: Queries automatically fallback to zero-latency in-memory stores with pre-seeded baseline data.
3. **Action**:
   - Check Supabase status page (`status.supabase.com`).
   - If pooler credentials changed, update `DATABASE_URL` in Vercel Environment Variables and redeploy.

### Scenario B: GitHub API Rate Limiting (403 / 429)
1. **Symptom**: `GitHub API error [403]: rate limit exceeded`.
2. **Action**:
   - Verify `GITHUB_ACCESS_TOKEN` is active.
   - SkillVerse analysis pipeline automatically falls back to cached metadata and AST heuristics.
   - If needed, rotate the token in Vercel environment variables.

### Scenario C: AI Multi-Agent / Hugging Face Downtime
1. **Symptom**: `HF HTTP error status 503` or timeout.
2. **Behavior**: `HuggingFaceService` automatically executes the deterministic AST mock code auditor. DCC ratings and verification chains are NEVER corrupted.
3. **Action**:
   - Check Hugging Face Inference API status.
   - No data recovery needed due to automatic fallback.

### Scenario D: Compromised Secrets / Token Leakage
1. **Action**:
   - Immediately rotate the compromised secret in Vercel Settings -> Environment Variables.
   - For PAT tokens, invoke `POST /api/v1/keys/[id]` with revocation action.
   - Trigger production redeploy (`vercel --prod`).

---

## 4. Post-Mortem & Incident Documentation

For all SEV-1 and SEV-2 incidents, complete a post-mortem containing:
1. **Summary**: Impact duration, user affected percentage.
2. **Root Cause**: Specific triggering event.
3. **Trigger & Detection**: How the issue was identified.
4. **Resolution**: Exact actions taken to restore service.
5. **Preventative Measures**: Architectural improvements to eliminate recurrence.
