# SkillVerse Neon PostgreSQL Least-Privilege Role & Tenant Isolation Migration Plan

**Document Version:** 1.0 (Phase 43D Architecture Proposal)  
**Author:** Senior Application Security Engineer  
**Status:** PROPOSED — PENDING APPROVAL (No production database changes executed in Phase 43D)

---

## 1. Executive Summary & Problem Analysis

### Current State
SkillVerse connects to its Neon serverless PostgreSQL instance using the administrative role `neondb_owner` for all operations:
- Runtime HTTP API queries (Next.js serverless functions).
- Background workers and orchestration tasks.
- Migration tooling (Drizzle Kit).

### Critical Vulnerabilities of the Current Architecture
1. **Automatic Row-Level Security (RLS) Bypass:**  
   In PostgreSQL, table owners and superusers bypass RLS policies by default (`BYPASSRLS` attribute). Consequently, the security policies defined in `database/rls.sql` are **inactive and ineffective** when queries run under `neondb_owner`.
2. **Excessive Runtime Privileges:**  
   `neondb_owner` possesses full Data Definition Language (DDL) privileges. An application-layer SQL injection or compromised serverless execution context could drop tables, truncate audit logs, or alter database schemas.
3. **Missing Session Context in Neon:**  
   The existing `database/rls.sql` policies rely on Supabase's native `auth.uid()` function. In standard Neon PostgreSQL, `auth.uid()` does not exist unless explicitly created and backed by session variables (e.g., `current_setting('request.jwt.claim.sub', true)`).

---

## 2. Target Least-Privilege Role Architecture

We propose splitting database access into two strictly segregated roles:

```
┌────────────────────────────────────────────────────────┐
│                   Neon PostgreSQL                       │
├───────────────────────────┬────────────────────────────┤
│   skillverse_app          │   skillverse_migrator      │
│   (Runtime Application)   │   (CI/CD Schema Tooling)   │
├───────────────────────────┼────────────────────────────┤
│ • DML Only: SELECT, INSERT│ • DDL: CREATE, ALTER, DROP │
│   UPDATE, DELETE          │ • Runs Drizzle migrations  │
│ • NO DDL / NO DROP        │ • Direct unpooled URL      │
│ • Subject to RLS policies │ • Isolated to deployments  │
│ • Used by Next.js runtime │ • Disabled during runtime  │
└───────────────────────────┴────────────────────────────┘
```

### Role Specifications

| Attribute | `skillverse_app` (Runtime) | `skillverse_migrator` (Deployment) |
| :--- | :--- | :--- |
| **Purpose** | Serve live application API requests | Apply schema migrations |
| **Connection Route** | `DATABASE_URL` (Pooled PgBouncer) | `DATABASE_URL_UNPOOLED` (Direct connection) |
| **Permissions** | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `CREATE`, `ALTER`, `DROP`, table ownership |
| **RLS Behavior** | **Enforced** (`NOBYPASSRLS`) | Bypassed (for schema administration) |
| **Credential Rotation** | 90-day automated rotation | Ephemeral CI/CD pipeline secrets |

---

## 3. Evaluation: Application-Level Tenant Guards vs. Neon PostgreSQL RLS

| Evaluation Criteria | Application Guards (`AuthorizationGuard`) | Neon PostgreSQL Native RLS |
| :--- | :--- | :--- |
| **Current Status** | **ACTIVE & VERIFIED** across all API routes | **DRAFT / INACTIVE** (needs role migration) |
| **Enforcement Point** | Next.js API layer before query execution | Database engine on every row access |
| **Connection Pooler Safety** | 100% pooler-safe (stateless) | Requires `SET LOCAL` within transactions |
| **Defense Against IDOR** | Blocks cross-user access at controller boundary | Blocks cross-user access even if query is flawed |
| **Query Latency Overhead** | Zero DB overhead; evaluated in memory | ~5–15% evaluation overhead per row |
| **Recommended Strategy** | **Primary Active Defense (Immediate)** | **Defense-in-Depth Layer (Next Phase)** |

> [!IMPORTANT]
> **Architectural Recommendation:** Retain `AuthorizationGuard` as the primary active defense line for current production readiness. Implement Neon RLS as a secondary defense-in-depth layer once `skillverse_app` is provisioned.

---

## 4. Phase-by-Phase Migration Execution Plan

### Phase A: Role Provisioning & Grant Script (To Be Executed After Approval)

```sql
-- Step 1: Create application runtime role
CREATE ROLE skillverse_app WITH LOGIN PASSWORD 'STRICT_GENERATED_SECRET_HERE' NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- Step 2: Create deployment migration role
CREATE ROLE skillverse_migrator WITH LOGIN PASSWORD 'STRICT_GENERATED_SECRET_HERE' INHERIT NOCREATEDB NOCREATEROLE;

-- Step 3: Grant schema usage
GRANT USAGE ON SCHEMA public TO skillverse_app;
GRANT ALL ON SCHEMA public TO skillverse_migrator;

-- Step 4: Grant least-privilege DML to runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO skillverse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skillverse_app;

-- Step 5: Configure default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app;

-- Step 6: Revoke dangerous privileges from runtime role
REVOKE CREATE ON SCHEMA public FROM skillverse_app;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### Phase B: Neon Session Identity Helper for RLS
To enable `database/rls.sql` policies to function under Neon without Supabase:

```sql
-- Create Neon-compatible auth.uid() function
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Phase C: Environment Variable Transition

```env
# Runtime connections (Pooled via PgBouncer, connects as skillverse_app)
DATABASE_URL=postgresql://skillverse_app:SECRET@ep-flat-rice-ao8kdffq-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Direct migration connections (Direct connection, connects as skillverse_migrator)
DATABASE_URL_UNPOOLED=postgresql://skillverse_migrator:SECRET@ep-flat-rice-ao8kdffq.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Phase D: Emergency Break-Glass & Database Rollback Plan
> [!NOTE]
> **Phase 43D-R3.15 DBA Clarification:** Reverting `DATABASE_URL` is a **temporary Break-Glass service recovery bypass** (capped at 4 hours), NOT a database restoration. True catalog restoration to pre-migration baseline requires running [`database/migrations/phase43d-r38-rollback.sql`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql). See [`docs/phase43d-r315-rls-and-recovery-audit.md`](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/docs/phase43d-r315-rls-and-recovery-audit.md).

If `skillverse_app` encounters permission issues:
1. **Emergency Service Restoration (Break-Glass):** Temporarily revert `DATABASE_URL` in environment secrets to `neondb_owner` to unblock user traffic within 60 seconds (max 4h timebox).
2. **Database Catalog Rollback (True Rollback):** If issues cannot be remediated, execute `database/migrations/phase43d-r38-rollback.sql` via direct admin connection to reclaim ownership and drop migration roles.
3. Inspect `audit_logs` and PostgreSQL server logs for permission denials.

---

## 5. Security Sign-off Checklist Before Execution
- [ ] Approval from Lead Architect on role naming and grant hierarchy.
- [ ] Database credentials generated using cryptographically secure random entropy (minimum 32 bytes).
- [ ] CI/CD secrets updated without logging values.
- [ ] Full staging rehearsal completed before applying to production Neon.
