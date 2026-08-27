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

// Fast connection settings with quick failure to prevent blocking UI requests
const client = postgres(connectionString, {
  prepare: false,
  connect_timeout: 1,
  idle_timeout: 10,
  max: 10,
});

export const db = drizzle(client, { schema });

/**
 * Executes a database query with a strict timeout to prevent slow blocking responses
 */
export async function withDbTimeout<T>(promise: Promise<T>, timeoutMs = 300): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`DB operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Idempotent database schema sync helper
export async function syncDatabaseSchema() {
  try {
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

    console.log('✅ Database schema verified and synced.');
  } catch (err) {
    console.error('❌ Database schema sync failed:', err);
  }
}


// Run schema sync asynchronously in the background
syncDatabaseSchema().catch(err => {
  console.error('Failed to auto-sync schema on boot:', err);
});

