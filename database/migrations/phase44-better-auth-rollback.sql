-- =============================================================================
-- SkillVerse Phase 44: Better Auth Schema Rollback
-- Target: PostgreSQL on Neon Serverless (neondb)
--
-- REVERTS Phase 44 Better Auth schema additions:
-- 1. Drops verifications table
-- 2. Drops accounts table
-- 3. Drops sessions table
-- 4. Removes email_verified column from users
--
-- CRITICAL PRE-CONDITIONS & SAFETY AUDIT:
-- 1. APPLICATION CODE MUST BE ROLLED BACK FIRST to pre-Phase 44 commit.
--    Executing this script while Phase 44 application code is running causes
--    immediate HTTP 500 crashes across all queries selecting from users table
--    (ERROR: column "email_verified" does not exist).
-- 2. DATA LOSS WARNING:
--    - Drops all active user sessions (100% of users logged out).
--    - Drops all GitHub OAuth linkages in accounts table.
--    - Deletes email_verified status flags across all users.
-- 3. MANDATORY SNAPSHOT: Capture a Neon point-in-time branch before executing.
-- =============================================================================

BEGIN;

-- 1. Drop Better Auth auxiliary tables
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- 2. Revert column additions from users
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

COMMIT;
