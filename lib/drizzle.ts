import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/database/schema';

import fs from 'fs';
import path from 'path';

// If DATABASE_URL is not set, load it from .env manually
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.substring(0, firstEqual).trim();
            let value = trimmed.substring(firstEqual + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            process.env[key] = value;
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to load .env file manually:', e);
  }
}

import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// Fast connection settings configured for Neon serverless postgres
const client = postgres(connectionString, {
  prepare: false,
  connect_timeout: 15,
  idle_timeout: 30,
  max: 10,
  ssl: 'require',
});

export const db = drizzle(client, { schema });

// High-speed Database Circuit Breaker
let isDbOnline = true;
let lastDbFailure = 0;
const DB_RETRY_INTERVAL_MS = 15000; // After 15 seconds, attempt one probe query

export function recordDbSuccess() {
  isDbOnline = true;
  lastDbFailure = 0;
}

export function recordDbFailure() {
  isDbOnline = false;
  lastDbFailure = Date.now();
}

export function checkDbAvailability(): boolean {
  if (isDbOnline) return true;
  if (Date.now() - lastDbFailure > DB_RETRY_INTERVAL_MS) {
    // Retry interval elapsed, allow 1 probe query through
    return true;
  }
  return false;
}

/**
 * Executes a database query with circuit breaker and strict timeout to prevent slow blocking responses
 */
export async function withDbTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  // If DB circuit breaker is open (known offline/timing out), reject instantly (0ms)
  if (!checkDbAvailability()) {
    return Promise.reject(new Error('DB currently offline (circuit breaker open)'));
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        recordDbFailure();
        reject(new Error(`DB operation timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    promise
      .then((res) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          recordDbSuccess();
          resolve(res);
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (
            err?.code === 'CONNECT_TIMEOUT' ||
            err?.message?.includes('TIMEOUT') ||
            err?.message?.includes('timeout') ||
            err?.message?.includes('Connection')
          ) {
            recordDbFailure();
          }
          reject(err);
        }
      });
  });
}

// Idempotent database schema sync helper
export async function syncDatabaseSchema() {
  if (!checkDbAvailability()) {
    return;
  }
  try {
    // Quick connection probe with timeout before running schema migrations
    await withDbTimeout(db.execute(sql`SELECT 1;`), 8000);
    console.log('🔄 Checking database schema updates...');
    // Ensure new reviews columns exist
    await db.execute(sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS health_scores jsonb;`);
    await db.execute(sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS intelligence_report jsonb;`);
    await db.execute(sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_explainability jsonb;`);
    await db.execute(sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS skills_extracted jsonb;`);

    // Ensure review_history table exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS review_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        version integer NOT NULL DEFAULT 1,
        summary text NOT NULL,
        strengths jsonb NOT NULL,
        weaknesses jsonb NOT NULL,
        architecture text NOT NULL,
        code_quality text NOT NULL,
        documentation text NOT NULL,
        best_practices text NOT NULL,
        suggested_learning jsonb NOT NULL,
        overall_score integer NOT NULL,
        confidence_score integer NOT NULL,
        health_scores jsonb,
        intelligence_report jsonb,
        ai_explainability jsonb,
        skills_extracted jsonb,
        raw_ai_output text,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    // AI Agent Ecosystem Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id varchar(50) PRIMARY KEY,
        name varchar(255) NOT NULL,
        role text NOT NULL,
        status varchar(20) DEFAULT 'active' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status varchar(20) DEFAULT 'pending' NOT NULL,
        started_at timestamp DEFAULT now() NOT NULL,
        completed_at timestamp,
        duration_ms integer
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_outputs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        agent_id varchar(50) NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
        output jsonb NOT NULL,
        status varchar(20) DEFAULT 'completed' NOT NULL,
        error_message text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_memory (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        repository_id uuid REFERENCES repositories(id) ON DELETE CASCADE,
        memory_key varchar(100) NOT NULL,
        memory_value jsonb NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        agent_id varchar(50) NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
        log_level varchar(10) NOT NULL,
        message text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_metrics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
        agent_id varchar(50) NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
        execution_time_ms integer NOT NULL,
        tokens_used integer DEFAULT 0 NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS agent_feedback (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        output_id uuid NOT NULL REFERENCES agent_outputs(id) ON DELETE CASCADE,
        rating integer NOT NULL,
        comments text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Seed the 12 specialized AI agents
    const agents = [
      { id: 'repo-intelligence', name: 'Repository Intelligence Agent', role: 'Analyze project structure, dependencies, frameworks, configuration and languages.' },
      { id: 'code-quality', name: 'Code Quality Agent', role: 'Evaluate code cleanliness, naming conventions, complexity, and maintainability.' },
      { id: 'architecture', name: 'Architecture Agent', role: 'Audit modular layout, design patterns, separation of concerns, and folder patterns.' },
      { id: 'security', name: 'Security Agent', role: 'Detect secrets leakages, package vulnerabilities, and authentication rules safety.' },
      { id: 'performance', name: 'Performance Agent', role: 'Analyze database queries, rendering, bundle size, and API efficiency.' },
      { id: 'testing', name: 'Testing Agent', role: 'Inspect Vitest/Jest/Cypress configurations, tests coverage, and missing tests.' },
      { id: 'documentation', name: 'Documentation Agent', role: 'Scan README structure, setup instructions, code comments, and usage examples.' },
      { id: 'skill-extraction', name: 'Skill Extraction Agent', role: 'Identify coding capabilities, categories, confidence index, and collect verified evidence.' },
      { id: 'trust-engine', name: 'Trust Engine Agent', role: 'Calculate Trust reputation scores, confidence indices, and history timelines.' },
      { id: 'learning', name: 'Learning Agent', role: 'Propose personalized learning guides, recommended projects, and weekly target goals.' },
      { id: 'career', name: 'Career Agent', role: 'Analyze career pathway readiness, resume optimizations, and hiring funnel suitability.' },
      { id: 'community', name: 'Community Agent', role: 'Recommend active teams, open challenges, mentors, and collaborative projects.' },
    ];

    for (const agent of agents) {
      await db.execute(sql`
        INSERT INTO ai_agents (id, name, role, status)
        VALUES (${agent.id}, ${agent.name}, ${agent.role}, 'active')
        ON CONFLICT (id) DO UPDATE SET name = ${agent.name}, role = ${agent.role};
      `);
    }

    // Developer Intelligence Graph Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS graph_nodes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL,
        label varchar(255) NOT NULL,
        properties jsonb NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS graph_edges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source_node_id uuid NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
        target_node_id uuid NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL,
        properties jsonb NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS skill_evolution_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        skill_name varchar(100) NOT NULL,
        level integer NOT NULL,
        confidence integer NOT NULL,
        changed_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activity_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type varchar(50) NOT NULL,
        repository_name varchar(255) NOT NULL,
        payload jsonb NOT NULL,
        processed boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS engineering_timeline (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_class varchar(50) NOT NULL,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        timestamp timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recommendations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL,
        item_id varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        reasoning text NOT NULL,
        score integer NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reputation_scores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        engineering integer DEFAULT 0 NOT NULL,
        community integer DEFAULT 0 NOT NULL,
        mentorship integer DEFAULT 0 NOT NULL,
        open_source integer DEFAULT 0 NOT NULL,
        learning integer DEFAULT 0 NOT NULL,
        challenge integer DEFAULT 0 NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS privacy_settings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        public_repos boolean DEFAULT true NOT NULL,
        private_repos boolean DEFAULT false NOT NULL,
        visible_skills jsonb NOT NULL,
        visible_activity boolean DEFAULT true NOT NULL,
        profile_visibility varchar(20) DEFAULT 'public' NOT NULL,
        company_visibility varchar(20) DEFAULT 'public' NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Developer Cloud Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(255) NOT NULL,
        repository_id uuid REFERENCES repositories(id) ON DELETE SET NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS execution_jobs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        status varchar(20) DEFAULT 'pending' NOT NULL,
        language varchar(50) NOT NULL,
        command text NOT NULL,
        exit_code integer,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS builds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        status varchar(20) DEFAULT 'pending' NOT NULL,
        commit_hash varchar(100),
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS deployments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        status varchar(20) DEFAULT 'pending' NOT NULL,
        platform varchar(50) NOT NULL,
        deployment_url text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS artifacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL,
        file_name varchar(255) NOT NULL,
        file_size integer NOT NULL,
        meta jsonb,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS runtime_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id uuid NOT NULL REFERENCES execution_jobs(id) ON DELETE CASCADE,
        stream varchar(10) NOT NULL,
        content text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(50) DEFAULT 'owner' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS resource_usage (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        cpu_shares integer NOT NULL,
        memory_bytes bigint NOT NULL,
        duration_sec integer NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Global Verification Network Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        type varchar(50) NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS institutions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        type varchar(50) NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        partner_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        status varchar(20) DEFAULT 'pending' NOT NULL,
        requested_data jsonb NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS certificates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        evidence_repo_url text NOT NULL,
        issued_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_integrations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform varchar(50) NOT NULL,
        token text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS passport_exports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        format varchar(10) NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organization_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(50) DEFAULT 'member' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS challenge_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        rules text,
        status varchar(20) DEFAULT 'active' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Developer Capability Card (DCC) Tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS developer_capability_cards (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        overall_score integer DEFAULT 0 NOT NULL,
        level varchar(50) DEFAULT 'Explorer' NOT NULL,
        summary text,
        verification_status varchar(50) DEFAULT 'unverified' NOT NULL,
        confidence_score integer DEFAULT 0 NOT NULL,
        last_updated timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS capability_dimensions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        card_id uuid NOT NULL REFERENCES developer_capability_cards(id) ON DELETE CASCADE UNIQUE,
        engineering jsonb NOT NULL,
        skills jsonb NOT NULL,
        projects jsonb NOT NULL,
        collaboration jsonb NOT NULL,
        growth jsonb NOT NULL,
        career jsonb NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS capability_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        overall_score integer NOT NULL,
        level varchar(50) NOT NULL,
        changed_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS capability_levels (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        level_name varchar(50) NOT NULL UNIQUE,
        min_score integer NOT NULL,
        badge_url text,
        achievements_required jsonb
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS capability_insights (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        strengths jsonb NOT NULL,
        weaknesses jsonb NOT NULL,
        learning_suggestions jsonb NOT NULL,
        advice text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS verification_evidence (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        dimension varchar(50) NOT NULL,
        source_repo varchar(255) NOT NULL,
        verification_method varchar(100) NOT NULL,
        confidence integer NOT NULL,
        verified_at timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS comparison_cache (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id_1 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_id_2 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comparison_data jsonb NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // Seed default capability levels
    const levels = [
      { name: 'Explorer', score: 0 },
      { name: 'Builder', score: 150 },
      { name: 'Creator', score: 300 },
      { name: 'Professional', score: 500 },
      { name: 'Advanced', score: 650 },
      { name: 'Expert', score: 800 },
      { name: 'Elite', score: 920 },
    ];

    for (const lvl of levels) {
      await db.execute(sql`
        INSERT INTO capability_levels (level_name, min_score, achievements_required)
        VALUES (${lvl.name}, ${lvl.score}, '[]'::jsonb)
        ON CONFLICT (level_name) DO UPDATE SET min_score = ${lvl.score};
      `);
    }

    // Developer Discovery & Search Optimization Indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_visibility ON privacy_settings(user_id, profile_visibility);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_passports_user_visibility ON passports(user_id, visibility);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_dcc_user_score ON developer_capability_cards(user_id, overall_score);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_dcc_level ON developer_capability_cards(level);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);`);
    // Phase 27: Contribution Intelligence Table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contribution_activities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        repository_id uuid REFERENCES repositories(id) ON DELETE SET NULL,
        repository_name varchar(255) NOT NULL,
        activity_type varchar(50) NOT NULL,
        source_id varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        activity_date timestamp NOT NULL DEFAULT now(),
        metadata jsonb,
        is_public boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_contrib_user_type_source ON contribution_activities(user_id, activity_type, source_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_contrib_user_date ON contribution_activities(user_id, activity_date);`);

    // Phase 28: Developer Capabilities Table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS developer_capabilities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        capability_name varchar(100) NOT NULL,
        category varchar(100) NOT NULL,
        level varchar(50) NOT NULL,
        verification_state varchar(50) NOT NULL,
        confidence_score integer NOT NULL DEFAULT 0,
        analyzed_projects_count integer NOT NULL DEFAULT 0,
        supporting_skills jsonb,
        why_explanation text,
        evidence_repos jsonb,
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_dev_capabilities_user_name ON developer_capabilities(user_id, capability_name);`);

    // Phase 29: Verification Evidence Freshness & Weight Migration
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_evidence' AND column_name = 'freshness_state') THEN
          ALTER TABLE verification_evidence ADD COLUMN freshness_state varchar(50) NOT NULL DEFAULT 'current';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_evidence' AND column_name = 'evidence_weight') THEN
          ALTER TABLE verification_evidence ADD COLUMN evidence_weight varchar(50) NOT NULL DEFAULT 'moderate';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_evidence' AND column_name = 'source_identifier') THEN
          ALTER TABLE verification_evidence ADD COLUMN source_identifier varchar(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_evidence' AND column_name = 'last_audited_at') THEN
          ALTER TABLE verification_evidence ADD COLUMN last_audited_at timestamp NOT NULL DEFAULT now();
        END IF;
      END $$;
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_verif_evidence_user_freshness ON verification_evidence(user_id, freshness_state);`);

    // Phase 30: Company & Recruiter Workspace Migration
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS company_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(50) NOT NULL DEFAULT 'recruiter',
        status varchar(50) NOT NULL DEFAULT 'active',
        invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
        joined_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS saved_developers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        recruiter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        developer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notes text,
        tags jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS recruiter_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        recruiter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        developer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content text NOT NULL,
        is_private boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS recently_viewed_developers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        recruiter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        developer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewed_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_company_members_unique ON company_members(company_id, user_id);`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_developers_unique ON saved_developers(company_id, developer_user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recruiter_notes_company_dev ON recruiter_notes(company_id, developer_user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_recent_views_company_recruiter ON recently_viewed_developers(company_id, recruiter_id);`);

    // Phase 31: Job & Opportunity Engine Migration
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'workplace_type') THEN
          ALTER TABLE jobs ADD COLUMN workplace_type varchar(50) NOT NULL DEFAULT 'remote';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'required_skills') THEN
          ALTER TABLE jobs ADD COLUMN required_skills jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'preferred_skills') THEN
          ALTER TABLE jobs ADD COLUMN preferred_skills jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'required_capabilities') THEN
          ALTER TABLE jobs ADD COLUMN required_capabilities jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'preferred_capabilities') THEN
          ALTER TABLE jobs ADD COLUMN preferred_capabilities jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'experience_level') THEN
          ALTER TABLE jobs ADD COLUMN experience_level varchar(50) NOT NULL DEFAULT 'Mid-Level';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'status') THEN
          ALTER TABLE jobs ADD COLUMN status varchar(50) NOT NULL DEFAULT 'published';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'deadline') THEN
          ALTER TABLE jobs ADD COLUMN deadline timestamp;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'views_count') THEN
          ALTER TABLE jobs ADD COLUMN views_count integer NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'applications_count') THEN
          ALTER TABLE jobs ADD COLUMN applications_count integer NOT NULL DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'match_score') THEN
          ALTER TABLE applications ADD COLUMN match_score integer NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'match_details') THEN
          ALTER TABLE applications ADD COLUMN match_details jsonb;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS saved_opportunities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opportunity_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_opportunities_unique ON saved_opportunities(user_id, opportunity_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_jobs_status_type ON jobs(status, type);`);

    // Phase 32 & Phase 33: Challenges & Teams Engine Migration
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organizer_id uuid NOT NULL,
        organizer_type varchar(50) NOT NULL DEFAULT 'company',
        title varchar(255) NOT NULL,
        description text NOT NULL,
        type varchar(50) NOT NULL DEFAULT 'coding',
        difficulty varchar(50) NOT NULL DEFAULT 'Intermediate',
        required_skills jsonb,
        preferred_skills jsonb,
        start_date timestamp NOT NULL DEFAULT now(),
        end_date timestamp NOT NULL DEFAULT (now() + interval '30 days'),
        submission_deadline timestamp NOT NULL DEFAULT (now() + interval '25 days'),
        max_participants integer,
        visibility varchar(20) NOT NULL DEFAULT 'public',
        status varchar(50) NOT NULL DEFAULT 'published',
        criteria_weights jsonb,
        prize_pool varchar(100),
        is_hiring_opportunity boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS challenge_participants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id uuid,
        joined_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS challenge_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        team_id uuid,
        repository_url text NOT NULL,
        live_demo_url text,
        description text,
        submitted_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS challenge_evaluations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id uuid NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
        composite_score integer NOT NULL,
        functionality_score integer NOT NULL,
        code_quality_score integer NOT NULL,
        architecture_score integer NOT NULL,
        testing_score integer NOT NULL,
        documentation_score integer NOT NULL,
        ast_quality_tier varchar(50) NOT NULL DEFAULT 'Verified Expert',
        verified_capabilities jsonb,
        feedback_notes text,
        evaluated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS challenge_judges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(50) NOT NULL DEFAULT 'judge',
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS teams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        slug varchar(255) NOT NULL UNIQUE,
        description text NOT NULL,
        avatar_url text,
        owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        visibility varchar(20) NOT NULL DEFAULT 'public',
        skills jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(50) NOT NULL DEFAULT 'member',
        joined_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS team_invites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        inviter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_email varchar(255),
        status varchar(50) NOT NULL DEFAULT 'pending',
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS team_projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name varchar(255) NOT NULL,
        description text,
        repository_url text NOT NULL,
        challenge_id uuid,
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS team_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        description text,
        assignee_user_id uuid,
        status varchar(50) NOT NULL DEFAULT 'todo',
        due_date timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS team_milestones (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        target_date timestamp NOT NULL,
        completed boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS team_activity (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action varchar(255) NOT NULL,
        details text,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_participants_unique ON challenge_participants(challenge_id, user_id);`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_submissions_unique ON challenge_submissions(challenge_id, user_id);`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_unique ON team_members(team_id, user_id);`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invites_unique ON team_invites(team_id, invitee_user_id);`);

    // Phase 38 Developer API & Webhook Platform
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS personal_access_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(255) NOT NULL,
        token_hash varchar(128) NOT NULL UNIQUE,
        token_prefix varchar(30) NOT NULL,
        scopes jsonb NOT NULL,
        expires_at timestamp,
        last_used_at timestamp,
        revoked_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS webhooks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url text NOT NULL,
        events jsonb NOT NULL,
        secret varchar(255) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'active',
        failure_count integer NOT NULL DEFAULT 0,
        description text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id uuid NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
        event_id varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        payload jsonb NOT NULL,
        status_code integer,
        duration_ms integer,
        attempt integer NOT NULL DEFAULT 1,
        max_attempts integer NOT NULL DEFAULT 3,
        next_retry_at timestamp,
        status varchar(20) NOT NULL DEFAULT 'pending',
        response_body text,
        created_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id varchar(100) NOT NULL,
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        token_id uuid REFERENCES personal_access_tokens(id) ON DELETE SET NULL,
        client_type varchar(50) NOT NULL DEFAULT 'api',
        endpoint varchar(255) NOT NULL,
        method varchar(10) NOT NULL,
        status_code integer NOT NULL,
        duration_ms integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now()
      );

      -- Phase 39 Monetization & Billing Foundation
      CREATE TABLE IF NOT EXISTS subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        target_type varchar(20) NOT NULL DEFAULT 'user',
        target_id uuid NOT NULL,
        plan_id varchar(50) NOT NULL DEFAULT 'free',
        status varchar(20) NOT NULL DEFAULT 'active',
        provider varchar(50) NOT NULL DEFAULT 'mock',
        provider_customer_id varchar(255),
        provider_subscription_id varchar(255),
        current_period_start timestamp NOT NULL DEFAULT now(),
        current_period_end timestamp NOT NULL,
        cancel_at_period_end boolean NOT NULL DEFAULT false,
        metadata jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS usage_counters (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        target_type varchar(20) NOT NULL DEFAULT 'user',
        target_id uuid NOT NULL,
        metric varchar(100) NOT NULL,
        period_start timestamp NOT NULL,
        period_end timestamp NOT NULL,
        count integer NOT NULL DEFAULT 0,
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS billing_customers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        target_type varchar(20) NOT NULL DEFAULT 'user',
        target_id uuid NOT NULL,
        provider varchar(50) NOT NULL DEFAULT 'mock',
        provider_customer_id varchar(255) NOT NULL UNIQUE,
        email varchar(255) NOT NULL,
        name varchar(255),
        billing_address jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS billing_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id varchar(100) NOT NULL UNIQUE,
        provider varchar(50) NOT NULL,
        event_type varchar(100) NOT NULL,
        target_type varchar(20),
        target_id uuid,
        payload jsonb NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'success',
        error_message text,
        created_at timestamp NOT NULL DEFAULT now()
      );

      -- Phase 40 Scale, Security & Enterprise Readiness
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        actor_role varchar(50) NOT NULL DEFAULT 'developer',
        action varchar(100) NOT NULL,
        resource_type varchar(100) NOT NULL,
        resource_id varchar(100),
        ip_address varchar(50) DEFAULT '127.0.0.1',
        details jsonb,
        created_at timestamp NOT NULL DEFAULT now()
      );

      -- Phase 41 Legal, Privacy & Compliance Foundation
      CREATE TABLE IF NOT EXISTS user_consents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        purpose varchar(50) NOT NULL,
        granted boolean NOT NULL DEFAULT true,
        version varchar(20) NOT NULL DEFAULT 'v1.0',
        ip_address varchar(50),
        created_at timestamp NOT NULL DEFAULT now(),
        revoked_at timestamp
      );

      CREATE TABLE IF NOT EXISTS privacy_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        email varchar(255) NOT NULL,
        name varchar(255),
        request_type varchar(50) NOT NULL,
        details text NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        response_notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        resolved_at timestamp
      );
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pat_token_hash ON personal_access_tokens(token_hash);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_target ON subscriptions(target_type, target_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_usage_target_metric_period ON usage_counters(target_type, target_id, metric, period_start);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_billing_events_event_id ON billing_events(event_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_action ON audit_logs(actor_id, action);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_repositories_user_analyzed ON repositories(user_id, is_analyzed);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_company_members_company_user ON company_members(company_id, user_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_consents_user_purpose ON user_consents(user_id, purpose);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);`);

    console.log('✅ Database schema, API Platform, Webhooks, Billing, Enterprise Security, and Privacy Foundation synced.');
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (err?.code === 'CONNECT_TIMEOUT' || msg.includes('timeout') || msg.includes('timed out') || msg.includes('circuit breaker')) {
      console.log('ℹ️ Remote database connection timed out. Application running smoothly in resilient fallback mode.');
    } else {
      console.error('❌ Database schema sync failed:', err?.message || err);
    }
  }
}

// Explicit schema synchronization must be executed deliberately via deployment migration scripts.
// Automatic execution on module import has been eliminated to prevent DDL race conditions and production side-effects.
