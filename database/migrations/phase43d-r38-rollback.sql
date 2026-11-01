-- =============================================================================
-- SkillVerse Phase 43D-R3.8: Symmetrical Rollback Script
-- Reverses phase43d-r38-migration.sql
--
-- Target: PostgreSQL 18.x on Neon Serverless
-- Database: neondb
-- Execution role: neondb_owner (direct unpooled connection)
-- Mode: Single transaction — all-or-nothing via \set ON_ERROR_STOP on
--
-- SAFETY:
--   This file is an AUDIT ARTIFACT. Do not execute against production
--   unless the migration was previously applied and a rollback is required.
--
-- PREREQUISITES:
--   * Connected as neondb_owner via DATABASE_URL_UNPOOLED (not pooled).
--   * The migration was previously applied (roles exist, tables are owned
--     by skillverse_migrator).
--   * Application connection strings have been reverted to neondb_owner
--     BEFORE executing this rollback so that no active sessions hold locks
--     as skillverse_app or skillverse_migrator.
--
-- PARTIAL FAILURE:
--   The entire script runs inside a single BEGIN..COMMIT block.
--   Any RAISE EXCEPTION aborts the transaction and no changes persist.
--   \set ON_ERROR_STOP on causes psql to abort on any SQL error.
--
-- LOCKS:
--   ALTER TABLE ... OWNER TO acquires AccessExclusiveLock on each table.
--   All application traffic must be drained before executing this rollback.
--
-- CREDENTIAL NOTE:
--   After rollback, the application should reconnect as neondb_owner.
--   The migration roles are dropped at the end of this script.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- =========================================================================
-- SECTION 1: ROLLBACK PREFLIGHT ASSERTIONS
-- =========================================================================
-- Asserts baseline post-migration state and compares the exact 120-table
-- manifest BEFORE any ownership changes or table-transfer locks are taken.

DO $$
DECLARE
    v_db_owner             text;
    v_drizzle_owner        text;
    v_drizzle_tables       int;
    v_drizzle_seqs         int;
    v_enum_count           int;

    -- Exact manifest of 120 public tables (alphabetical).
    -- Before modifying any ownership or acquiring transfer locks, rollback
    -- asserts that exactly these 120 tables are owned by skillverse_migrator.
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

    v_actual_tables        text[];
    v_missing_tables       text[];
    v_extra_tables         text[];
    v_wrong_owner_tables   text[];
BEGIN
    -- 1.1 Assert identity and database
    IF current_user != 'neondb_owner' THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Must execute as neondb_owner (current: %)', current_user;
    END IF;
    IF current_database() != 'neondb' THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Must execute against neondb (current: %)', current_database();
    END IF;

    -- 1.2 Assert database ownership is still intact
    SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = 'neondb';
    IF v_db_owner != 'neondb_owner' THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: neondb owned by %, expected neondb_owner', v_db_owner;
    END IF;

    -- 1.3 Assert the migration roles exist (rollback is only valid post-migration)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'skillverse_migrator') THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Role skillverse_migrator does not exist. Nothing to roll back.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'skillverse_app') THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Role skillverse_app does not exist. Nothing to roll back.';
    END IF;

    -- 1.4 Assert neondb_owner is a member of skillverse_migrator (required for OWNER TO)
    IF NOT pg_has_role('neondb_owner', 'skillverse_migrator', 'MEMBER') THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: neondb_owner is not a member of skillverse_migrator';
    END IF;

    -- 1.5 Assert exact 120-table manifest owned by skillverse_migrator
    SELECT array_agg(tablename ORDER BY tablename) INTO v_actual_tables
    FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'skillverse_migrator';

    SELECT array_agg(elem) INTO v_missing_tables
    FROM unnest(v_expected_tables) elem
    WHERE elem NOT IN (SELECT unnest(v_actual_tables));

    SELECT array_agg(tablename) INTO v_extra_tables
    FROM pg_tables WHERE schemaname = 'public'
    AND tablename NOT IN (SELECT unnest(v_expected_tables));

    SELECT array_agg(format('%s (owner: %s)', tablename, tableowner)) INTO v_wrong_owner_tables
    FROM pg_tables WHERE schemaname = 'public'
    AND tableowner != 'skillverse_migrator';

    IF v_missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Missing expected tables under skillverse_migrator: %', v_missing_tables;
    END IF;
    IF v_extra_tables IS NOT NULL THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Unexpected public tables detected before rollback: %. Manual review required.', v_extra_tables;
    END IF;
    IF v_wrong_owner_tables IS NOT NULL THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Tables in public have unexpected owner: %. Expected skillverse_migrator.', v_wrong_owner_tables;
    END IF;

    -- 1.6 Assert drizzle schema ownership
    SELECT nspowner::regrole::text INTO v_drizzle_owner
    FROM pg_namespace WHERE nspname = 'drizzle';
    IF v_drizzle_owner != 'skillverse_migrator' THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Schema drizzle owned by %, expected skillverse_migrator', v_drizzle_owner;
    END IF;

    -- 1.7 Assert drizzle ledger table and sequence owned by skillverse_migrator
    SELECT count(*) INTO v_drizzle_tables
    FROM pg_tables WHERE schemaname = 'drizzle' AND tableowner = 'skillverse_migrator';
    SELECT count(*) INTO v_drizzle_seqs
    FROM pg_sequences WHERE schemaname = 'drizzle' AND sequenceowner = 'skillverse_migrator';
    IF v_drizzle_tables != 1 THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Expected 1 drizzle table owned by skillverse_migrator, found %', v_drizzle_tables;
    END IF;
    IF v_drizzle_seqs != 1 THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Expected 1 drizzle sequence owned by skillverse_migrator, found %', v_drizzle_seqs;
    END IF;

    -- 1.8 Assert custom enums owned by skillverse_migrator
    SELECT count(*) INTO v_enum_count
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typowner = 'skillverse_migrator'::regrole;
    IF v_enum_count != 3 THEN
        RAISE EXCEPTION 'ROLLBACK PREFLIGHT: Expected 3 public enums owned by skillverse_migrator, found %', v_enum_count;
    END IF;

    RAISE NOTICE 'ROLLBACK PREFLIGHT: All assertions passed. Safe to begin ownership reclaim.';
END $$;


-- =========================================================================
-- SECTION 2: RECLAIM RELATIONAL OWNERSHIP
-- =========================================================================

-- 2.1 Reclaim all 120 public tables to neondb_owner
DO $$
DECLARE
    r RECORD;
    v_count int := 0;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public' AND tableowner = 'skillverse_migrator'
        ORDER BY tablename
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO neondb_owner', r.tablename);
        v_count := v_count + 1;
    END LOOP;
    RAISE NOTICE 'ROLLBACK: Reclaimed % public tables to neondb_owner', v_count;
END $$;

-- 2.2 Reclaim custom enums
ALTER TYPE public.app_status OWNER TO neondb_owner;
ALTER TYPE public.job_type OWNER TO neondb_owner;
ALTER TYPE public.user_role OWNER TO neondb_owner;

-- 2.3 Reclaim drizzle schema and its objects
ALTER TABLE drizzle.__drizzle_migrations OWNER TO neondb_owner;
ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO neondb_owner;
ALTER SCHEMA drizzle OWNER TO neondb_owner;


-- =========================================================================
-- SECTION 3: REVOKE DEFAULT PRIVILEGES
-- =========================================================================
-- These must be revoked BEFORE revoking object-level privileges or
-- dropping the roles, because ALTER DEFAULT PRIVILEGES requires the
-- target role to exist.

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
    REVOKE ALL ON TABLES FROM skillverse_app;
ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
    REVOKE ALL ON SEQUENCES FROM skillverse_app;
ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
    REVOKE ALL ON TYPES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    REVOKE ALL ON TABLES FROM skillverse_app;
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    REVOKE ALL ON SEQUENCES FROM skillverse_app;


-- =========================================================================
-- SECTION 4: REVOKE OBJECT-LEVEL PRIVILEGES
-- =========================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM skillverse_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM skillverse_app;
REVOKE ALL ON TYPE public.app_status, public.job_type, public.user_role FROM skillverse_app;


-- =========================================================================
-- SECTION 5: REVOKE SCHEMA & DATABASE PRIVILEGES
-- =========================================================================

REVOKE ALL ON SCHEMA public FROM skillverse_migrator;
REVOKE ALL ON SCHEMA public FROM skillverse_app;

-- Restore PUBLIC USAGE on schema public (preserves baseline =U/pg_database_owner)
-- This is a no-op if PUBLIC already has USAGE, but ensures correctness.
GRANT USAGE ON SCHEMA public TO PUBLIC;

REVOKE CONNECT ON DATABASE neondb FROM skillverse_migrator;
REVOKE CONNECT ON DATABASE neondb FROM skillverse_app;
-- Also revoke CREATE in case it was not revoked during migration
REVOKE CREATE ON DATABASE neondb FROM skillverse_migrator;


-- =========================================================================
-- SECTION 6: REVOKE ROLE MEMBERSHIP
-- =========================================================================

REVOKE skillverse_migrator FROM neondb_owner;


-- =========================================================================
-- SECTION 7: EXHAUSTIVE ROLE DEPENDENCY & LINGERING OBJECT GUARD
-- =========================================================================
-- PostgreSQL's DROP ROLE enforces checks across all catalogs via pg_shdepend.
-- Rather than checking only pg_class, this guard inspects pg_shdepend across
-- all object types (tables, types, schemas, functions, procedures, databases),
-- plus pg_default_acl and pg_auth_members.
--
-- If any role still owns objects or holds grants, we MUST NOT attempt DROP ROLE.
-- DROP OWNED is deliberately avoided to prevent accidental destruction of data.
-- Instead, the guard aborts with RAISE EXCEPTION detailing the exact blockers.

DO $$
DECLARE
    v_target_roles text[] := ARRAY['skillverse_migrator', 'skillverse_app'];
    v_role         text;
    v_role_oid     oid;
    v_owned_count          int;
    v_acl_count            int;
    v_defacl_count         int;
    v_member_of_count      int;
    v_grantor_members_count int;
    v_breakdown            text;
BEGIN
    FOREACH v_role IN ARRAY v_target_roles LOOP
        SELECT oid INTO v_role_oid FROM pg_roles WHERE rolname = v_role;
        IF v_role_oid IS NOT NULL THEN
            -- 7.1 Check owned objects across all catalogs via pg_shdepend
            SELECT count(*) INTO v_owned_count
            FROM pg_shdepend WHERE refobjid = v_role_oid AND deptype = 'o';

            -- 7.2 Check lingering ACL grants via pg_shdepend
            SELECT count(*) INTO v_acl_count
            FROM pg_shdepend WHERE refobjid = v_role_oid AND deptype = 'a';

            -- 7.3 Check lingering default ACLs
            SELECT count(*) INTO v_defacl_count
            FROM pg_default_acl WHERE defaclrole = v_role_oid;

            -- 7.4 Check lingering role memberships
            -- The role must not be a member of any other role
            SELECT count(*) INTO v_member_of_count
            FROM pg_auth_members WHERE member = v_role_oid;

            -- The role must not have any members explicitly granted by neondb_owner
            SELECT count(*) INTO v_grantor_members_count
            FROM pg_auth_members WHERE roleid = v_role_oid AND grantor = 'neondb_owner'::regrole;

            IF v_owned_count > 0 OR v_acl_count > 0 OR v_defacl_count > 0 OR v_member_of_count > 0 OR v_grantor_members_count > 0 THEN
                SELECT string_agg(format('%s: %s', classid::regclass::text, cnt), ', ')
                INTO v_breakdown
                FROM (
                    SELECT classid, count(*) as cnt
                    FROM pg_shdepend
                    WHERE refobjid = v_role_oid AND deptype = 'o'
                    GROUP BY classid
                ) sub;

                RAISE EXCEPTION 'ROLLBACK ABORT: Role % has lingering dependencies: % owned object(s) [%], % ACL grant(s), % default ACL(s), % external membership(s), % lingering granted member(s). Manual review required.',
                    v_role, v_owned_count, COALESCE(v_breakdown, 'none'), v_acl_count, v_defacl_count, v_member_of_count, v_grantor_members_count;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'ROLLBACK: No lingering objects or dependencies found. Safe to drop roles.';
END $$;


-- =========================================================================
-- SECTION 8: DROP ROLES
-- =========================================================================

DROP ROLE skillverse_app;
DROP ROLE skillverse_migrator;


-- =========================================================================
-- SECTION 9: ROLLBACK POSTFLIGHT ASSERTIONS
-- =========================================================================

DO $$
DECLARE
    v_public_tables    int;
    v_migrator_tables  int;
    v_drizzle_owner    text;
    v_drizzle_tables   int;
    v_drizzle_seqs     int;
    v_owner_enums      int;
    v_migrator_enums   int;
    v_neondb_defacls   int;
    v_roles_remaining  int;
    v_db_acl           text[];
    v_public_acl       text[];
BEGIN
    -- 9.1 Assert all 120 public tables are owned by neondb_owner
    SELECT count(*) INTO v_public_tables
    FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'neondb_owner';
    IF v_public_tables != 120 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Expected 120 public tables owned by neondb_owner, found %', v_public_tables;
    END IF;

    -- 9.2 Assert zero public tables remain owned by skillverse_migrator
    SELECT count(*) INTO v_migrator_tables
    FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'skillverse_migrator';
    IF v_migrator_tables != 0 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: % public tables still owned by skillverse_migrator', v_migrator_tables;
    END IF;

    -- 9.3 Assert schema drizzle and its objects owned by neondb_owner
    SELECT nspowner::regrole::text INTO v_drizzle_owner
    FROM pg_namespace WHERE nspname = 'drizzle';
    IF v_drizzle_owner != 'neondb_owner' THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Schema drizzle owned by %, expected neondb_owner', v_drizzle_owner;
    END IF;

    SELECT count(*) INTO v_drizzle_tables
    FROM pg_tables WHERE schemaname = 'drizzle' AND tableowner = 'neondb_owner';
    IF v_drizzle_tables != 1 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Expected 1 drizzle table owned by neondb_owner, found %', v_drizzle_tables;
    END IF;

    SELECT count(*) INTO v_drizzle_seqs
    FROM pg_sequences WHERE schemaname = 'drizzle' AND sequenceowner = 'neondb_owner';
    IF v_drizzle_seqs != 1 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Expected 1 drizzle sequence owned by neondb_owner, found %', v_drizzle_seqs;
    END IF;

    -- 9.4 Assert custom enums owned by neondb_owner
    SELECT count(*) INTO v_owner_enums
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typowner = 'neondb_owner'::regrole;
    IF v_owner_enums != 3 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Expected 3 public enums owned by neondb_owner, found %', v_owner_enums;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typtype = 'e' AND t.typowner != 'neondb_owner'::regrole
    ) THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Public enum found with owner other than neondb_owner';
    END IF;

    -- 9.5 Assert zero default ACL entries for neondb_owner
    SELECT count(*) INTO v_neondb_defacls
    FROM pg_default_acl WHERE defaclrole = 'neondb_owner'::regrole;
    IF v_neondb_defacls != 0 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: % default ACL entries remain for neondb_owner', v_neondb_defacls;
    END IF;

    -- 9.6 Assert neither role exists
    SELECT count(*) INTO v_roles_remaining
    FROM pg_roles WHERE rolname IN ('skillverse_migrator', 'skillverse_app');
    IF v_roles_remaining != 0 THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: % application roles still exist', v_roles_remaining;
    END IF;

    -- 9.7 Assert schema public ACL contains baseline PUBLIC USAGE
    SELECT nspacl INTO v_public_acl FROM pg_namespace WHERE nspname = 'public';
    IF NOT (v_public_acl @> ARRAY['=U/pg_database_owner']) THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Schema public ACL missing baseline PUBLIC USAGE';
    END IF;

    -- 9.8 Assert database ACL baseline
    SELECT datacl INTO v_db_acl FROM pg_database WHERE datname = 'neondb';
    IF NOT (v_db_acl @> ARRAY['=Tc/neondb_owner']) THEN
        RAISE EXCEPTION 'ROLLBACK POSTFLIGHT: Database neondb ACL missing baseline PUBLIC CONNECT';
    END IF;

    RAISE NOTICE 'ROLLBACK POSTFLIGHT: All assertions passed. Database restored to pre-migration state.';
END $$;

COMMIT;
