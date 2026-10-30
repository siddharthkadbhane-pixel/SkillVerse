-- =============================================================================
-- SkillVerse Phase 44: Least-Privilege Database Role Provisioning
-- Target: PostgreSQL on Neon Serverless (neondb)
--
-- Provisions strictly segregated roles:
-- 1. skillverse_app: Runtime application role (DML only, NO DDL, NO TRUNCATE)
-- 2. skillverse_migrator: CI/CD deployment role (DDL migrations via unpooled URL)
--
-- SAFETY: Execute in STAGING replica first. Do not execute against production
-- without verified staging rehearsal. Replace PLACEHOLDER passwords with 32+ byte
-- cryptographically secure secrets prior to execution.
-- =============================================================================

BEGIN;

-- Step 1: Create application runtime role (least-privilege)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'skillverse_app') THEN
    CREATE ROLE skillverse_app WITH
      LOGIN
      PASSWORD 'REPLACE_WITH_STAGING_APP_SECRET_MIN_32_BYTES'
      NOINHERIT
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS;
  END IF;
END $$;

-- Step 2: Create deployment migrator role (restricted DDL for migrations)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'skillverse_migrator') THEN
    CREATE ROLE skillverse_migrator WITH
      LOGIN
      PASSWORD 'REPLACE_WITH_STAGING_MIGRATOR_SECRET_MIN_32_BYTES'
      INHERIT
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE;
  END IF;
END $$;

-- Step 3: Grant membership in migrator role to administrative user
-- (Required by PostgreSQL for ALTER DEFAULT PRIVILEGES FOR ROLE)
GRANT skillverse_migrator TO neondb_owner;

-- Step 4: Grant database connection
GRANT CONNECT ON DATABASE neondb TO skillverse_app;
GRANT CONNECT ON DATABASE neondb TO skillverse_migrator;

-- Step 5: Pre-create migration metadata schema to avoid granting broad CREATE ON DATABASE
CREATE SCHEMA IF NOT EXISTS drizzle AUTHORIZATION skillverse_migrator;
GRANT ALL PRIVILEGES ON SCHEMA drizzle TO skillverse_migrator;

-- Step 6: Schema permissions on public
GRANT USAGE ON SCHEMA public TO skillverse_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO skillverse_migrator;

-- Step 7: Grant DML to runtime role across all application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO skillverse_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO skillverse_app;
GRANT USAGE ON ALL TYPES IN SCHEMA public TO skillverse_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO skillverse_app;

-- Step 8: Grant administrative privileges to deployment role on schema objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skillverse_migrator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skillverse_migrator;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO skillverse_migrator;

-- Step 9: Configure default privileges for future objects created by neondb_owner or migrator
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT USAGE ON TYPES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT USAGE ON TYPES TO skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO skillverse_app;

-- Step 10: Strict privilege lockdown on runtime role
-- Prevent schema modification, table dropping, and table truncation
REVOKE CREATE ON SCHEMA public FROM skillverse_app;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM skillverse_app;

COMMIT;
