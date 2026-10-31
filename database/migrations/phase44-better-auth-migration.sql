-- =============================================================================
-- SkillVerse Phase 44: Better Auth Schema Migration
-- Target: PostgreSQL on Neon Serverless
-- Database: neondb
--
-- Adds Better Auth core tables:
-- 1. sessions (Active browser session tokens)
-- 2. accounts (OAuth provider links & credentials)
-- 3. verifications (Magic links & verification tokens)
-- 4. users.email_verified (Required verification flag)
--
-- Mode: Single transaction — all-or-nothing
-- SAFETY: Do not execute against production without staging gate sign-off
-- =============================================================================

BEGIN;

-- 1. Add email_verified to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expires_at timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
-- Note: UNIQUE constraint on sessions(token) automatically creates unique index 'sessions_token_key'

-- 3. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamp,
  refresh_token_expires_at timestamp,
  scope text,
  password text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider_id, account_id);

-- 4. Create verifications table
CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);

COMMIT;
