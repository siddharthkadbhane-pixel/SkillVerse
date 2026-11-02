-- =============================================================================
-- SkillVerse Phase 45: AI Review Provenance Schema Migration
-- Target: PostgreSQL on Neon Serverless (neondb)
--
-- Adds server-controlled provenance tracking to reviews and verified skills:
-- 1. reviews.provenance_status ('verified_inference' | 'simulated' | 'unknown')
-- 2. reviews.model_provider (e.g. 'huggingface')
-- 3. reviews.model_name (e.g. 'Qwen/Qwen2.5-Coder-32B-Instruct')
-- 4. review_history (matching provenance columns for version tracking)
-- 5. user_skills.provenance_status (guarantees downstream DCC integrity)
--
-- SAFETY & INTEGRITY GUARANTEES:
-- - All historical rows default strictly to 'unknown'.
-- - Never defaults to 'simulated = false' to avoid falsely legitimizing historical mock data.
-- - Includes lock_timeout guard to prevent connection pool exhaustion during DDL.
-- =============================================================================

BEGIN;

SET lock_timeout = '5s';

-- 1. Add provenance columns to reviews
ALTER TABLE reviews 
  ADD COLUMN IF NOT EXISTS provenance_status varchar(30) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS model_provider varchar(50),
  ADD COLUMN IF NOT EXISTS model_name varchar(100);

-- 2. Add provenance columns to review_history
ALTER TABLE review_history 
  ADD COLUMN IF NOT EXISTS provenance_status varchar(30) NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS model_provider varchar(50),
  ADD COLUMN IF NOT EXISTS model_name varchar(100);

-- 3. Add provenance columns to user_skills
ALTER TABLE user_skills 
  ADD COLUMN IF NOT EXISTS provenance_status varchar(30) NOT NULL DEFAULT 'unknown';

-- 4. Performance Indexes for DCC & verification filtering
CREATE INDEX IF NOT EXISTS idx_reviews_provenance ON reviews(provenance_status);
CREATE INDEX IF NOT EXISTS idx_user_skills_provenance ON user_skills(provenance_status);

COMMIT;

