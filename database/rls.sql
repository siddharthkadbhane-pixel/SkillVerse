-- =========================================================================
-- SkillVerse Production Row Level Security (RLS) Policies (Phase 40)
-- Protects User, Company, Evidence, Application, and Billing Data Isolation
-- =========================================================================

-- 1. Enable RLS on all primary entities
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_capability_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Users Table Policies
-- Anyone can view public user profiles; only the user can update their own row
CREATE POLICY "Public profiles are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users can update only their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- 3. Developer Capability Cards & Public Passport Policies
CREATE POLICY "Public DCCs are viewable by everyone" 
  ON developer_capability_cards FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage their own DCC records" 
  ON developer_capability_cards FOR ALL 
  USING (auth.uid() = user_id);

-- 4. Repositories & AST Review Policies
-- Public repositories viewable; private analysis scoped to owner
CREATE POLICY "Users can view and manage their linked repositories" 
  ON repositories FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own code review audits" 
  ON reviews FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM repositories 
      WHERE repositories.id = reviews.repository_id 
      AND repositories.user_id = auth.uid()
    )
  );

-- 5. Personal Access Tokens & Webhooks Policies (Strict Developer Privacy)
CREATE POLICY "Users can access only their own PAT tokens" 
  ON personal_access_tokens FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage only their own webhooks" 
  ON webhooks FOR ALL 
  USING (auth.uid() = user_id);

-- 6. Company & Recruiter Workspace Policies (Multi-Tenant Isolation)
-- Company profiles are viewable by verified recruiters; mutations restricted to company_admin
CREATE POLICY "Company members can view their organization workspace" 
  ON companies FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_members.company_id = companies.id 
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
    )
  );

CREATE POLICY "Company admins can update organization profile" 
  ON companies FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_members.company_id = companies.id 
      AND company_members.user_id = auth.uid() 
      AND company_members.role = 'company_admin'
      AND company_members.status = 'active'
    )
  );

-- Private Recruiter Notes (Strictly isolated to authorized recruiters in the same company)
CREATE POLICY "Recruiter notes visible only to company members" 
  ON recruiter_notes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_members.company_id = recruiter_notes.company_id 
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
    )
  );

-- 7. Job Applications & Recruiter Pipelines
-- Developers can view their submitted applications; recruiters can view applications to their company's jobs
CREATE POLICY "Developers can view their own job applications" 
  ON applications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can view applications for their company jobs" 
  ON applications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      JOIN company_members ON jobs.company_id = company_members.company_id
      WHERE jobs.id = applications.job_id 
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
    )
  );

-- 8. Subscriptions & Billing Quotas (Tenant Scoped)
CREATE POLICY "Users and companies can view their active subscription" 
  ON subscriptions FOR SELECT 
  USING (
    (target_type = 'user' AND target_id = auth.uid()) OR
    (target_type = 'company' AND EXISTS (
      SELECT 1 FROM company_members 
      WHERE company_members.company_id = subscriptions.target_id 
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
    ))
  );

-- 9. Audit Logs (Append-only for actors, readable only by platform admins)
CREATE POLICY "Admins can view audit logs" 
  ON audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
