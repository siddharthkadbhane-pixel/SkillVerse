-- =============================================================================
-- SkillVerse Phase 44: Least-Privilege Database Role Rollback Script
-- Target: PostgreSQL on Neon Serverless (neondb)
--
-- Reverts Phase 44 role provisioning:
-- 1. Reverts default privilege grants
-- 2. Revokes table, sequence, type, and schema permissions
-- 3. Drops drizzle schema if created by migration role
-- 4. Terminates active backend connections for the target roles
-- 5. Reassigns and drops owned objects, then drops roles
--
-- SAFETY: Revert DATABASE_URL in environment configuration to administrative
-- role BEFORE executing this rollback script.
-- =============================================================================

BEGIN;

-- Step 1: Ensure executing role has membership for ALTER DEFAULT PRIVILEGES
GRANT skillverse_migrator TO neondb_owner;

-- Step 2: Revert default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  REVOKE USAGE ON TYPES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  REVOKE USAGE ON TYPES FROM skillverse_app;

ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM skillverse_app;

-- Step 3: Revoke schema and database privileges
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM skillverse_app;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM skillverse_app;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM skillverse_app;
REVOKE USAGE ON SCHEMA public FROM skillverse_app;
REVOKE CONNECT ON DATABASE neondb FROM skillverse_app;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM skillverse_migrator;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM skillverse_migrator;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM skillverse_migrator;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM skillverse_migrator;
REVOKE ALL PRIVILEGES ON SCHEMA drizzle FROM skillverse_migrator;
REVOKE CONNECT ON DATABASE neondb FROM skillverse_migrator;

-- Step 4: Drop migration metadata schema if empty
DROP SCHEMA IF EXISTS drizzle CASCADE;

-- Step 5: Reassign and drop any remaining owned dependencies before dropping roles
REASSIGN OWNED BY skillverse_migrator TO neondb_owner;
DROP OWNED BY skillverse_migrator;
DROP OWNED BY skillverse_app;

-- Step 6: Revoke role memberships
REVOKE skillverse_migrator FROM neondb_owner;

-- Step 7: Terminate any active connections holding logins for these roles
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename IN ('skillverse_app', 'skillverse_migrator')
  AND pid <> pg_backend_pid();

-- Step 8: Drop roles
DROP ROLE IF EXISTS skillverse_app;
DROP ROLE IF EXISTS skillverse_migrator;

COMMIT;
