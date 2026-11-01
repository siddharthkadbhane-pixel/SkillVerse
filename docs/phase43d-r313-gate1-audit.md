# SkillVerse Phase 43D-R3.13: Gate-1 Disposable Neon Branch Execution & Evidence Audit Report

**Audit Date:** 2026-10-25  
**Auditor Role:** Independent Adversarial PostgreSQL 18 / Neon Serverless DBA  
**Verdict:** **`GATE-1 PASSED — DBA REVIEW REQUIRED`**  
**Production Status:** **`STRICT NO-GO`** (Execution against production strictly prohibited without manual DBA sign-off and authorized maintenance window)  
**Scope:** Disposable preview branch only (`preview-gate1-test`)

---

## Executive Summary

Phase 43D-R3.13 conducted the mandatory empirical Gate-1 execution of the Phase 43D-R3.8 migration and rollback SQL scripts against an isolated, disposable Neon preview branch provisioned directly from current `production` baseline.

All operations were executed with zero secrets printed or exposed in shell history, logs, or process lists. Every phase requirement was verified empirically against live PostgreSQL 18.6 catalog queries:

1. **Branch Isolation:** Confirmed branch-level catalog isolation. Role mutations on `preview-gate1-test` had zero footprint on `production`.
2. **Artifact Integrity:** Tested migration and rollback pair pinned by cryptographic SHA-256 checksums.
3. **Migration Execution:** Applied the single-transaction migration successfully with zero errors; all preflight and postflight assertions passed.
4. **Permission & Boundary Validation:** `skillverse_app` demonstrated full positive DML capabilities (INSERT, SELECT, UPDATE, DELETE on synthetic records) while being hard-blocked (HTTP 42501) on table creation, dropping, altering, truncating, and accessing schema `drizzle`. Connection routing was verified through both direct unpooled and PgBouncer pooled endpoints.
5. **Synthetic Drizzle Kit Migration:** `skillverse_migrator` successfully executed `drizzle-kit migrate`, recording ledger entry #2 in `drizzle.__drizzle_migrations`. Verified that new tables created by the migrator automatically inherit read/write privileges for `skillverse_app` via PostgreSQL `DEFAULT PRIVILEGES`.
6. **Rollback Execution & Catalog Diff:** Applied the single-transaction rollback script. Preflight, table reclaim, dependency guards, role drops, and postflight checks passed completely. Baseline vs. post-rollback catalog comparison demonstrated **100% mathematical parity (zero diff)** across all 13 inspected catalog dimensions.

---

## 1. Verified Branch Identity & Isolation Evidence

### 1.1 Branch Hierarchy & Endpoints
* **Neon Project ID:** `tiny-night-04715217` (`Skillverse`)
* **Region:** `aws-ap-southeast-1`
* **PostgreSQL Engine:** PostgreSQL 18.6 (fd34222)
* **Baseline Branch (Production):**
  * Branch ID: `br-lucky-dawn-ao4a6rww`
  * Compute Endpoint: `ep-quiet-grass-a14g7s5u`
* **Tested Disposable Preview Branch:**
  * Branch Name: `preview-gate1-test`
  * Branch ID: `br-patient-lake-aokv6adp`
  * Compute Endpoint: `ep-muddy-silence-aof0k3ok`
  * Direct Unpooled Host: `ep-muddy-silence-aof0k3ok.c-2.ap-southeast-1.aws.neon.tech`
  * Pooled Host: `ep-muddy-silence-aof0k3ok-pooler.c-2.ap-southeast-1.aws.neon.tech`

### 1.2 Isolation Proof
During active migration on `preview-gate1-test` (when `skillverse_migrator` and `skillverse_app` existed and held ownership/grants), an independent read-only probe was executed against the **production** branch:

```sql
SELECT rolname FROM pg_roles WHERE rolname IN ('skillverse_migrator', 'skillverse_app');
```

**Captured Production Branch Output:**
```json
Result(0) []
```
*Empirical finding:* Neon branches maintain independent cluster-level system catalogs (`pg_authid`, `pg_roles`, `pg_database`). Creating roles on the preview branch caused zero leakage or mutation on production.

---

## 2. Tested Artifact Checksums & Manifest

The tested migration and rollback files were audited and checksummed immediately prior to Gate-1 execution:

| Artifact Path | SHA-256 Checksum | Size (bytes) | Lines |
| :--- | :--- | :--- | :--- |
| `database/migrations/phase43d-r38-migration.sql` | `c7f23c9d74e5067be6ec45506b54437f51fabc89c04884aa8deec82a3f905339` | 20,270 | 427 |
| `database/migrations/phase43d-r38-rollback.sql` | `18f3b192fde543535093d2e106ef8b2f99e65ebce6291f1ab20754332d3f058e` | 20,374 | 434 |

---

## 3. Migration Execution on Preview Branch

### 3.1 Execution Parameters
* **Target Connection:** Direct unpooled connection to `ep-muddy-silence-aof0k3ok`
* **Executing Role:** `neondb_owner`
* **Transaction Control:** Single transactional block (`BEGIN ... COMMIT`)

### 3.2 Captured Execution Log
```text
=== GATE-1 STEP 3: EXECUTING MIGRATION ON PREVIEW BRANCH ===
Target Branch: preview-gate1-test
Compute Endpoint: ep-muddy-silence-aof0k3ok
[NOTICE] PREFLIGHT: All assertions passed.
[NOTICE] Transferred ownership of 120 public tables
[NOTICE] POSTFLIGHT: All assertions passed. Migration complete.
MIGRATION TRANSACTION COMMITTED SUCCESSFULLY.
Duration: 3,124 ms
Exit Status: SUCCESS
```

### 3.3 Post-Migration Catalog Assertions Verified
* **Database Owner:** `neondb_owner` (unchanged).
* **Role Attributes:**
  * `skillverse_migrator`: `NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS, NOLOGIN` (LOGIN bound post-commit).
  * `skillverse_app`: `NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS, NOLOGIN` (LOGIN bound post-commit).
* **Role Membership:** `neondb_owner` granted `skillverse_migrator` with `INHERIT TRUE, SET TRUE`.
* **Database Privileges:**
  * `skillverse_migrator`: `CONNECT`, `CREATE` on database `neondb`.
  * `skillverse_app`: `CONNECT` on database `neondb` (no `CREATE`).
* **Schema Ownership & Privileges:**
  * Schema `public`: owner `pg_database_owner`. `skillverse_migrator` has `USAGE, CREATE`. `skillverse_app` has `USAGE` only.
  * Schema `drizzle`: owner `skillverse_migrator`. `skillverse_app` has zero privileges.
* **Table & Type Ownership:**
  * 120 public tables transferred to `skillverse_migrator`.
  * 0 public tables owned by `neondb_owner`.
  * 3 custom enums (`app_status`, `job_type`, `user_role`) transferred to `skillverse_migrator`.
  * Drizzle ledger table `drizzle.__drizzle_migrations` and sequence `drizzle.__drizzle_migrations_id_seq` transferred to `skillverse_migrator`.
* **Default Privileges:**
  * 3 default privilege entries recorded for `skillverse_migrator` (Tables, Sequences, Types -> `skillverse_app`).
  * 2 default privilege entries recorded for `neondb_owner` (Tables, Sequences -> `skillverse_app`).

---

## 4. Application & Migrator Authorization Test Matrix

Credentials were cryptographically generated and bound to preview roles via `ALTER ROLE ... WITH PASSWORD` and `LOGIN` activated.

### 4.1 Positive Application DML Operations (`skillverse_app`)
Executed against synthetic test record (`crypto.randomUUID()`) in `public.users`:

| Operation | Target Object | Result | Details |
| :--- | :--- | :--- | :--- |
| `INSERT` | `public.users` | **PASS** | Inserted synthetic developer record |
| `SELECT` | `public.users` | **PASS** | Successfully retrieved inserted record |
| `UPDATE` | `public.users` | **PASS** | Successfully updated user role & timestamp |
| `DELETE` | `public.users` | **PASS** | Cleanly removed synthetic record |

### 4.2 Negative Application DDL & Boundary Operations (`skillverse_app`)
All negative operations were asserted to abort with PostgreSQL error code `42501`:

| Attempted Operation | Target Object | Result | Error Message Captured |
| :--- | :--- | :--- | :--- |
| `CREATE TABLE` | `public._illegal` | **PASS (BLOCKED)** | `42501: permission denied for schema public` |
| `DROP TABLE` | `public.users` | **PASS (BLOCKED)** | `42501: must be owner of table users` |
| `ALTER TABLE` | `public.users ADD COLUMN bad int` | **PASS (BLOCKED)** | `42501: must be owner of table users` |
| `TRUNCATE` | `public.users` | **PASS (BLOCKED)** | `42501: permission denied for table users` |
| `USAGE` | `schema drizzle` | **PASS (BLOCKED)** | `42501: permission denied for schema drizzle` |
| `CREATE TABLE` | `drizzle._illegal` | **PASS (BLOCKED)** | `42501: permission denied for schema drizzle` |

### 4.3 Connection Pooling Verification
* Authenticated as `skillverse_app` through the PgBouncer pooled endpoint (`ep-muddy-silence-aof0k3ok-pooler.c-2.ap-southeast-1.aws.neon.tech`).
* Executed sample query against `public.users`: **PASS** (read 5 existing rows successfully).

---

## 5. Synthetic Drizzle Kit Migration & Ledger Proof

### 5.1 Test Execution
* Synthesized test migration file: `drizzle/0001_gate1_probe_1783787100000.sql`
  * Action: `CREATE TABLE public._gate1_probe_table (id uuid PRIMARY KEY, label text);`
  * Action: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS _gate1_probe_col text;`
* Updated `drizzle/meta/_journal.json` with entry index 1.
* Executed `npx drizzle-kit migrate` in child process with environment configured for `skillverse_migrator`.

### 5.2 Captured Output
```text
=== GATE-1 STEP 5: SYNTHETIC DRIZZLE KIT MIGRATION TEST ===
Creating probe migration: 0001_gate1_probe_1783787100000
Running drizzle-kit migrate as skillverse_migrator...
No config path provided, using default 'drizzle.config.ts'
Reading config file 'd:\ANTIGRAVITY PROJECT\Sillverse\drizzle.config.ts'
Using 'postgres' driver for database querying
[NOTICE 42P06] schema "drizzle" already exists, skipping
[NOTICE 42P07] relation "__drizzle_migrations" already exists, skipping
[✓] migrations applied successfully!
Migration ledger rows: Result(2) [
  { id: 1, hash: 'd91ae0e7f6a5...', created_at: '1783787094708' },
  { id: 2, hash: '42f808711349...', created_at: '1783787100000' }
]
Probe table owner: { tablename: '_gate1_probe_table', tableowner: 'skillverse_migrator' }
Testing skillverse_app access to newly created table via default privileges...
skillverse_app read from probe table: { id: '5afafcde-bb34...', label: 'Default Privileges Active' }
DEFAULT PRIVILEGES VERIFICATION: PASS
Cleaning up synthetic probe objects...
Probe files cleaned up and journal restored.
```

### 5.3 Critical Drizzle Kit Architectural Finding
Drizzle Kit unconditionally issues `CREATE SCHEMA IF NOT EXISTS "drizzle";` at the start of every migration run. Under PostgreSQL permissions semantics, `CREATE SCHEMA` enforces database `CREATE` privilege checks on the caller *prior* to checking whether the schema exists.
* **Finding:** When `REVOKE CREATE ON DATABASE neondb FROM skillverse_migrator` was executed, `drizzle-kit migrate` failed with `PostgresError: permission denied for database neondb`.
* **Resolution:** `skillverse_migrator` must permanently retain `CREATE ON DATABASE neondb`. The migration and rollback artifacts were updated accordingly.

---

## 6. Rollback Execution & Exact Catalog Parity Audit

### 6.1 Rollback Execution Parameters
* Executed via `database/migrations/phase43d-r38-rollback.sql` as `neondb_owner`.
* Captured execution output:
```text
=== GATE-1 STEP 6: EXECUTING ROLLBACK ON PREVIEW BRANCH ===
[NOTICE] ROLLBACK PREFLIGHT: All assertions passed. Safe to begin ownership reclaim.
[NOTICE] ROLLBACK: Reclaimed 120 public tables to neondb_owner
[NOTICE] ROLLBACK: No lingering objects or dependencies found. Safe to drop roles.
[NOTICE] ROLLBACK POSTFLIGHT: All assertions passed. Database restored to pre-migration state.
ROLLBACK TRANSACTION COMMITTED SUCCESSFULLY.
```

### 6.2 Pre-Migration Baseline vs. Post-Rollback Manifest Comparison
Comparison performed by querying system catalogs for exact object names, owners, definitions, and ACL arrays:

| # | Catalog Dimension Inspected | Baseline State | Post-Rollback State | Diff Result |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Database ACL (`pg_database`)** | `neondb_owner=CTc/neondb_owner` | `neondb_owner=CTc/neondb_owner` | **EXACT MATCH (ZERO DIFF)** |
| 2 | **Schema ACLs (`pg_namespace`)** | `drizzle`: null<br>`neon_auth`: null<br>`public`: `[pg_database_owner=UC/pg_database_owner, =U/pg_database_owner]` | Identical array contents | **EXACT MATCH (ZERO DIFF)** |
| 3 | **Roles (`pg_roles`)** | `neondb_owner` exists.<br>0 migration roles. | `neondb_owner` exists.<br>0 migration roles. | **EXACT MATCH (ZERO DIFF)** |
| 4 | **Role Memberships (`pg_auth_members`)** | 0 application/migrator memberships | 0 application/migrator memberships | **EXACT MATCH (ZERO DIFF)** |
| 5 | **Default Privileges (`pg_default_acl`)** | 0 entries | 0 entries | **EXACT MATCH (ZERO DIFF)** |
| 6 | **Public Tables (`pg_tables`)** | 120 tables, all owned by `neondb_owner` | 120 tables, all owned by `neondb_owner` | **EXACT MATCH (ZERO DIFF)** |
| 7 | **Custom Enums (`pg_type`)** | 3 enums (`app_status`, `job_type`, `user_role`) owned by `neondb_owner` | 3 enums, identical labels, all owned by `neondb_owner` | **EXACT MATCH (ZERO DIFF)** |
| 8 | **Drizzle Tables** | 1 table (`__drizzle_migrations`) owned by `neondb_owner` | 1 table (`__drizzle_migrations`) owned by `neondb_owner` | **EXACT MATCH (ZERO DIFF)** |
| 9 | **Drizzle Sequences** | 1 sequence (`__drizzle_migrations_id_seq`) owned by `neondb_owner` | 1 sequence (`__drizzle_migrations_id_seq`) owned by `neondb_owner` | **EXACT MATCH (ZERO DIFF)** |
| 10 | **Drizzle Schema & ACL** | Schema `drizzle` owned by `neondb_owner`, `nspacl = NULL` | Schema `drizzle` owned by `neondb_owner`, `nspacl = NULL` | **EXACT MATCH (ZERO DIFF)** |
| 11 | **Relations & Indexes (296 objects)** | 121 tables, 174 indexes, 1 sequence; all owned by `neondb_owner` | 121 tables, 174 indexes, 1 sequence; all owned by `neondb_owner` | **EXACT MATCH (ZERO DIFF)** |
| 12 | **Sequence Metadata (`pg_sequences`)** | `__drizzle_migrations_id_seq` definition identical | `__drizzle_migrations_id_seq` definition identical | **EXACT MATCH (ZERO DIFF)** |
| 13 | **Drizzle Migration Ledger** | Exactly 1 record (initial migration `0000_init`) | Exactly 1 record (initial migration `0000_init`) | **EXACT MATCH (ZERO DIFF)** |

**Overall Parity Classification:** `IDENTICAL TO BASELINE (100% PARITY)`.

---

## 7. Residual Risks, Gotchas & Recommendations

1. **Drizzle Kit Database `CREATE` Privilege Requirement:**
   * Drizzle Kit requires `CREATE ON DATABASE neondb` for `skillverse_migrator` due to its unconditional `CREATE SCHEMA IF NOT EXISTS "drizzle"` statement.
   * `skillverse_app` must NEVER be granted database `CREATE` privilege.
2. **PostgreSQL Schema ACL Null Preservation:**
   * In PostgreSQL, schema owners inherently possess `USAGE` and `CREATE` on schemas they own.
   * Granting explicit privileges to a role before transferring schema ownership to that role permanently populates `pg_namespace.nspacl`, preventing a clean return to `NULL` upon rollback.
   * The migration script preserves clean catalog state by relying on ownership rather than redundant grants.
3. **Neon `cloud_admin` Role Creator Admin-Option:**
   * When `neondb_owner` creates roles in Neon, Neon's control plane automatically records an entry in `pg_auth_members` granting `ADMIN OPTION` to `neondb_owner` with `grantor = 'cloud_admin'`.
   * Rollback dependency checks must specifically inspect `grantor = 'neondb_owner'::regrole` to avoid false-positive aborts.
4. **Connection Pooling Limitation:**
   * Neon pooled endpoints route through PgBouncer in transaction pooling mode. `SET ROLE` is not preserved across transactions. The application must connect directly using credentials for `skillverse_app` in `DATABASE_URL`.

---

## 8. Final Gate-1 Verdict

### **`GATE-1 PASSED — DBA REVIEW REQUIRED`**

**Production Cutover Status:** **`STRICT NO-GO`**  
Execution against the production database is strictly prohibited. The empirical evidence captured in this audit is submitted for formal human DBA review. Production execution requires an approved maintenance window, coordinated application traffic draining, and explicit operator authorization.
