# Phase 43D-R3.12 Static Audit Report & Pair Re-Audit

**Audit Date:** 2026-10-25  
**Auditor Role:** Adversarial PostgreSQL 18 / Neon Serverless DBA  
**Database:** `neondb` on PostgreSQL 18.6 (Debian 18.6-1.pgdg120+1), Neon Serverless  
**Base Commit:** `ec9c59b` on `fix/phase-43d-high-severity-remediation`  
**Overall Verdict:** **READY FOR PREVIEW AUTHORIZATION**  
**Production Status:** **STRICTLY PROHIBITED** (Untested against preview branch; Gate-1 execution required).

---

## 1. Artifact Verification & Checksum Manifest

All SQL artifacts and audit documentation were verified, inspected, and cross-referenced against the active live catalog baseline.

### 1.1 Checksum & Size Comparison (R3.11 Baseline vs. R3.12 Remediated)

| Artifact | File Path | R3.11 SHA-256 (Before) | R3.12 SHA-256 (After) | Lines | Bytes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Migration SQL** | `database/migrations/phase43d-r38-migration.sql` | `0C3E74A3F9E6D4AD01D7F872975DF636B1DAEDAF25AE301EBB6980D2FE3B7245` | `D27DB3826DFE7D3F221CA502870F39A49935B711A51DE40454775AC030863DD0` | 427 | 20,135 |
| **Rollback SQL** | `database/migrations/phase43d-r38-rollback.sql` | `B77B49A249A9323339620CF9341ECFD7742BFD869E3C64865B9EBBF8EF5B24C3` | `822F69DF5C7A6932D0EB23C47AEA453F0F8BB9204197A69ACA7D8EF6343815B2` | 429 | 20,025 |
| **Static Audit** | `docs/phase43d-r310-static-audit.md` | `A6838040809F09257465792290F71FD0FFE581634C91BB22C0597CDEEC9456F3` | (Updated in this document) | — | — |

Git working tree inspection confirmed zero unrelated tracked files were modified (`tsconfig.tsbuildinfo` diff reflects local compilation cache).

---

## 2. Remediated Findings Register (R3.11 → R3.12)

| Finding ID | Severity | Description | Resolution in R3.12 |
| :--- | :--- | :--- | :--- |
| **R311-P1-01** | **P1 (CRITICAL)** | Rollback Section 7 lingering object check queried only `pg_class`, missing custom enums (`pg_type`), schemas (`pg_namespace`), and functions (`pg_proc`). | Completely rewrote Section 7 ([rollback L268-322](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L268-L322)) to inspect `pg_shdepend` across all catalogs (`deptype = 'o'` for owned objects, `deptype = 'a'` for ACL grants), plus `pg_default_acl` and `pg_auth_members`. Fails closed with catalog breakdown. |
| **R311-P1-02** | **P1 (CRITICAL)** | Rollback Section 1 lacked a preflight table-manifest guard, allowing Section 2 to acquire transfer locks on unexpected new tables before Section 9 postflight aborted. | Added Section 1.5–1.8 ([rollback L116-169](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L116-L169)) containing the exact 120-table manifest array. Asserts all 120 tables, Drizzle ledger, sequence, and 3 custom enums are owned by `skillverse_migrator`, aborting on missing, extra, or wrong-owner objects before taking DDL locks. |
| **R311-P2-01** | **P2 (MEDIUM)** | Migration Section 8 lacked explicit postflight verification for the ownership of custom public enums. | Added Section 8.6 in [migration L362-376](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L362-L376) verifying that exactly 3 public enums (`app_status`, `job_type`, `user_role`) are owned by `skillverse_migrator` and 0 are owned by `neondb_owner`. |
| **R311-P2-02** | **P2 (LOW)** | Default privileges for `neondb_owner` omitted `TYPES`, creating potential question of symmetry with `skillverse_migrator`. | Reviewed and documented in [migration L300-307](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L300-L307). Omission is deliberate: `skillverse_migrator` authors all schema objects; `neondb_owner` is an admin fallback; `PUBLIC` already has `USAGE` on new types by default; omitting redundant entries prevents `pg_default_acl` bloat. Rollback cleanly restores baseline (0 default ACLs). |
| **R311-P2-03** | **P2 (LOW)** | Audit report change matrix had line references drifted by ~30–40 lines due to preflight expansion. | Resynchronized every source reference in Section 4 to exact 1-to-1 line numbers verified by AST/source search. |

---

## 3. Verified Pre-Migration Baseline (Live Catalog)

All baseline values captured via read-only queries against live Neon `neondb` on PostgreSQL 18.6:

* **Database `neondb`**: Owner `neondb_owner`. ACL: `=Tc/neondb_owner`, `neondb_owner=CTc/neondb_owner`, `neon_superuser=CTc/neondb_owner`.
* **Schema `public`**: Owner `pg_database_owner`. ACL: `pg_database_owner=UC/pg_database_owner`, `=U/pg_database_owner`.
* **Schema `drizzle`**: Owner `neondb_owner`. ACL: `null` (owner-only access).
* **Relations in `public`**: Exactly 120 tables (`relkind = 'r'`), 173 secondary indexes (`relkind = 'i'`). Zero sequences, views, or foreign tables.
* **Relations in `drizzle`**: Exactly 1 table (`__drizzle_migrations`), 1 index, 1 sequence (`__drizzle_migrations_id_seq`), all owned by `neondb_owner`.
* **Custom Enums in `public`**: Exactly 3 (`app_status`, `job_type`, `user_role`), all owned by `neondb_owner`.
* **Application Roles**: Neither `skillverse_migrator` nor `skillverse_app` exists in `pg_roles`.
* **Default Privileges**: Zero entries exist in `pg_default_acl` for `neondb_owner`.

---

## 4. Exact Migration-to-Rollback Operation Matrix

Every migration operation has a deterministic, symmetrical rollback step. Both scripts execute inside single transactions (`BEGIN ... COMMIT`) with `\set ON_ERROR_STOP on`.

| # | Migration Operation | File / Exact Line | Symmetrical Rollback Operation | File / Exact Line | Invariant Restored |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | Assert pre-migration baseline (120 tables, enums, ACLs) | [migration L50-191](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L50-L191) | Assert post-migration baseline (120 tables under migrator) | [rollback L44-171](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L44-L171) | Fails closed before DDL execution |
| 2 | `CREATE ROLE skillverse_migrator NOLOGIN` | [migration L202-203](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L202-L203) | `DROP ROLE skillverse_migrator` | [rollback L328](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L328) | Preceded by `pg_shdepend` dependency check |
| 3 | `CREATE ROLE skillverse_app NOLOGIN` | [migration L205-206](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L205-L206) | `DROP ROLE skillverse_app` | [rollback L327](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L327) | Preceded by `pg_shdepend` dependency check |
| 4 | `GRANT skillverse_migrator TO neondb_owner WITH INHERIT, SET` | [migration L216](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L216) | `REVOKE skillverse_migrator FROM neondb_owner` | [rollback L258](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L258) | Membership removed from `pg_auth_members` |
| 5 | `GRANT CONNECT ON DATABASE neondb TO both` | [migration L223](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L223) | `REVOKE CONNECT ON DATABASE neondb FROM both` | [rollback L248-249](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L248-L249) | Database ACL restored |
| 6 | Temporary `GRANT CREATE ON DATABASE neondb TO migrator` | [migration L229](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L229) | Revoked at migration L249 + defensive `REVOKE CREATE` | [rollback L251](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L251) | Temporary privilege lifecycle closed |
| 7 | `GRANT USAGE, CREATE ON SCHEMA public TO migrator` | [migration L233](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L233) | `REVOKE ALL ON SCHEMA public FROM migrator` | [rollback L241](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L241) | Schema ACL entry removed |
| 8 | `GRANT USAGE ON SCHEMA public TO app` | [migration L234](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L234) | `REVOKE ALL ON SCHEMA public FROM app` | [rollback L242](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L242) | Schema ACL entry removed |
| 9 | `GRANT USAGE, CREATE ON SCHEMA drizzle TO migrator` | [migration L238](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L238) | `REVOKE ALL ON SCHEMA drizzle FROM migrator` | [rollback L240](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L240) | Drizzle schema ACL entry removed |
| 10 | `ALTER SCHEMA drizzle OWNER TO skillverse_migrator` | [migration L246](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L246) | `ALTER SCHEMA drizzle OWNER TO neondb_owner` | [rollback L204](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L204) | Schema owner restored to `neondb_owner` |
| 11 | `REVOKE CREATE ON DATABASE neondb FROM migrator` | [migration L249](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L249) | (Already revoked in migration) | [rollback L251](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L251) | Idempotent defensive revoke |
| 12 | `ALTER TABLE drizzle.__drizzle_migrations OWNER TO migrator` | [migration L252](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L252) | `ALTER TABLE ... OWNER TO neondb_owner` | [rollback L202](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L202) | Table owner restored |
| 13 | `ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO migrator` | [migration L253](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L253) | `ALTER SEQUENCE ... OWNER TO neondb_owner` | [rollback L203](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L203) | Sequence owner restored |
| 14 | `ALTER TYPE public.{3 enums} OWNER TO migrator` | [migration L256-258](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L256-L258) | `ALTER TYPE ... OWNER TO neondb_owner` | [rollback L197-199](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L197-L199) | Enum types restored to `neondb_owner` |
| 15 | 120× `ALTER TABLE public.<name> OWNER TO migrator` | [migration L268-276](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L268-L276) | 120× `ALTER TABLE ... OWNER TO neondb_owner` | [rollback L178-192](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L178-L192) | All 120 tables restored to `neondb_owner` |
| 16 | `GRANT DML ON ALL TABLES IN public TO app` | [migration L284](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L284) | `REVOKE ALL ON ALL TABLES FROM app` | [rollback L231](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L231) | Table privileges cleared |
| 17 | `GRANT USAGE, SELECT ON ALL SEQUENCES IN public TO app` | [migration L285](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L285) | `REVOKE ALL ON ALL SEQUENCES FROM app` | [rollback L232](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L232) | Sequence privileges cleared |
| 18 | `GRANT USAGE ON TYPE public.{3 enums} TO app` | [migration L286](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L286) | `REVOKE ALL ON TYPE ... FROM app` | [rollback L233](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L233) | Type privileges cleared |
| 19 | `ALTER DEFAULT PRIVILEGES FOR migrator (TABLES/SEQS/TYPES)` | [migration L295-299](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L295-L299) | `ALTER DEFAULT PRIVILEGES REVOKE ALL` | [rollback L214-219](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L214-L219) | Default ACL entries dropped with role |
| 20 | `ALTER DEFAULT PRIVILEGES FOR neondb_owner (TABLES/SEQS)` | [migration L308-311](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L308-L311) | `ALTER DEFAULT PRIVILEGES REVOKE ALL` | [rollback L221-224](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L221-L224) | Default ACLs for owner restored to 0 |
| 21 | Schema public PUBLIC USAGE preservation | Implicit | `GRANT USAGE ON SCHEMA public TO PUBLIC` | [rollback L246](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L246) | Invariant `=U/pg_database_owner` preserved |
| 22 | Role dependency guard | — | Inspect `pg_shdepend`, `defacl`, `members` | [rollback L268-322](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L268-L322) | Blocks `DROP ROLE` if any dependency exists |
| 23 | Postflight validation | [migration L320-406](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql#L320-L406) | Postflight baseline equality check | [rollback L338-426](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql#L338-L426) | Asserts 120 tables, enums, ACLs match baseline |

---

## 5. Static Checks Executed & Empirical Evidence

All checks executed during R3.12 were strictly read-only and non-destructive:

1. **Manifest Parity Check:**
   - Command: `node scratch/verify-sql-pair.cjs`
   - Result: Exit Code 0. `Arrays match exactly between migration and rollback: true` (120 unique, sorted table names).
2. **Read-Only Preflight DO Block Execution:**
   - Command: `node scratch/test-preflight-block.cjs`
   - Result: Exit Code 0. `NOTICE: PREFLIGHT: All assertions passed.`
3. **Rollback Section 7 & Enum Verification Query Test:**
   - Command: `node scratch/test-sql-logic.cjs`
   - Result: Exit Code 0. `Sec7 Test: neondb_owner -> owned=127, acls=0, defacls=0, members=2, details=[pg_namespace: 1, pg_class: 122, pg_type: 3, pg_database: 1]`. Proves `pg_shdepend` catches types, namespaces, and classes.
4. **Rollback Section 1 Manifest Comparison Query Test:**
   - Command: `node scratch/test-manifest-logic.cjs`
   - Result: Exit Code 0. `NOTICE: Manifest validation passed completely!`

---

## 6. Unverified Live Database Behaviors (Gate-1 Preview Requirements)

The following behaviors remain **NOT EXECUTED** against any database and can only be evaluated during authorized Gate-1 execution on a disposable branch:

| Behavior | Risk Category | Gate-1 Preview Test |
| :--- | :--- | :--- |
| Complete migration script execution | DDL / Transactional | Execute `phase43d-r38-migration.sql` on preview branch with `ON_ERROR_STOP=1`. |
| Complete rollback script execution | DDL / Transactional | Execute `phase43d-r38-rollback.sql` on preview branch and assert exit code 0. |
| Byte-for-byte post-rollback catalog diff | Catalog Integrity | Compare `pg_class`, `pg_type`, `pg_namespace`, and `pg_shdepend` snapshots before migration and after rollback. |
| Neon role scoping (cluster-wide vs. branch-isolated) | Platform Isolation | Determine whether `CREATE ROLE` on a preview branch creates roles visible on the parent branch. |
| PgBouncer credential cache latency | Connection Routing | Test runtime authentication via pooled endpoint immediately after credential binding. |
| Drizzle Kit migration execution under `skillverse_migrator` | Application Tooling | Run synthetic probe migration via `drizzle-kit migrate` connected as `skillverse_migrator`. |

---

## 7. Gate-1 Preview Readiness Decision

### Final Verdict: **READY FOR PREVIEW AUTHORIZATION**

**Summary of Determination:**  
Static review of the remediated artifact pair ([phase43d-r38-migration.sql](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-migration.sql) and [phase43d-r38-rollback.sql](file:///d:/ANTIGRAVITY%20PROJECT/Sillverse/database/migrations/phase43d-r38-rollback.sql)) revealed no blocking defects:
- Preflight guards in both scripts enforce fail-closed validation of the live catalog baseline and the 120-table manifest before taking any DDL locks.
- Ownership transfers avoid `REASSIGN OWNED` and use deterministic, explicitly scoped loops.
- Role deletion guards in rollback Section 7 comprehensively inspect `pg_shdepend` across all object types, preventing role drop failures.
- Credential safety is maintained (roles created `NOLOGIN`; passwords set interactively via `\password` post-transaction).
- Symmetrical postflight assertions verify all invariants upon commit.

> [!CAUTION]
> **Production execution remains STRICTLY PROHIBITED.** This verdict authorizes testing exclusively on an isolated, disposable Neon preview branch. No changes may be applied to production until full Gate-1 empirical evidence is captured and reviewed.

### Next Required Action:
Awaiting authorization to provision a disposable Neon preview branch (`preview/migration-cutover-test`) and execute the Gate-1 validation suite according to Section 6 of this report.
