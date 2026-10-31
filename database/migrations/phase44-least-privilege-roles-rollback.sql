-- =============================================================================
-- SkillVerse Phase 44: Least-Privilege Database Role Rollback Script
-- Target: PostgreSQL 18 / Serverless PostgreSQL on Neon (neondb)
--
-- Reverts Phase 44 role provisioning safely and idempotently:
-- 1. Checks role existence before issuing role commands (guards against partial provisioning)
-- 2. Dynamically detects database administrative owner from pg_database
-- 3. Reassigns all tables, sequences, and schemas owned by skillverse_migrator back to db owner
-- 4. Reverts default privileges for both roles
-- 5. Revokes table, sequence, type, function, schema, and database privileges
-- 6. Restores drizzle schema and migration ledger ownership to db owner
-- 7. Terminates active backend connections holding logins for target roles
-- 8. Drops roles safely with DROP ROLE IF EXISTS
--
-- SAFETY: Revert DATABASE_URL in environment configuration to administrative
-- role BEFORE executing this rollback script.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_db_owner text;
  v_migrator_exists boolean;
  v_app_exists boolean;
BEGIN
  -- Resolve database administrative owner
  SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = current_database();

  SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'skillverse_migrator') INTO v_migrator_exists;
  SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'skillverse_app') INTO v_app_exists;

  -- ---------------------------------------------------------------------------
  -- Part 1: Revert Default Privileges
  -- ---------------------------------------------------------------------------
  IF v_db_owner IS NOT NULL AND v_app_exists THEN
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM skillverse_app', v_db_owner);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM skillverse_app', v_db_owner);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE USAGE ON TYPES FROM skillverse_app', v_db_owner);
    EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM skillverse_app', v_db_owner);
  END IF;

  IF v_migrator_exists AND v_app_exists THEN
    ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
      REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM skillverse_app;
    ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
      REVOKE USAGE, SELECT ON SEQUENCES FROM skillverse_app;
    ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
      REVOKE USAGE ON TYPES FROM skillverse_app;
    ALTER DEFAULT PRIVILEGES FOR ROLE skillverse_migrator IN SCHEMA public
      REVOKE EXECUTE ON FUNCTIONS FROM skillverse_app;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Part 2: Revoke Application Role Privileges
  -- ---------------------------------------------------------------------------
  IF v_app_exists THEN
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM skillverse_app;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM skillverse_app;
    REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM skillverse_app;
    REVOKE USAGE ON SCHEMA public FROM skillverse_app;
    EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM skillverse_app', current_database());
    IF v_db_owner IS NOT NULL THEN
      EXECUTE format('GRANT skillverse_app TO %I', v_db_owner);
    END IF;
    DROP OWNED BY skillverse_app;
    IF v_db_owner IS NOT NULL THEN
      EXECUTE format('REVOKE skillverse_app FROM %I', v_db_owner);
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- Part 3: Reassign Objects & Revoke Migrator Role Privileges
  -- ---------------------------------------------------------------------------
  IF v_migrator_exists THEN
    -- Ensure membership before reassigning and dropping owned objects
    IF v_db_owner IS NOT NULL THEN
      EXECUTE format('GRANT skillverse_migrator TO %I', v_db_owner);
      EXECUTE format('REASSIGN OWNED BY skillverse_migrator TO %I', v_db_owner);
    END IF;

    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM skillverse_migrator;
    REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM skillverse_migrator;
    REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM skillverse_migrator;
    REVOKE ALL PRIVILEGES ON SCHEMA public FROM skillverse_migrator;
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'drizzle') THEN
      REVOKE ALL PRIVILEGES ON SCHEMA drizzle FROM skillverse_migrator;
    END IF;
    EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM skillverse_migrator', current_database());
    DROP OWNED BY skillverse_migrator;
    IF v_db_owner IS NOT NULL THEN
      EXECUTE format('REVOKE skillverse_migrator FROM %I', v_db_owner);
    END IF;
  END IF;

END $$;

-- ---------------------------------------------------------------------------
-- Part 4: Restore Migration Metadata Schema Ownership
-- ---------------------------------------------------------------------------
-- Preserves schema drizzle and the Drizzle Kit migration history ledger
-- (drizzle.__drizzle_migrations) while restoring full ownership to the database owner.
-- Broad DROP SCHEMA ... CASCADE is strictly avoided to prevent historical migration data loss.
DO $$
DECLARE
  v_db_owner text;
BEGIN
  SELECT datdba::regrole::text INTO v_db_owner FROM pg_database WHERE datname = current_database();

  IF v_db_owner IS NOT NULL AND EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'drizzle') THEN
    EXECUTE format('ALTER SCHEMA drizzle OWNER TO %I', v_db_owner);

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'drizzle' AND tablename = '__drizzle_migrations') THEN
      EXECUTE format('ALTER TABLE drizzle.__drizzle_migrations OWNER TO %I', v_db_owner);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_catalog.pg_sequences WHERE schemaname = 'drizzle' AND sequencename = '__drizzle_migrations_id_seq') THEN
      EXECUTE format('ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO %I', v_db_owner);
    END IF;

    RAISE NOTICE 'Restored ownership of schema drizzle and its objects to %', v_db_owner;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Part 5: Terminate Active Connections for Target Roles
-- ---------------------------------------------------------------------------
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename IN ('skillverse_app', 'skillverse_migrator')
  AND pid <> pg_backend_pid();

-- ---------------------------------------------------------------------------
-- Part 6: Drop Roles Safely
-- ---------------------------------------------------------------------------
DROP ROLE IF EXISTS skillverse_app;
DROP ROLE IF EXISTS skillverse_migrator;

COMMIT;
