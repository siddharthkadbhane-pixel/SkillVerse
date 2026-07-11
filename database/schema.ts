import { pgTable, uuid, varchar, text, integer, timestamp, boolean, jsonb, primaryKey, pgEnum } from 'drizzle-orm/pg-core';

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
}, (t) => [
  primaryKey({ columns: [t.userId, t.skillId] })
]);

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

// 11. Teams Table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  competitionId: uuid('competition_id').references(() => competitions.id, { onDelete: 'cascade' }).notNull(),
  leaderId: uuid('leader_id').references(() => users.id, { onDelete: 'set null' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Team Members Table
export const teamMembers = pgTable('team_members', {
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.teamId, t.userId] })
]);

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

// 14. Jobs Table
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  requirements: text('requirements'),
  location: varchar('location', { length: 255 }),
  type: jobTypeEnum('type').default('full_time').notNull(),
  salaryRange: varchar('salary_range', { length: 100 }),
  minTrustScore: integer('min_trust_score').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Job Applications Table
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  resumeUrl: text('resume_url'),
  coverLetter: text('cover_letter'),
  status: appStatusEnum('status').default('applied').notNull(),
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

// 27. Challenges Table
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  difficulty: varchar('difficulty', { length: 50 }).default('Medium').notNull(),
  technologies: jsonb('technologies').notNull(),
  timeLimit: varchar('time_limit', { length: 100 }),
  maxParticipants: integer('max_participants'),
  reward: varchar('reward', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 28. Challenge Submissions Table
export const challengeSubmissions = pgTable('challenge_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').references(() => challenges.id, { onDelete: 'cascade' }).notNull(),
  developerId: uuid('developer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repositoryUrl: text('repository_url').notNull(),
  status: varchar('status', { length: 50 }).default('submitted').notNull(),
  score: integer('score').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 29. Challenge Reviews Table
export const challengeReviews = pgTable('challenge_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').references(() => challengeSubmissions.id, { onDelete: 'cascade' }).notNull(),
  codeQuality: integer('code_quality').notNull(),
  security: integer('security').notNull(),
  documentation: integer('documentation').notNull(),
  completeness: integer('completeness').notNull(),
  aiSummary: text('ai_summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 30. Community Posts Table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).default('General').notNull(),
  githubLink: text('github_link'),
  codeSnippet: text('code_snippet'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 31. Post Comments Table
export const postComments = pgTable('post_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 32. Coding Questions Table
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 33. Answers Table
export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isAccepted: boolean('is_accepted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 34. Collaborative Teams Table
export const collabTeams = pgTable('collab_teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 35. Collaborative Team Members Table
export const collabTeamMembers = pgTable('collab_team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => collabTeams.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 36. Peer Reviews Table
export const peerReviews = pgTable('peer_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewerId: uuid('reviewer_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  notes: text('notes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 37. Career Goals Table
export const careerGoals = pgTable('career_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
