# SkillVerse Phase 44: Rollback & Disaster Recovery Runbook

**Document Version:** 1.0  
**Target Environment:** Neon Serverless PostgreSQL (`neondb`)  
**Scope:** Better Auth Schema Migration, Least-Privilege Roles, and Application Compatibility  
**Author:** Principal Software Engineer & PostgreSQL Security Specialist  
**Status:** MANDATORY OPERATIONAL PROCEDURE

---

## 1. Executive Summary & Core Principle

> [!CAUTION]
> **CRITICAL RULE:** Never execute database rollback SQL automatically simply because an application deployment rolled back. Application code rollback and database DDL rollback have distinct lifecycles and vastly different data-loss consequences.

Application rollback is **non-destructive** (restores previous container image or commit).  
Database rollback (`phase44-better-auth-rollback.sql`) is **inherently destructive** (permanently destroys session tokens, OAuth credentials, and email verification status).

---

## 2. Inventory of Data Destroyed During Database Rollback

If `database/migrations/phase44-better-auth-rollback.sql` is executed, the following data and catalog structures are permanently deleted:

| Object Destroyed | Classification | Impact & Data Loss Description |
| :--- | :--- | :--- |
| **`sessions` Table** | Ephemeral Auth Data | All active browser session tokens are deleted. **100% of currently logged-in users receive HTTP 401** and must re-authenticate. |
| **`accounts` Table** | Persistent OAuth Data | All GitHub OAuth linkages (`access_token`, `refresh_token`, provider account IDs) are dropped. Users who registered exclusively via Better Auth GitHub OAuth without legacy Supabase credentials lose their OAuth connection. |
| **`verifications` Table**| Ephemeral Tokens | All pending email verification tokens and magic links are destroyed. Users attempting to click emailed links will encounter token expiration/invalidation. |
| **`users.email_verified`**| User Profile Attribute | The column is dropped from `users`. Verification state flags for all existing and newly verified users are **permanently removed**. |

### Objects That Remain Preserved:
- Core `users` table rows (id, email, username, name, avatarUrl, bio, role, location, githubId).
- `developer_capability_cards` (DCC scores, dimensions, evidence chains).
- `repositories`, `challenges`, `teams`, `personal_access_tokens`, and `audit_logs`.

---

## 3. Strict Application vs Database Rollback Sequence

### **Phase A: Application Code Rollback (Always Step 1)**
If Better Auth encounters runtime issues in production, execute application rollback first:
1. Re-deploy the previous production release (Phase 43D baseline).
2. The Phase 43D application code does **not** query `sessions` or `accounts` (it utilizes `services/supabase.ts` and legacy session handlers).
3. The Phase 43D application code ignores the existence of `users.email_verified` (or reads it safely without crashing).
4. **Result:** Application recovers immediately without dropping any database tables or losing user data!

### **Phase B: Database DDL Rollback (Only with Explicit Operator Sign-off)**
> [!WARNING]
> If database rollback SQL is executed **before** or **without** application rollback:
> The active application code ([`database/schema.ts`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/schema.ts#L22)) explicitly declares `emailVerified: boolean('email_verified')`. Dropping `email_verified` causes Drizzle ORM to crash on every user lookup:
> ```
> ERROR: column "email_verified" does not exist
> ```
> Therefore, **Database DDL rollback must NEVER run before application rollback has completed**.

---

## 4. Preconditions & Snapshot Requirements Before DDL Rollback

Before any operator runs `phase44-better-auth-rollback.sql`:

1. **Explicit Operator Authorization:** Requires dual sign-off from Lead Architect and Database Administrator.
2. **Neon Point-in-Time Snapshot:**
   ```bash
   neon branches create --name pre-rollback-backup-$(date +%s)
   ```
3. **Cold Logical Dump:**
   ```bash
   pg_dump -Fc -h "$DIRECT_HOST" -U neondb_owner -d neondb -f "skillverse_pre_rollback_$(date +%Y%m%d_%H%M%S).dump"
   ```
4. **Pre-Rollback Audit Queries:** Run these verification queries to assess active data footprint:
   ```sql
   SELECT count(*) AS total_active_sessions FROM sessions;
   SELECT count(*) AS total_linked_accounts FROM accounts;
   SELECT count(*) AS total_verified_users FROM users WHERE email_verified = true;
   ```

---

## 5. Non-Destructive Recovery Alternative (Recommended)

In 95% of operational incidents, destructive DDL rollback is **not** required. Use this non-destructive mitigation path instead:

1. **OAuth Provider Degraded:** If GitHub OAuth experiences an outage or callback issue, users with existing Personal Access Tokens (PAT) or demo accounts (in non-production) continue to operate unaffected.
2. **Hotfix Secret / URL:** If `BETTER_AUTH_SECRET` or `BETTER_AUTH_URL` was misconfigured in environment variables, update the environment secret and trigger a zero-downtime rolling restart. Sessions remain valid.
3. **Database Timeout / Circuit Breaker:** If Neon connection pooler latency triggered circuit-breaker open states, adjust `MINIMUM_SAFE_TIMEOUT_MS` and pool size in configuration without dropping any tables.

---

## 6. Least-Privilege Role Rollback Safety

When executing `phase44-least-privilege-roles-rollback.sql`:
1. **Revert Environment Variable:** Update `DATABASE_URL` in application secrets back to `neondb_owner` BEFORE revoking role privileges.
2. **Cluster-Wide Role Warning:** PostgreSQL roles are global to the database cluster. Ensure `skillverse_app` is not utilized by another database on the same Neon project before dropping.
3. **Clean Dependency Removal:** The script executes `REASSIGN OWNED BY` and `DROP OWNED BY` prior to `DROP ROLE` to prevent `dependent objects exist` fatal errors.
