-- =============================================================================
-- SkillVerse Phase 46: RBAC & Super Admin Schema Migration
-- Target: PostgreSQL on Neon Serverless
-- Database: neondb
--
-- 1. users.status (Account suspension/activation flag)
-- 2. users.two_factor_enabled (Multi-factor authentication enforcement)
-- 3. two_factors table (Official Better Auth TOTP secrets, verification & backup codes)
-- 4. Fast query indexes on users(role), users(status), and audit_logs
--
-- Mode: Single transaction — all-or-nothing
-- SAFETY: Do not execute against production without staging gate sign-off
-- =============================================================================

BEGIN;

-- 1. Add status column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'active';

-- 2. Add two_factor_enabled column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

-- 3. Create two_factors table conforming to Better Auth official twoFactor plugin schema
CREATE TABLE IF NOT EXISTS two_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  backup_codes text NOT NULL,
  verified boolean NOT NULL DEFAULT true,
  failed_verification_count integer NOT NULL DEFAULT 0,
  locked_until timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_two_factors_user_id ON two_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factors_secret ON two_factors(secret);

-- 4. Fast query performance indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;
