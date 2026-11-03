-- =============================================================================
-- SkillVerse Phase 46 Rollback: RBAC & Super Admin Schema
-- Target: PostgreSQL on Neon Serverless
-- Database: neondb
--
-- Mode: Single transaction — all-or-nothing
-- SAFETY: Reverts changes introduced by phase46-rbac-super-admin.sql
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS two_factors CASCADE;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
ALTER TABLE users DROP COLUMN IF EXISTS two_factor_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS status;

COMMIT;

