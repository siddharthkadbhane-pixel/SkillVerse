-- =============================================================================
-- SkillVerse Phase 44: Least-Privilege Database Role Provisioning
-- Target: PostgreSQL 18 / Serverless PostgreSQL on Neon (neondb)
--
-- Provisions strictly segregated roles:
-- 1. skillverse_app: Runtime application role (DML only, NO DDL, NO TRUNCATE)
-- 2. skillverse_migrator: CI/CD deployment role (Schema owner, DDL via unpooled URL)
--
-- CRITICAL SECURITY ARCHITECTURE (Phase R7B Remediation):
-- 1. NO STATIC PASSWORDS: Roles are provisioned initially with NOLOGIN.
--    No plaintext placeholder passwords exist in version control.
--    Login access and 32+ byte CSPRNG secrets MUST be bound post-migration via
--    authenticated secrets injection:
--      ALTER ROLE skillverse_app WITH LOGIN PASSWORD 'CSPRNG_APP_SECRET';
--      ALTER ROLE skillverse_migrator WITH LOGIN PASSWORD 'CSPRNG_MIGRATOR_SECRET';
-- 2. EXPLICIT ROLE ATTRIBUTES: Both roles explicitly declare NOSUPERUSER,
--    NOCREATEDB, NOCREATEROLE, and NOBYPASSRLS.
-- 3. SCOPED TABLE OWNERSHIP: Existing public tables and sequences owned by the
--    database owner are transferred to skillverse_migrator so that migration
--    DDL (ALTER TABLE, ADD COLUMN, CREATE INDEX) succeeds under least privilege.
-- 4. DYNAMIC PORTABILITY: Resolves current_database() and database owner
--    dynamically from pg_database to eliminate hardcoded Neon assumptions.
--
-- SAFETY: Execute in STAGING replica/branch first. Do not execute against production
-- without verified staging rehearsal. Production remains STRICT HOLD.
-- =============================================================================

BEGIN;

-- Step 1: Create application runtime role (least-privilege, DML-only)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'skillverse_app') THEN
    CREATE ROLE skillverse_app WITH
      NOLOGIN
      NOINHERIT
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS;
  ELSE
    -- Enforce explicit attributes if role already exists (NOSUPERUSER omitted here as PostgreSQL reserves ALTER ... SUPERUSER to superusers)
    ALTER ROLE skillverse_app WITH
      NOINHERIT
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS;
  END IF;
END $$;

-- Step 2: Create deployment migrator role (DDL migrations, schema owner)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'skillverse_migrator') THEN
    CREATE ROLE skillverse_migrator WITH
      NOLOGIN
      INHERIT
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS;
  ELSE
    -- Enforce explicit attributes if role already exists (NOSUPERUSER omitted here as PostgreSQL reserves ALTER ... SUPERUSER to superusers)
    ALTER ROLE skillverse_migrator WITH
      INHERIT
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS;
  END IF;
END $$;

-- Step 3: Grant membership in migrator role to database administrative owner
-- (Required by PostgreSQL for ALTER DEFAULT PRIVILEGES FOR ROLE and DBA management)
DO $$
DECLARE
  v_db_owner text;
BEGIN
  SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = current_database();
  IF v_db_owner IS NOT NULL THEN
    EXECUTE format('GRANT skillverse_migrator TO %I', v_db_owner);
  END IF;
END $$;

-- Step 4: Grant database connection on current database
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO skillverse_app, skillverse_migrator', current_database());
END $$;

-- Step 5: Pre-create migration metadata schema with migrator ownership
CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION skillverse_migrator;
ALTER SCHEMA drizzle OWNER TO skillverse_migrator;
GRANT ALL PRIVILEGES ON SCHEMA drizzle TO skillverse_migrator;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations OWNER TO skillverse_migrator;

-- Step 6: Schema permissions on public
GRANT USAGE ON SCHEMA public TO skillverse_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO skillverse_migrator;

-- Step 7: Scoped Table, Sequence & Custom Type Ownership Transfer to skillverse_migrator
-- Enables the migration runner to execute DDL (ALTER TABLE, ADD COLUMN, CREATE INDEX, ALTER TYPE)
-- while preserving strict role separation for skillverse_app (DML only)
DO $$
DECLARE
  r RECORD;
  v_db_owner text;
  v_table_count int := 0;
  v_seq_count int := 0;
  v_type_count int := 0;
BEGIN
  SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = current_database();

  -- Transfer existing tables owned by the database admin to skillverse_migrator
  FOR r IN (
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tableowner = v_db_owner
  ) LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO skillverse_migrator', r.tablename);
    v_table_count := v_table_count + 1;
  END LOOP;

  -- Transfer existing sequences owned by the database admin to skillverse_migrator
  FOR r IN (
    SELECT sequencename FROM pg_sequences
    WHERE schemaname = 'public' AND sequenceowner = v_db_owner
  ) LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO skillverse_migrator', r.sequencename);
    v_seq_count := v_seq_count + 1;
  END LOOP;

  -- Transfer existing custom enum types in public owned by the database admin to skillverse_migrator
  FOR r IN (
    SELECT t.typname
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype = 'e'
      AND t.typowner = v_db_owner::regrole
  ) LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO skillverse_migrator', r.typname);
    v_type_count := v_type_count + 1;
  END LOOP;

  -- Transfer existing application routines (functions, procedures, window functions) owned by the database admin to skillverse_migrator.
  -- Excludes extension-owned routines (deptype = 'e'), aggregates (prokind = 'a'), and non-public objects.
  -- Uses pg_get_function_identity_arguments to handle overloaded routines safely.
  FOR r IN (
    SELECT p.proname,
           pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proowner = v_db_owner::regrole
      AND p.prokind IN ('f', 'p', 'w')
      AND NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_depend d
        WHERE d.objid = p.oid
          AND d.classid = 'pg_proc'::regclass
          AND d.deptype = 'e'
      )
  ) LOOP
    EXECUTE format('ALTER ROUTINE public.%I(%s) OWNER TO skillverse_migrator', r.proname, r.args);
    v_type_count := v_type_count + 1; -- Counted towards transferred objects
  END LOOP;

  RAISE NOTICE 'Transferred % tables, % sequences, and % enum/routine objects to skillverse_migrator', v_table_count, v_seq_count, v_type_count;
END $$;

-- Step 8: Grant DML to runtime role across all application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO skillverse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skillverse_app;
DO $$
DECLARE
  r RECORD;
BEGIN
  -- PostgreSQL does not support GRANT USAGE ON ALL TYPES IN SCHEMA; iterate custom types
  FOR r IN (
    SELECT t.typname
    FROM pg_catalog.pg_type t
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'd')
  ) LOOP
    EXECUTE format('GRANT USAGE ON TYPE public.%I TO skillverse_app', r.typname);
  END LOOP;
END $$;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO skillverse_app;

-- Step 9: Grant administrative privileges to deployment role on schema objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillverse_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillverse_migrator;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO skillverse_migrator;

-- Step 10: Configure default privileges for future objects created by migrator or db owner
ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT USAGE ON TYPES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO skillverse_app;

DO $$
DECLARE
  v_db_owner text;
BEGIN
  SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = current_database();
  IF v_db_owner IS NOT NULL THEN
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app', v_db_owner);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app', v_db_owner);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE ON TYPES TO skillverse_app', v_db_owner);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO skillverse_app', v_db_owner);
  END IF;
END $$;

-- Step 11: Strict privilege lockdown on runtime role
-- Prevent schema modification, table dropping, and table truncation
REVOKE CREATE ON SCHEMA public FROM skillverse_app;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM skillverse_app;

COMMIT;
