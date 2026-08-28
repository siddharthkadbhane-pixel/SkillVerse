import { pgTable, uuid, varchar, text, integer, timestamp, boolean, jsonb, primaryKey, pgEnum, bigint } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['developer', 'recruiter', 'company_admin', 'admin']);
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'contract', 'internship', 'remote']);
export const appStatusEnum = pgEnum('app_status', ['applied', 'reviewing', 'shortlisted', 'rejected', 'offered']);

// 1. Users Table (Linked to Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  username: varchar('username', { length: 100 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
  githubId: varchar('github_id', { length: 100 }).unique(),
  githubToken: text('github_token'), // Encrypted github access token
  role: userRoleEnum('role').default('developer').notNull(),
  bio: text('bio'),
  website: text('website'),
  location: varchar('location', { length: 255 }),
  companyId: uuid('company_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Trust Scores Table
export const trustScores = pgTable('trust_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  overallScore: integer('overall_score').default(0).notNull(),
  projectScore: integer('project_score').default(0).notNull(),
  contributionScore: integer('contribution_score').default(0).notNull(),
  competitionScore: integer('competition_score').default(0).notNull(),
  peerVouchScore: integer('peer_vouch_score').default(0).notNull(),
  categoryScores: jsonb('category_scores'),
  weightValues: jsonb('weight_values'),
  confidence: integer('confidence').default(0).notNull(),
  engineVersion: varchar('engine_version', { length: 50 }).default('1.0.0').notNull(),
  explanation: text('explanation'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2b. Trust History Table
export const trustHistory = pgTable('trust_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  overallScore: integer('overall_score').notNull(),
  categoryScores: jsonb('category_scores').notNull(),
  engineVersion: varchar('engine_version', { length: 50 }).notNull(),
  explanation: text('explanation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Skill DNA Table
export const skillDna = pgTable('skill_dna', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  dnaStructure: jsonb('dna_structure').notNull(), // Detailed nested stats of dev capability
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Repositories Table
export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  githubRepoId: integer('github_repo_id').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  description: text('description'),
  htmlUrl: text('html_url').notNull(),
  language: varchar('language', { length: 100 }),
  stars: integer('stars').default(0).notNull(),
  forks: integer('forks').default(0).notNull(),
  isAnalyzed: boolean('is_analyzed').default(false).notNull(),
  analyzedAt: timestamp('analyzed_at'),
  metadata: jsonb('metadata'),
  summary: jsonb('summary'),
  context: jsonb('context'),
  reviewStatus: varchar('review_status', { length: 50 }).default('idle').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Reviews Table (AI generated audit outputs)
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull().unique(),
  summary: text('summary').notNull(),
  strengths: jsonb('strengths').notNull(), // JSON Array of strings
  weaknesses: jsonb('weaknesses').notNull(), // JSON Array of strings
  architecture: text('architecture').notNull(),
  codeQuality: text('code_quality').notNull(),
  documentation: text('documentation').notNull(),
  bestPractices: text('best_practices').notNull(),
  suggestedLearning: jsonb('suggested_learning').notNull(), // JSON Array of strings
  overallScore: integer('overall_score').notNull(), // 0 to 100
  confidenceScore: integer('confidence_score').notNull(), // 0 to 100
  healthScores: jsonb('health_scores'), // Category health scores & details
  intelligenceReport: jsonb('intelligence_report'), // Repository structure analysis
  aiExplainability: jsonb('ai_explainability'), // Premium AI findings and evidence
  skillsExtracted: jsonb('skills_extracted'), // Advanced verified skills
  rawAiOutput: text('raw_ai_output'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5b. Review History Table (to support version history tracking)
export const reviewHistory = pgTable('review_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  version: integer('version').default(1).notNull(),
  summary: text('summary').notNull(),
  strengths: jsonb('strengths').notNull(),
  weaknesses: jsonb('weaknesses').notNull(),
  architecture: text('architecture').notNull(),
  codeQuality: text('code_quality').notNull(),
  documentation: text('documentation').notNull(),
  bestPractices: text('best_practices').notNull(),
  suggestedLearning: jsonb('suggested_learning').notNull(),
  overallScore: integer('overall_score').notNull(),
  confidenceScore: integer('confidence_score').notNull(),
  healthScores: jsonb('health_scores'),
  intelligenceReport: jsonb('intelligence_report'),
  aiExplainability: jsonb('ai_explainability'),
  skillsExtracted: jsonb('skills_extracted'),
  rawAiOutput: text('raw_ai_output'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});


// 6. Skills Table (System master list of verified skills)
export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
});

// 7. User Verified Skills Join Table
export const userSkills = pgTable('user_skills', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  skillId: uuid('skill_id').references(() => skills.id, { onDelete: 'cascade' }).notNull(),
  proficiencyLevel: integer('proficiency_level').default(1).notNull(),
  verificationSource: varchar('verification_source', { length: 100 }).notNull(),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.skillId] })
}));

// 8. Projects Table (Manual verified uploads)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  liveUrl: text('live_url'),
  githubUrl: text('github_url'),
  demoVideoUrl: text('demo_video_url'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Contributions Table
export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  prUrl: text('pr_url').unique(),
  commitHash: varchar('commit_hash', { length: 100 }),
  type: varchar('type', { length: 50 }).notNull(), // 'pull_request', 'commit', 'issue'
  verified: boolean('verified').default(false).notNull(),
  impactWeight: integer('impact_weight').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Competitions Table
export const competitions = pgTable('competitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  rules: text('rules'),
  prizePool: varchar('prize_pool', { length: 255 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Teams Table (Phase 33 Team Formation & Collaboration Engine)
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  repoUrl: text('repo_url'),
  competitionId: uuid('competition_id').references(() => competitions.id, { onDelete: 'cascade' }),
  leaderId: uuid('leader_id').references(() => users.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }),
  visibility: varchar('visibility', { length: 20 }).default('public').notNull(),
  skills: jsonb('skills'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. Team Members Table
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const collabTeams = teams;
export const collabTeamMembers = teamMembers;

// 13. Companies Table
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  website: text('website'),
  description: text('description'),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Jobs / Opportunities Table (Phase 31 Job & Opportunity Engine)
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  location: varchar('location', { length: 255 }),
  type: varchar('type', { length: 50 }).default('full_time').notNull(), // 'full_time', 'part_time', 'internship', 'contract', 'freelance', 'project'
  workplaceType: varchar('workplace_type', { length: 50 }).default('remote').notNull(), // 'remote', 'hybrid', 'onsite'
  requiredSkills: jsonb('required_skills'), // array of skill names
  preferredSkills: jsonb('preferred_skills'), // array of skill names
  requiredCapabilities: jsonb('required_capabilities'), // array of capability names
  preferredCapabilities: jsonb('preferred_capabilities'), // array of capability names
  experienceLevel: varchar('experience_level', { length: 50 }).default('Mid-Level').notNull(),
  salaryRange: varchar('salary_range', { length: 100 }),
  minTrustScore: integer('min_trust_score').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('published').notNull(), // 'draft', 'published', 'closed'
  deadline: timestamp('deadline'),
  viewsCount: integer('views_count').default(0).notNull(),
  applicationsCount: integer('applications_count').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Job Applications Table (Phase 31 Job & Opportunity Engine)
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  resumeUrl: text('resume_url'),
  coverLetter: text('cover_letter'),
  status: varchar('status', { length: 50 }).default('applied').notNull(), // 'applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted'
  matchScore: integer('match_score').default(0).notNull(),
  matchDetails: jsonb('match_details'), // OpportunityMatchEvaluation snapshot
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 16. Comments Table
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. Likes Table
export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. Bookmarks Table
export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reviewId: uuid('review_id').references(() => reviews.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 19. Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'like', 'comment', 'job_application', 'review_done'
  isRead: boolean('is_read').default(false).notNull(),
  actionUrl: text('action_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 20. Activity Logs Table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 21. Skill History Table
export const skillHistory = pgTable('skill_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  previousLevel: integer('previous_level').notNull(),
  currentLevel: integer('current_level').notNull(),
  growthPercent: integer('growth_percent').notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 22. Passports Table
export const passports = pgTable('passports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  generatedSummary: text('generated_summary'),
  visibility: varchar('visibility', { length: 20 }).default('public').notNull(), // 'public' | 'private' | 'unlisted'
  theme: varchar('theme', { length: 50 }).default('dark').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  lastGeneratedAt: timestamp('last_generated_at').defaultNow().notNull(),
});

// 23. Passport Views (Analytics) Table
export const passportViews = pgTable('passport_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  passportId: uuid('passport_id').references(() => passports.id, { onDelete: 'cascade' }).notNull(),
  viewerRole: varchar('viewer_role', { length: 50 }).default('anonymous').notNull(), // 'recruiter' | 'developer' | 'anonymous'
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
});

// 24. Profile Bookmarks Table
export const profileBookmarks = pgTable('profile_bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  username: varchar('username', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 25. Profile Shares Table
export const profileShares = pgTable('profile_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 55 }).notNull(), // 'linkedin' | 'twitter' | 'copy'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 26. Dashboard Preferences Table
export const dashboardPreferences = pgTable('dashboard_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  theme: varchar('theme', { length: 50 }).default('dark').notNull(),
  showTimeline: boolean('show_timeline').default(true).notNull(),
  showRecommendations: boolean('show_recommendations').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 27. Challenges Table (Phase 32 Verification Challenges & Competitions)
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizerId: uuid('organizer_id'),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
  organizerType: varchar('organizer_type', { length: 50 }).default('company').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 50 }).default('coding').notNull(),
  difficulty: varchar('difficulty', { length: 50 }).default('Intermediate').notNull(),
  requiredSkills: jsonb('required_skills'),
  preferredSkills: jsonb('preferred_skills'),
  technologies: jsonb('technologies'),
  timeLimit: varchar('time_limit', { length: 100 }),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date').defaultNow().notNull(),
  submissionDeadline: timestamp('submission_deadline').defaultNow().notNull(),
  maxParticipants: integer('max_participants'),
  visibility: varchar('visibility', { length: 20 }).default('public').notNull(),
  status: varchar('status', { length: 50 }).default('published').notNull(),
  criteriaWeights: jsonb('criteria_weights'),
  prizePool: varchar('prize_pool', { length: 100 }),
  reward: varchar('reward', { length: 255 }),
  isHiringOpportunity: boolean('is_hiring_opportunity').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 28. Challenge Submissions Table
export const challengeSubmissions = pgTable('challenge_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  developerId: uuid('developer_id').references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id'),
  repositoryUrl: text('repository_url').notNull(),
  liveDemoUrl: text('live_demo_url'),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('submitted').notNull(),
  score: integer('score').default(0).notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 29. Challenge Evaluations / Reviews Table
export const challengeEvaluations = pgTable('challenge_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => challengeSubmissions.id, { onDelete: 'cascade' }).notNull(),
  compositeScore: integer('composite_score').notNull(),
  functionalityScore: integer('functionality_score').notNull(),
  codeQualityScore: integer('code_quality_score').notNull(),
  architectureScore: integer('architecture_score').notNull(),
  testingScore: integer('testing_score').notNull(),
  documentationScore: integer('documentation_score').notNull(),
  astQualityTier: varchar('ast_quality_tier', { length: 50 }).default('Verified Expert').notNull(),
  verifiedCapabilities: jsonb('verified_capabilities'),
  feedbackNotes: text('feedback_notes'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});

export const challengeReviews = challengeEvaluations;

export const challengeParticipants = pgTable('challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  teamId: uuid('team_id'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const challengeJudges = pgTable('challenge_judges', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('judge').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 30. Community Posts Table (Phase 34 Developer Community & Knowledge Network)
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  contentType: varchar('content_type', { length: 50 }).default('technical_discussion').notNull(),
  category: varchar('category', { length: 50 }).default('General').notNull(),
  tags: jsonb('tags'), // array of topic strings
  codeSnippet: text('code_snippet'),
  githubLink: text('github_link'),
  repositoryUrl: text('repository_url'),
  liveDemoUrl: text('live_demo_url'),
  challengeId: uuid('challenge_id'),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  viewsCount: integer('views_count').default(0).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 31. Post Comments Table
export const postComments = pgTable('post_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  codeSnippet: text('code_snippet'),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 32. Coding Questions Table (Phase 34 Q&A)
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: jsonb('tags'),
  codeSnippet: text('code_snippet'),
  status: varchar('status', { length: 50 }).default('open').notNull(), // 'open' | 'answered' | 'closed'
  acceptedAnswerId: uuid('accepted_answer_id'),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  answersCount: integer('answers_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 33. Answers Table
export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  codeSnippet: text('code_snippet'),
  isAccepted: boolean('is_accepted').default(false).notNull(),
  upvotesCount: integer('upvotes_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const teamInvites = pgTable('team_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  inviterUserId: uuid('inviter_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  inviteeUserId: uuid('invitee_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  inviteeEmail: varchar('invitee_email', { length: 255 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teamProjects = pgTable('team_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  repositoryUrl: text('repository_url').notNull(),
  challengeId: uuid('challenge_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teamTasks = pgTable('team_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assigneeUserId: uuid('assignee_user_id'),
  status: varchar('status', { length: 50 }).default('todo').notNull(),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teamMilestones = pgTable('team_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  targetDate: timestamp('target_date').notNull(),
  completed: boolean('completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teamActivity = pgTable('team_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36. Peer Review Requests Table (Phase 34 Peer Code Reviews)
export const peerReviewRequests = pgTable('peer_review_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requesterId: uuid('requester_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  repositoryUrl: text('repository_url').notNull(),
  branchOrCommit: varchar('branch_or_commit', { length: 100 }),
  focusAreas: jsonb('focus_areas'), // array of strings
  status: varchar('status', { length: 50 }).default('requested').notNull(), // 'requested', 'reviewing', 'completed', 'closed'
  responsesCount: integer('responses_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36b. Peer Review Responses Table
export const peerReviewResponses = pgTable('peer_review_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => peerReviewRequests.id, { onDelete: 'cascade' }).notNull(),
  reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  architectureScore: integer('architecture_score').notNull(), // 0-100
  codeQualityScore: integer('code_quality_score').notNull(),
  securityScore: integer('security_score').notNull(),
  testingScore: integer('testing_score').notNull(),
  feedbackNotes: text('feedback_notes').notNull(),
  suggestedImprovements: jsonb('suggested_improvements'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const peerReviews = peerReviewResponses;

// 36c. Community Votes Table (Composite unique on userId + targetType + targetId)
export const communityVotes = pgTable('community_votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(), // 'post' | 'comment' | 'question' | 'answer'
  targetId: uuid('target_id').notNull(),
  voteType: varchar('vote_type', { length: 20 }).default('upvote').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36d. Community Follows Table (Follow developer, topic, project, team)
export const communityFollows = pgTable('community_follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(), // 'developer' | 'topic' | 'project' | 'team'
  targetId: varchar('target_id', { length: 255 }).notNull(), // userId, topic name, or projectId
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36e. Community Content Reports Table (Moderation)
export const communityReports = pgTable('community_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(), // 'post' | 'comment' | 'question' | 'answer' | 'user'
  targetId: varchar('target_id', { length: 255 }).notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending' | 'reviewed' | 'dismissed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36f. Community User Blocks Table
export const communityBlocks = pgTable('community_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  blockedUserId: uuid('blocked_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36g. Community Reputation Table (Separate from DCC capability score)
export const communityReputation = pgTable('community_reputation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  points: integer('points').default(0).notNull(),
  acceptedAnswersCount: integer('accepted_answers_count').default(0).notNull(),
  helpfulReviewsCount: integer('helpful_reviews_count').default(0).notNull(),
  technicalWriteupsCount: integer('technical_writeups_count').default(0).notNull(),
  verifiedContributionsCount: integer('verified_contributions_count').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 37. Career Goals Table (Enhanced Phase 35 AI Career & Learning Intelligence)
export const careerGoals = pgTable('career_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  targetRole: varchar('target_role', { length: 100 }).default('backend_developer'),
  customGoal: text('custom_goal'),
  milestoneIntent: varchar('milestone_intent', { length: 100 }).default('Prepare for First Job'),
  timeframe: varchar('timeframe', { length: 50 }).default('3 Months'),
  targetLevel: varchar('target_level', { length: 50 }).default('Proficient'),
  focusSkills: jsonb('focus_skills'),
  isPublic: boolean('is_public').default(false).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active', 'achieved', 'paused', 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 38. Mentor Sessions Table
export const mentorSessions = pgTable('mentor_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  reply: text('reply').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 39. Workspace Projects Table
export const workspaceProjects = pgTable('workspace_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 40. Workspace Tasks Table
export const workspaceTasks = pgTable('workspace_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => workspaceProjects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('todo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 41. Workspace Notes Table
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 42. Knowledge Base Table
export const knowledgeBase = pgTable('knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).default('General').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 43. API Keys Table
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  keyHash: text('key_hash').notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  scopes: jsonb('scopes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 44. Webhook Subscriptions Table
export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  events: jsonb('events').notNull(),
  secret: varchar('secret', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 45. API Usage Logs Table
export const apiUsage = pgTable('api_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  statusCode: integer('status_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 46. AI Agents Table
export const aiAgents = pgTable('ai_agents', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  role: text('role').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 47. Agent Runs Table
export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
});

// 48. Agent Outputs Table
export const agentOutputs = pgTable('agent_outputs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  agentId: varchar('agent_id', { length: 50 }).references(() => aiAgents.id, { onDelete: 'cascade' }).notNull(),
  output: jsonb('output').notNull(),
  status: varchar('status', { length: 20 }).default('completed').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 49. Agent Memory Table
export const agentMemory = pgTable('agent_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }),
  memoryKey: varchar('memory_key', { length: 100 }).notNull(),
  memoryValue: jsonb('memory_value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 50. Agent Logs Table
export const agentLogs = pgTable('agent_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  agentId: varchar('agent_id', { length: 50 }).references(() => aiAgents.id, { onDelete: 'cascade' }).notNull(),
  logLevel: varchar('log_level', { length: 10 }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 51. Agent Metrics Table
export const agentMetrics = pgTable('agent_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  agentId: varchar('agent_id', { length: 50 }).references(() => aiAgents.id, { onDelete: 'cascade' }).notNull(),
  executionTimeMs: integer('execution_time_ms').notNull(),
  tokensUsed: integer('tokens_used').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 52. Agent Feedback Table
export const agentFeedback = pgTable('agent_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  outputId: uuid('output_id').references(() => agentOutputs.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 53. Graph Nodes Table
export const graphNodes = pgTable('graph_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'developer', 'repository', 'skill', 'technology', 'challenge', 'company'
  label: varchar('label', { length: 255 }).notNull(),
  properties: jsonb('properties').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 54. Graph Edges Table
export const graphEdges = pgTable('graph_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceNodeId: uuid('source_node_id').references(() => graphNodes.id, { onDelete: 'cascade' }).notNull(),
  targetNodeId: uuid('target_node_id').references(() => graphNodes.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'knows', 'contributed_to', 'completed', 'works_at', 'collaborates_with'
  properties: jsonb('properties').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 55. Skill Evolution History Table
export const skillEvolutionHistory = pgTable('skill_evolution_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  level: integer('level').notNull(),
  confidence: integer('confidence').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// 56. Activity Events Table
export const activityEvents = pgTable('activity_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'commit', 'release', 'pull_request', 'documentation'
  repositoryName: varchar('repository_name', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 57. Engineering Timeline Table
export const engineeringTimeline = pgTable('engineering_timeline', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  eventClass: varchar('event_class', { length: 50 }).notNull(), // 'milestone', 'achievement', 'contribution', 'skill_change'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 58. AI Opportunities / Recommendations Table
export const recommendations = pgTable('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'job', 'project', 'mentor', 'challenge', 'resource'
  itemId: varchar('item_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  reasoning: text('reasoning').notNull(),
  score: integer('score').notNull(), // relevancy index 0-100
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 59. Reputation Scores Table
export const reputationScores = pgTable('reputation_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  engineering: integer('engineering').default(0).notNull(),
  community: integer('community').default(0).notNull(),
  mentorship: integer('mentorship').default(0).notNull(),
  openSource: integer('open_source').default(0).notNull(),
  learning: integer('learning').default(0).notNull(),
  challenge: integer('challenge').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 60. Privacy Settings Table
export const privacySettings = pgTable('privacy_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  publicRepos: boolean('public_repos').default(true).notNull(),
  privateRepos: boolean('private_repos').default(false).notNull(),
  visibleSkills: jsonb('visible_skills').notNull(),
  visibleActivity: boolean('visible_activity').default(true).notNull(),
  profileVisibility: varchar('profile_visibility', { length: 20 }).default('public').notNull(),
  companyVisibility: varchar('company_visibility', { length: 20 }).default('public').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 61. Cloud Workspaces Table
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 62. Execution Jobs Table
export const executionJobs = pgTable('execution_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  language: varchar('language', { length: 50 }).notNull(),
  command: text('command').notNull(),
  exitCode: integer('exit_code'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 63. Builds Table
export const builds = pgTable('builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  commitHash: varchar('commit_hash', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 64. Deployments Table
export const deployments = pgTable('deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  platform: varchar('platform', { length: 50 }).notNull(), // 'vercel' | 'netlify' | 'cloudflare'
  deploymentUrl: text('deployment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 65. Artifacts Table
export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'build_bundle' | 'test_report' | 'coverage_report'
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  meta: jsonb('meta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 66. Runtime Logs Table
export const runtimeLogs = pgTable('runtime_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => executionJobs.id, { onDelete: 'cascade' }).notNull(),
  stream: varchar('stream', { length: 10 }).notNull(), // 'stdout' | 'stderr'
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 67. Workspace Members Table
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('owner').notNull(), // 'owner' | 'collaborator'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 68. Resource Usage Table
export const resourceUsage = pgTable('resource_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  cpuShares: integer('cpu_shares').notNull(),
  memoryBytes: bigint('memory_bytes', { mode: 'number' }).notNull(),
  durationSec: integer('duration_sec').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 69. Organizations Table
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'company' | 'bootcamp' | 'partner'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 70. Institutions Table
export const institutions = pgTable('institutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'academic' | 'vocational'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 71. Verification Requests Table
export const verificationRequests = pgTable('verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  partnerId: uuid('partner_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  requestedData: jsonb('requested_data').notNull(), // array of strings (e.g. ['skills', 'trust'])
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 72. Evidenced Certificates Table
export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  evidenceRepoUrl: text('evidence_repo_url').notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

// 73. Partner Integrations Table
export const partnerIntegrations = pgTable('partner_integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'github' | 'vscode' | 'slack'
  token: text('token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 74. Passport Exports Table
export const passportExports = pgTable('passport_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  format: varchar('format', { length: 10 }).notNull(), // 'pdf' | 'json'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 75. Organization Members Table
export const organizationMembers = pgTable('organization_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(), // 'admin' | 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 76. Challenge Events Table
export const challengeEvents = pgTable('challenge_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  rules: text('rules'),
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'ended'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 77. Developer Capability Cards (DCC) Table
export const developerCapabilityCards = pgTable('developer_capability_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  overallScore: integer('overall_score').default(0).notNull(),
  level: varchar('level', { length: 50 }).default('Explorer').notNull(), // 'Explorer' | 'Builder' | 'Elite' etc.
  summary: text('summary'),
  verificationStatus: varchar('verification_status', { length: 50 }).default('unverified').notNull(), // 'verified' | 'unverified'
  confidenceScore: integer('confidence_score').default(0).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// 78. Capability Dimensions Table
export const capabilityDimensions = pgTable('capability_dimensions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').references(() => developerCapabilityCards.id, { onDelete: 'cascade' }).notNull().unique(),
  engineering: jsonb('engineering').notNull(), // codeQuality, architecture, security, performance, testing, documentation
  skills: jsonb('skills').notNull(), // languages, frameworks, databases, devops, cloud, aiMl, mobile, web
  projects: jsonb('projects').notNull(), // quality, complexity, openSource, buildSuccess, deployments, diversity
  collaboration: jsonb('collaboration').notNull(), // pullRequests, codeReviews, mentoring, discussions, teamwork, community
  growth: jsonb('growth').notNull(), // velocity, consistency, expansion, activity, milestones
  career: jsonb('career').notNull(), // readiness, roleRecommendations, strengths, weaknesses
});

// 79. Capability History Table
export const capabilityHistory = pgTable('capability_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  overallScore: integer('overall_score').notNull(),
  level: varchar('level', { length: 50 }).notNull(),
  changeType: varchar('change_type', { length: 50 }).default('score_update').notNull(), // 'skill_verified' | 'skill_strengthened' | 'dimension_improved' | 'repo_analyzed' | 'level_promoted' | 'score_update'
  title: varchar('title', { length: 255 }),
  description: text('description'),
  skillName: varchar('skill_name', { length: 100 }),
  dimension: varchar('dimension', { length: 50 }),
  previousValue: varchar('previous_value', { length: 100 }),
  newValue: varchar('new_value', { length: 100 }),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'set null' }),
  evidenceRepo: varchar('evidence_repo', { length: 255 }),
  evidenceReference: text('evidence_reference'),
  isPublic: boolean('is_public').default(true).notNull(),
  metadata: jsonb('metadata'),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
});

// 80. Capability Levels Table
export const capabilityLevels = pgTable('capability_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  levelName: varchar('level_name', { length: 50 }).notNull().unique(),
  minScore: integer('min_score').notNull(),
  badgeUrl: text('badge_url'),
  achievementsRequired: jsonb('achievements_required'), // array of strings
});

// 81. Capability Insights Table
export const capabilityInsights = pgTable('capability_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  strengths: jsonb('strengths').notNull(), // array of strings
  weaknesses: jsonb('weaknesses').notNull(), // array of strings
  learningSuggestions: jsonb('learning_suggestions').notNull(), // array of objects
  advice: text('advice'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 82. Verification Evidence Table (Phase 29 Integrity Engine)
export const verificationEvidence = pgTable('verification_evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  dimension: varchar('dimension', { length: 50 }).notNull(), // 'engineering', 'skills', 'projects', etc.
  sourceRepo: varchar('source_repo', { length: 255 }).notNull(),
  verificationMethod: varchar('verification_method', { length: 100 }).notNull(), // 'AI Agent Audit' | 'CI Build Pipeline'
  confidence: integer('confidence').notNull(),
  freshnessState: varchar('freshness_state', { length: 50 }).default('current').notNull(), // 'current' | 'aging' | 'stale'
  evidenceWeight: varchar('evidence_weight', { length: 50 }).default('moderate').notNull(), // 'strong' | 'moderate' | 'weak'
  sourceIdentifier: varchar('source_identifier', { length: 255 }),
  lastAuditedAt: timestamp('last_audited_at').defaultNow().notNull(),
  verifiedAt: timestamp('verified_at').defaultNow().notNull(),
});

// 83. Comparison Cache Table
export const comparisonCache = pgTable('comparison_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId1: uuid('user_id_1').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  userId2: uuid('user_id_2').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  comparisonData: jsonb('comparison_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 84. Contribution Activities Table (Phase 27 Contribution Intelligence)
export const contributionActivities = pgTable('contribution_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'set null' }),
  repositoryName: varchar('repository_name', { length: 255 }).notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // 'commit' | 'pull_request' | 'issue' | 'code_review' | 'release'
  sourceId: varchar('source_id', { length: 255 }).notNull(), // commit sha, PR number, issue id
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  activityDate: timestamp('activity_date').defaultNow().notNull(),
  metadata: jsonb('metadata'),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 85. Developer Capabilities Table (Phase 28 Skill Intelligence & Capability Mapping)
export const developerCapabilities = pgTable('developer_capabilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  capabilityName: varchar('capability_name', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  level: varchar('level', { length: 50 }).notNull(), // 'Strong' | 'Proficient' | 'Developing' | 'Emerging'
  verificationState: varchar('verification_state', { length: 50 }).notNull(), // 'verified' | 'supported' | 'detected' | 'insufficient_evidence'
  confidenceScore: integer('confidence_score').default(0).notNull(),
  analyzedProjectsCount: integer('analyzed_projects_count').default(0).notNull(),
  supportingSkills: jsonb('supporting_skills'), // array of string skill names
  whyExplanation: text('why_explanation'),
  evidenceRepos: jsonb('evidence_repos'), // array of repo names
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 86. Company Members Table (Phase 30 Company & Recruiter Workspace)
export const companyMembers = pgTable('company_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('recruiter').notNull(), // 'company_admin' | 'recruiter'
  status: varchar('status', { length: 50 }).default('active').notNull(), // 'active' | 'invited' | 'suspended'
  invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// 87. Saved Developers Table (Phase 30 Company & Recruiter Workspace)
export const savedDevelopers = pgTable('saved_developers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  recruiterId: uuid('recruiter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  developerUserId: uuid('developer_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notes: text('notes'),
  tags: jsonb('tags'), // array of string tags
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 88. Recruiter Private Notes Table (Phase 30 Company & Recruiter Workspace)
export const recruiterNotes = pgTable('recruiter_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  recruiterId: uuid('recruiter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  developerUserId: uuid('developer_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isPrivate: boolean('is_private').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 89. Recently Viewed Developers Table (Phase 30 Company & Recruiter Workspace)
export const recentlyViewedDevelopers = pgTable('recently_viewed_developers', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  recruiterId: uuid('recruiter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  developerUserId: uuid('developer_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
});

// 90. Saved Opportunities Table (Phase 31 Job & Opportunity Engine)
export const savedOpportunities = pgTable('saved_opportunities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  opportunityId: uuid('opportunity_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 91. Learning Roadmaps Table (Phase 35 AI Career & Learning Intelligence)
export const learningRoadmaps = pgTable('learning_roadmaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  goalId: uuid('goal_id').references(() => careerGoals.id, { onDelete: 'set null' }),
  targetRole: varchar('target_role', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  overviewSummary: text('overview_summary'),
  overallFitPercent: integer('overall_fit_percent').default(0).notNull(),
  readinessTier: varchar('readiness_tier', { length: 50 }).default('Developing').notNull(),
  stages: jsonb('stages').notNull(), // Array of RoadmapStage objects
  stateHash: varchar('state_hash', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const careerRoadmaps = learningRoadmaps;

// 92. Learning Tasks Table (Phase 35 Actionable Daily/Weekly/Monthly Tasks)
export const learningTasks = pgTable('learning_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  goalId: uuid('goal_id').references(() => careerGoals.id, { onDelete: 'set null' }),
  roadmapId: uuid('roadmap_id'),
  stageNumber: integer('stage_number').default(1).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  cadence: varchar('cadence', { length: 20 }).default('daily').notNull(), // 'daily' | 'weekly' | 'monthly'
  taskType: varchar('task_type', { length: 50 }).default('skill_practice').notNull(), // 'skill_practice' | 'project_build' | 'challenge' | 'architecture_study'
  targetSkill: varchar('target_skill', { length: 100 }),
  targetCapability: varchar('target_capability', { length: 100 }),
  status: varchar('status', { length: 20 }).default('todo').notNull(), // 'todo' | 'in_progress' | 'completed'
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 93. Career Recommendations Cache Table (Phase 35 AI & Structured Recs Cache)
export const careerRecommendationsCache = pgTable('career_recommendations_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetRole: varchar('target_role', { length: 100 }).notNull(),
  roleFitData: jsonb('role_fit_data'),
  gapsData: jsonb('gaps_data'),
  projectRecs: jsonb('project_recs'),
  challengeRecs: jsonb('challenge_recs'),
  opportunityRecs: jsonb('opportunity_recs'),
  aiGuidance: jsonb('ai_guidance'),
  stateHash: varchar('state_hash', { length: 100 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});









