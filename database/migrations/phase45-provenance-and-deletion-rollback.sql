-- =============================================================================
-- SkillVerse Phase 45: AI Review Provenance Rollback Migration
-- Target: PostgreSQL on Neon Serverless (neondb)
--
-- Reverts Phase 45 provenance schema additions:
-- 1. Drops indexes idx_reviews_provenance and idx_user_skills_provenance
-- 2. Drops provenance columns from user_skills
-- 3. Drops provenance columns from review_history
-- 4. Drops provenance columns from reviews
-- =============================================================================

BEGIN;

SET lock_timeout = '5s';

-- 1. Drop indexes
DROP INDEX IF EXISTS idx_reviews_provenance;
DROP INDEX IF EXISTS idx_user_skills_provenance;

-- 2. Drop columns from user_skills
ALTER TABLE user_skills DROP COLUMN IF EXISTS provenance_status;

-- 3. Drop columns from review_history
ALTER TABLE review_history 
  DROP COLUMN IF EXISTS provenance_status,
  DROP COLUMN IF EXISTS model_provider,
  DROP COLUMN IF EXISTS model_name;

-- 4. Drop columns from reviews
ALTER TABLE reviews 
  DROP COLUMN IF EXISTS provenance_status,
  DROP COLUMN IF EXISTS model_provider,
  DROP COLUMN IF EXISTS model_name;

COMMIT;

