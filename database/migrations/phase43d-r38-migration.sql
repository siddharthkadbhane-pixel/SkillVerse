-- =============================================================================
-- SkillVerse Phase 43D-R3.8: Least-Privilege Role Migration
-- Scoped Object Ownership Transfer & Runtime Privilege Separation
--
-- Target: PostgreSQL 18.x on Neon Serverless
-- Database: neondb
-- Execution role: neondb_owner (direct unpooled connection)
-- Mode: Single transaction — all-or-nothing via \set ON_ERROR_STOP on
--
-- SAFETY:
--   This file is an AUDIT ARTIFACT. Do not execute against production
--   until the complete Gate-1 preview-branch validation has passed.
--
-- PREREQUISITES:
--   * Connected as neondb_owner via DATABASE_URL_UNPOOLED (not pooled).
--   * Neither skillverse_migrator nor skillverse_app exists in pg_roles.
--   * The exact 120-table manifest below matches the live catalog.
--
-- CREDENTIAL BINDING (post-transaction, separate step):
--   After this transaction commits the roles exist as NOLOGIN.
--   Passwords must be set interactively:
--     \password skillverse_migrator
--     \password skillverse_app
--   Then enable login:
--     ALTER ROLE skillverse_migrator LOGIN;
--     ALTER ROLE skillverse_app LOGIN;
--   Never pass passwords as CLI arguments, psql variables, or in SQL files.
--
-- LOCKS:
--   ALTER TABLE ... OWNER TO acquires AccessExclusiveLock on each table.
--   Schedule execution during a low-traffic maintenance window.
--
-- PARTIAL FAILURE:
--   The entire script runs inside a single BEGIN..COMMIT block.
--   Any RAISE EXCEPTION inside a DO block aborts the transaction.
--   \set ON_ERROR_STOP on causes psql to abort on any SQL error.
--   On abort, no catalog changes persist — the database is unchanged.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- =========================================================================
-- SECTION 1: PREFLIGHT SAFETY ASSERTIONS
-- =========================================================================
-- Every assertion uses RAISE EXCEPTION on failure, which aborts the
-- enclosing transaction. The database remains unchanged.

DO $$
DECLARE
    v_db_owner       text;
    v_drizzle_owner  text;
    v_public_acl     text[];
    v_drizzle_acl    text[];

    -- Exact manifest of 120 public tables (alphabetical).
    -- If the live catalog differs by even one name, the migration aborts.
    v_expected_tables text[] := ARRAY[
        'activity_events','activity_logs','agent_feedback','agent_logs','agent_memory',
        'agent_metrics','agent_outputs','agent_runs','ai_agents','answers',
        'api_keys','api_usage','api_usage_logs','applications','artifacts',
        'audit_logs','billing_customers','billing_events','bookmarks','builds',
        'capability_dimensions','capability_history','capability_insights','capability_levels','career_goals',
        'career_recommendations_cache','certificates','challenge_evaluations','challenge_events','challenge_judges',
        'challenge_participants','challenge_reviews','challenge_submissions','challenges','collab_team_members',
        'collab_teams','comments','community_blocks','community_follows','community_reports',
        'community_reputation','community_votes','companies','company_members','comparison_cache',
        'competitions','contribution_activities','contributions','dashboard_preferences','deployments',
        'developer_capabilities','developer_capability_cards','engineering_timeline','execution_jobs','graph_edges',
        'graph_nodes','institutions','jobs','knowledge_base','learning_roadmaps',
        'learning_tasks','likes','mentor_sessions','notes','notifications',
        'organization_members','organizations','partner_integrations','passport_exports','passport_views',
        'passports','peer_review_requests','peer_review_responses','peer_reviews','personal_access_tokens',
        'post_comments','posts','privacy_requests','privacy_settings','profile_bookmarks',
        'profile_shares','projects','questions','recently_viewed_developers','recommendations',
        'recruiter_notes','repositories','reputation_scores','resource_usage','review_history',
        'reviews','runtime_logs','saved_developers','saved_opportunities','skill_dna',
        'skill_evolution_history','skill_history','skills','subscriptions','team_activity',
        'team_invites','team_members','team_milestones','team_projects','team_tasks',
        'teams','trust_history','trust_scores','usage_counters','user_consents',
        'user_skills','users','verification_evidence','verification_requests','webhook_deliveries',
        'webhooks','workspace_members','workspace_projects','workspace_tasks','workspaces'
    ];

    v_actual_tables   text[];
    v_missing_tables  text[];
    v_extra_tables    text[];
    v_enum_count      int;
    v_drizzle_tables  int;
    v_drizzle_seqs    int;
BEGIN
    -- 1.1 Assert identity
    IF current_user != 'neondb_owner' THEN
        RAISE EXCEPTION 'PREFLIGHT: Must execute as neondb_owner (current: %)', current_user;
    END IF;
    IF current_database() != 'neondb' THEN
        RAISE EXCEPTION 'PREFLIGHT: Must execute against neondb (current: %)', current_database();
    END IF;

    -- 1.2 Assert database ownership
    SELECT datdba::regrole::text INTO v_db_owner
    FROM pg_database WHERE datname = 'neondb';
    IF v_db_owner != 'neondb_owner' THEN
        RAISE EXCEPTION 'PREFLIGHT: neondb owned by %, expected neondb_owner', v_db_owner;
    END IF;

    -- 1.3 Assert neither application role exists
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'skillverse_migrator') THEN
        RAISE EXCEPTION 'PREFLIGHT: Role skillverse_migrator already exists. Aborting.';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'skillverse_app') THEN
        RAISE EXCEPTION 'PREFLIGHT: Role skillverse_app already exists. Aborting.';
    END IF;

    -- 1.4 Assert exact table manifest
    SELECT array_agg(tablename ORDER BY tablename) INTO v_actual_tables
    FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'neondb_owner';

    SELECT array_agg(elem) INTO v_missing_tables
    FROM unnest(v_expected_tables) elem
    WHERE elem NOT IN (SELECT unnest(v_actual_tables));

    SELECT array_agg(elem) INTO v_extra_tables
    FROM unnest(v_actual_tables) elem
    WHERE elem NOT IN (SELECT unnest(v_expected_tables));

    IF v_missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT: Missing tables: %', v_missing_tables;
    END IF;
    IF v_extra_tables IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT: Unexpected tables: %', v_extra_tables;
    END IF;

    -- 1.5 Assert drizzle schema ownership
    SELECT nspowner::regrole::text INTO v_drizzle_owner
    FROM pg_namespace WHERE nspname = 'drizzle';
    IF v_drizzle_owner IS NULL OR v_drizzle_owner != 'neondb_owner' THEN
        RAISE EXCEPTION 'PREFLIGHT: Schema drizzle not owned by neondb_owner (found: %)', v_drizzle_owner;
    END IF;

    -- 1.6 Assert drizzle ledger table and sequence
    SELECT count(*) INTO v_drizzle_tables
    FROM pg_tables WHERE schemaname = 'drizzle' AND tableowner = 'neondb_owner';
    SELECT count(*) INTO v_drizzle_seqs
    FROM pg_sequences WHERE schemaname = 'drizzle' AND sequenceowner = 'neondb_owner';
    IF v_drizzle_tables != 1 THEN
        RAISE EXCEPTION 'PREFLIGHT: Expected 1 drizzle table, found %', v_drizzle_tables;
    END IF;
    IF v_drizzle_seqs != 1 THEN
        RAISE EXCEPTION 'PREFLIGHT: Expected 1 drizzle sequence, found %', v_drizzle_seqs;
    END IF;

    -- 1.7 Assert exactly 3 public enums owned by neondb_owner
    SELECT count(*) INTO v_enum_count
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typowner = 'neondb_owner'::regrole;
    IF v_enum_count != 3 THEN
        RAISE EXCEPTION 'PREFLIGHT: Expected 3 public enums, found %', v_enum_count;
    END IF;

    -- 1.8 Assert no unexpected relations in public (views, matviews, sequences, etc.)
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind NOT IN ('r','i')
    ) THEN
        RAISE EXCEPTION 'PREFLIGHT: Unexpected non-table/non-index relations found in schema public';
    END IF;

    -- 1.9 Assert schema public ACL baseline: PUBLIC has USAGE only, no CREATE
    SELECT nspacl INTO v_public_acl FROM pg_namespace WHERE nspname = 'public';
    -- Baseline: {pg_database_owner=UC/pg_database_owner,=U/pg_database_owner}
    IF NOT (v_public_acl @> ARRAY['=U/pg_database_owner']) THEN
        RAISE EXCEPTION 'PREFLIGHT: Schema public ACL does not match expected baseline';
    END IF;

    -- 1.10 Assert schema drizzle ACL baseline: null (owner-only access)
    SELECT nspacl INTO v_drizzle_acl FROM pg_namespace WHERE nspname = 'drizzle';
    IF v_drizzle_acl IS NOT NULL THEN
        RAISE EXCEPTION 'PREFLIGHT: Schema drizzle has explicit ACL entries (expected null)';
    END IF;

    -- 1.11 Assert no default privileges exist for neondb_owner
    IF EXISTS (SELECT 1 FROM pg_default_acl WHERE defaclrole = 'neondb_owner'::regrole) THEN
        RAISE EXCEPTION 'PREFLIGHT: Unexpected default ACL entries for neondb_owner';
    END IF;

    RAISE NOTICE 'PREFLIGHT: All assertions passed.';
END $$;


-- =========================================================================
-- SECTION 2: ROLE PROVISIONING
-- =========================================================================
-- Roles are created with NOLOGIN. Passwords are bound separately after
-- the transaction commits, using interactive \password or equivalent.
-- This prevents cleartext passwords from appearing in SQL text, logs,
-- or shell history.

CREATE ROLE skillverse_migrator
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOLOGIN;

CREATE ROLE skillverse_app
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOLOGIN;


-- =========================================================================
-- SECTION 3: ROLE MEMBERSHIP
-- =========================================================================
-- neondb_owner must be a member of skillverse_migrator so that ALTER ... OWNER TO
-- succeeds. INHERIT allows neondb_owner to retain full access to transferred
-- objects. SET allows neondb_owner to SET ROLE skillverse_migrator if needed.

GRANT skillverse_migrator TO neondb_owner WITH INHERIT TRUE, SET TRUE;


-- =========================================================================
-- SECTION 4: SCHEMA & DATABASE PRIVILEGES
-- =========================================================================
-- 4.1 Database CONNECT for both new roles
GRANT CONNECT ON DATABASE neondb TO skillverse_migrator, skillverse_app;

-- 4.2 Database CREATE for skillverse_migrator
--     Required by ALTER SCHEMA drizzle OWNER TO (PostgreSQL mandates that
--     the schema owner has CREATE privilege on the database) AND required
--     by Drizzle Kit (drizzle-kit migrate executes CREATE SCHEMA IF NOT EXISTS "drizzle").
GRANT CREATE ON DATABASE neondb TO skillverse_migrator;

-- 4.3 Schema public: migrator needs USAGE + CREATE for table ownership transfers.
--     App needs USAGE only — no CREATE (no DDL).
GRANT USAGE, CREATE ON SCHEMA public TO skillverse_migrator;
GRANT USAGE ON SCHEMA public TO skillverse_app;

-- 4.4 Schema drizzle: ownership is transferred to skillverse_migrator in Section 5.1.
--     PostgreSQL schema owners inherently possess USAGE and CREATE.
--     Explicit GRANT is omitted to preserve pg_namespace.nspacl as NULL.


-- =========================================================================
-- SECTION 5: SCOPED OWNERSHIP TRANSFERS
-- =========================================================================

-- 5.1 Transfer schema drizzle
ALTER SCHEMA drizzle OWNER TO skillverse_migrator;

-- 5.2 Transfer drizzle ledger objects
ALTER TABLE drizzle.__drizzle_migrations OWNER TO skillverse_migrator;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO skillverse_migrator;

-- 5.4 Transfer custom enums
ALTER TYPE public.app_status OWNER TO skillverse_migrator;
ALTER TYPE public.job_type OWNER TO skillverse_migrator;
ALTER TYPE public.user_role OWNER TO skillverse_migrator;

-- 5.5 Transfer all 120 public tables
--     ALTER TABLE ... OWNER TO automatically transfers ownership of secondary
--     indexes, constraints, and TOAST tables associated with each table.
DO $$
DECLARE
    r RECORD;
    v_count int := 0;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tableowner = 'neondb_owner'
        ORDER BY tablename
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO skillverse_migrator', r.tablename);
        v_count := v_count + 1;
    END LOOP;
    RAISE NOTICE 'Transferred ownership of % public tables', v_count;
END $$;


-- =========================================================================
-- SECTION 6: RUNTIME DATA PRIVILEGES FOR skillverse_app
-- =========================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO skillverse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skillverse_app;
GRANT USAGE ON TYPE public.app_status, public.job_type, public.user_role TO skillverse_app;


-- =========================================================================
-- SECTION 7: DEFAULT PRIVILEGES FOR FUTURE OBJECTS
-- =========================================================================
-- Tables/sequences/types created by skillverse_migrator (Drizzle migrations).
-- skillverse_migrator owns the entire application schema lifecycle, so it
-- grants TABLES (DML), SEQUENCES (USAGE/SELECT), and TYPES (USAGE) to skillverse_app.
ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app;
ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app;
ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
    GRANT USAGE ON TYPES TO skillverse_app;

-- Tables/sequences created by neondb_owner (DBA administrative maintenance).
-- Intentionally scoped to TABLES and SEQUENCES only. TYPES default privilege
-- is omitted because: (1) application custom types are authored exclusively by
-- skillverse_migrator in Drizzle; (2) in PostgreSQL, PUBLIC already possesses
-- USAGE on newly created types by default; and (3) omitting redundant entries
-- keeps pg_default_acl minimal and strictly verifiable.
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app;


-- =========================================================================
-- SECTION 8: POSTFLIGHT ASSERTIONS
-- =========================================================================
-- If any assertion fails, the transaction is aborted and the database
-- remains in its pre-migration state.

DO $$
DECLARE
    v_db_owner             text;
    v_remaining_tables     int;
    v_migrator_tables      int;
    v_drizzle_schema_owner text;
    v_migrator_enums       int;
    v_migrator_defacls     int;
    v_owner_defacls        int;
BEGIN
    -- 8.1 Database ownership is preserved
    SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = 'neondb';
    IF v_db_owner != 'neondb_owner' THEN
        RAISE EXCEPTION 'POSTFLIGHT: Database neondb ownership changed to %!', v_db_owner;
    END IF;

    -- 8.2 Database privileges verified
    IF NOT has_database_privilege('skillverse_migrator', 'neondb', 'CREATE') THEN
        RAISE EXCEPTION 'POSTFLIGHT: skillverse_migrator missing CREATE on database neondb';
    END IF;
    IF has_database_privilege('skillverse_app', 'neondb', 'CREATE') THEN
        RAISE EXCEPTION 'POSTFLIGHT: skillverse_app has unexpected CREATE on database neondb';
    END IF;

    -- 8.3 Zero public tables remain owned by neondb_owner
    SELECT count(*) INTO v_remaining_tables
    FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'neondb_owner';
    IF v_remaining_tables != 0 THEN
        RAISE EXCEPTION 'POSTFLIGHT: % tables still owned by neondb_owner', v_remaining_tables;
    END IF;

    -- 8.4 Exactly 120 public tables owned by skillverse_migrator
    SELECT count(*) INTO v_migrator_tables
    FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'skillverse_migrator';
    IF v_migrator_tables != 120 THEN
        RAISE EXCEPTION 'POSTFLIGHT: Expected 120 tables owned by skillverse_migrator, found %', v_migrator_tables;
    END IF;

    -- 8.5 Schema drizzle owned by skillverse_migrator
    SELECT nspowner::regrole::text INTO v_drizzle_schema_owner
    FROM pg_namespace WHERE nspname = 'drizzle';
    IF v_drizzle_schema_owner != 'skillverse_migrator' THEN
        RAISE EXCEPTION 'POSTFLIGHT: Schema drizzle owned by %, expected skillverse_migrator', v_drizzle_schema_owner;
    END IF;

    -- 8.6 Custom enum ownership verified (exactly 3 enums owned by skillverse_migrator)
    SELECT count(*) INTO v_migrator_enums
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typowner = 'skillverse_migrator'::regrole;
    IF v_migrator_enums != 3 THEN
        RAISE EXCEPTION 'POSTFLIGHT: Expected 3 public enums owned by skillverse_migrator, found %', v_migrator_enums;
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typowner = 'neondb_owner'::regrole
    ) THEN
        RAISE EXCEPTION 'POSTFLIGHT: Public enums still owned by neondb_owner';
    END IF;

    -- 8.7 Runtime positive permissions verified
    IF NOT has_table_privilege('skillverse_app', 'public.users', 'SELECT') THEN
        RAISE EXCEPTION 'POSTFLIGHT: skillverse_app missing SELECT on public.users';
    END IF;
    IF NOT has_table_privilege('skillverse_app', 'public.users', 'INSERT') THEN
        RAISE EXCEPTION 'POSTFLIGHT: skillverse_app missing INSERT on public.users';
    END IF;

    -- 8.8 Runtime negative permissions verified
    IF has_schema_privilege('skillverse_app', 'public', 'CREATE') THEN
        RAISE EXCEPTION 'POSTFLIGHT: skillverse_app has CREATE on schema public';
    END IF;
    IF has_schema_privilege('skillverse_app', 'drizzle', 'USAGE') THEN
        RAISE EXCEPTION 'POSTFLIGHT: skillverse_app has USAGE on schema drizzle';
    END IF;

    -- 8.9 Default privileges were created
    SELECT count(*) INTO v_migrator_defacls
    FROM pg_default_acl WHERE defaclrole = 'skillverse_migrator'::regrole;
    IF v_migrator_defacls != 3 THEN
        RAISE EXCEPTION 'POSTFLIGHT: Expected 3 default ACL entries for migrator, found %', v_migrator_defacls;
    END IF;
    SELECT count(*) INTO v_owner_defacls
    FROM pg_default_acl WHERE defaclrole = 'neondb_owner'::regrole;
    IF v_owner_defacls != 2 THEN
        RAISE EXCEPTION 'POSTFLIGHT: Expected 2 default ACL entries for neondb_owner, found %', v_owner_defacls;
    END IF;

    RAISE NOTICE 'POSTFLIGHT: All assertions passed. Migration complete.';
END $$;

COMMIT;

-- =============================================================================
-- POST-TRANSACTION: CREDENTIAL BINDING (manual, interactive)
-- =============================================================================
-- Execute these steps AFTER the transaction above has committed successfully.
-- They are intentionally outside the transaction because \password is a
-- psql meta-command that cannot run inside a SQL transaction block.
--
--   \password skillverse_migrator
--   \password skillverse_app
--   ALTER ROLE skillverse_migrator LOGIN;
--   ALTER ROLE skillverse_app LOGIN;
--
-- Alternative automated approach (SCRAM verifier via stdin):
--   printf "ALTER ROLE skillverse_migrator WITH PASSWORD 'SCRAM-SHA-256\$...';\n" | psql ...
--   ALTER ROLE skillverse_migrator LOGIN;
-- =============================================================================
