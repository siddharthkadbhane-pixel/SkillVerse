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

## 6. Least-Privilege Role Rollback & Mandatory Connection Draining Gate

When executing `database/migrations/phase44-least-privilege-roles-rollback.sql`, operators must follow this strict 7-step sequence. Do NOT execute the SQL rollback script while web runtime connections remain active.

```mermaid
flowchart TD
    S1["1. Stop / Redirect Application Traffic"] --> S2["2. Update Vercel Recovery Environment Variables"]
    S2 --> S3["3. Redeploy or Set Maintenance Mode"]
    S3 --> S4["4. Drain Application Connection Pools"]
    S4 --> S5["5. Verification Gate: 0 Active Sessions in pg_stat_activity"]
    S5 --> S6["6. Execute phase44-least-privilege-roles-rollback.sql as neondb_owner"]
    S6 --> S7["7. Verify Table Ownership Restoration & Role Removal"]
```

### Step-by-Step Rollback Execution Sequence:

1. **Stop or Redirect Application Traffic:**
   Place the application in maintenance mode or redirect ingress traffic to an offline status page.
2. **Update Vercel Environment Configuration:**
   Update the Vercel Production environment variables for the intended recovery deployment (see Section 7 for variable compatibility).
3. **Redeploy or Enforce Maintenance Mode:**
   Trigger a deployment in Vercel to activate maintenance mode or pre-Phase 44 code, ensuring running pods begin terminating old connection pools.
4. **Drain Application Connection Pools:**
   Allow serverless functions and PgBouncer connection pools to drain active connections (minimum 30 seconds).
5. **Verify Zero Remaining Connections (Mandatory Verification Gate):**
   Connect as `neondb_owner` over the direct endpoint using `PGPASSFILE` and execute:
   ```sql
   SELECT pid, usename, client_addr, application_name, state
   FROM pg_catalog.pg_stat_activity
   WHERE usename IN ('skillverse_app', 'skillverse_migrator');
   ```
   *Gate Requirement:* This query **MUST return 0 rows** before proceeding. If any connections remain, terminate them manually and re-verify:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_catalog.pg_stat_activity
   WHERE usename IN ('skillverse_app', 'skillverse_migrator')
     AND pid <> pg_backend_pid();
   ```
   *Note:* The administrative session executing the query is explicitly excluded (`pid <> pg_backend_pid()`).
6. **Execute Rollback Only After Verification Gate Passes:**
   Execute the audited rollback script via direct endpoint using `PGPASSFILE`:
   ```bash
   psql -h ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432 -v ON_ERROR_STOP=1 -f database/migrations/phase44-least-privilege-roles-rollback.sql
   ```
7. **Verify Ownership Restoration & Role Removal:**
   Run post-rollback verification queries:
   ```sql
   -- Verify all public tables restored to neondb_owner
   SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tableowner != 'neondb_owner';
   -- Expected: 0

   -- Verify drizzle schema and migration ledger preserved and restored to neondb_owner
   SELECT n.nspname, t.tablename, t.tableowner
   FROM pg_catalog.pg_tables t
   JOIN pg_catalog.pg_namespace n ON n.nspname = t.schemaname
   WHERE n.nspname = 'drizzle' AND t.tableowner != 'neondb_owner';
   -- Expected: 0 rows (drizzle schema and __drizzle_migrations preserved and owned by neondb_owner)

   -- Verify roles dropped
   SELECT rolname FROM pg_roles WHERE rolname IN ('skillverse_app', 'skillverse_migrator');
   -- Expected: 0 rows
   ```

---

## 7. Vercel Recovery Compatibility & Environment Variable Requirements

> [!IMPORTANT]
> **Vercel Deployment Rollback Limitation:** Rolling back a Git deployment in Vercel **does NOT automatically restore or revert project environment variables**. Project environment variables are global to the environment. The SRE must explicitly synchronize environment variables when switching between deployment generations.

### Environment Variable Requirements Matrix:

| Deployment Generation | Required Connection Variable | Prohibited Variables | Behavior / Guard |
| :--- | :--- | :--- | :--- |
| **Current Phase 44 Application** | `APP_DATABASE_URL` (points to `skillverse_app` on pooled host) | `DATABASE_URL` (with `neondb_owner`) | `lib/db-config.ts` throws fatal error on startup if `APP_DATABASE_URL` is omitted or contains admin roles. |
| **Pre-Phase 44 Application (Phase 43D Baseline)** | `DATABASE_URL` (points to `neondb_owner` on pooled host) | None | Pre-Phase 44 code reads `DATABASE_URL` only. If `DATABASE_URL` is missing, application crashes with connection error. |
| **Emergency Break-Glass Recovery** | `DATABASE_URL` (points to `neondb_owner` on pooled host) | N/A | Time-boxed service restoration while investigation occurs. Requires subsequent catalog rollback. |

---

## 8. DBA Credential Security Standard (PGPASSFILE & Non-CLI Ingestion)

To eliminate process inspection (`ps aux`, `/proc/<pid>/cmdline`, Windows Process Explorer) and shell history leaks:

1. **Zero Command-Line Passwords:** Never pass connection URIs containing passwords (`postgres://user:pass@host/db`) as command-line arguments to `psql` or any CLI utility.
2. **Preferred Mechanism — `PGPASSFILE`:**
   - Create a temporary, restricted-permission credentials file:
     ```
     ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech:5432:neondb:<username>:<password>
     ```
   - **Linux/macOS:** Ensure permissions are strictly `0600` (`chmod 0600 ~/.pgpass` or `chmod 0600 "$PGPASSFILE"`).
   - **Windows PowerShell:** Restrict file ACL to current user only:
     ```powershell
     icacls $pgpassPath /inheritance:r /grant:r "$($env:USERNAME):R"
     $env:PGPASSFILE = $pgpassPath
     ```
   - Execute CLI with host, port, db, user flags:
     ```bash
     psql -h ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech -U neondb_owner -d neondb -p 5432 -v ON_ERROR_STOP=1 -f <script.sql>
     ```
   - Securely wipe and remove the temporary file immediately after completion (`shred -u` or overwrite with zeros before deletion).
3. **Alternative — Transient Environment Variable:**
   If `PGPASSFILE` cannot be created, pass `PGPASSWORD` inside a subshell or `try/finally` block:
   - **Linux/macOS:** `( export PGPASSWORD="<secret>" && psql -h ... -U ... -d ... )`
   - **PowerShell:** `$env:PGPASSWORD = "<secret>"; try { psql -h ... -U ... -d ... } finally { $env:PGPASSWORD = $null }`
   - *Note:* Environment variables are accessible to processes with same UID/privileges; `PGPASSFILE` with `0600` permissions remains the preferred standard.
