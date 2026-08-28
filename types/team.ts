export type TeamRole = 'owner' | 'member';

export type TeamVisibility = 'public' | 'private';

export type TeamInviteStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface TeamMemberItem {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  developer: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
    dccLevel: string;
    overallScore: number;
    topSkills: string[];
  };
  joinedAt: string;
}

export interface TeamInviteItem {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviteeUserId: string;
  inviteeEmail?: string | null;
  status: TeamInviteStatus;
  createdAt: string;
}

export interface TeamProjectItem {
  id: string;
  teamId: string;
  name: string;
  description?: string | null;
  repositoryUrl: string;
  challengeId?: string | null;
  createdAt: string;
}

export interface TeamTaskItem {
  id: string;
  teamId: string;
  title: string;
  description?: string | null;
  assigneeUserId?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
}

export interface TeamMilestoneItem {
  id: string;
  teamId: string;
  title: string;
  targetDate: string;
  completed: boolean;
  createdAt: string;
}

export interface TeamActivityItem {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  action: string;
  details?: string | null;
  createdAt: string;
}

export interface TeamContributionItem {
  userId: string;
  developerName: string;
  username: string;
  avatarUrl?: string | null;
  commitsCount: number;
  pullRequestsCount: number;
  astReviewedModulesCount: number;
  contributedSkillAreas: string[];
  lastActiveAt: string;
}

export interface TeamItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl?: string | null;
  ownerId: string;
  ownerName: string;
  visibility: TeamVisibility;
  skills: string[];
  membersCount: number;
  projectsCount: number;
  isMember?: boolean;
  userRole?: TeamRole | null;
  members?: TeamMemberItem[];
  projects?: TeamProjectItem[];
  tasks?: TeamTaskItem[];
  milestones?: TeamMilestoneItem[];
  contributions?: TeamContributionItem[];
  createdAt: string;
}

export interface TeamFilter {
  q?: string;
  skill?: string;
  visibility?: TeamVisibility | 'all';
}
