import { db, withDbTimeout } from '@/lib/drizzle';
import { 
  teams, 
  teamMembers, 
  teamInvites, 
  teamProjects, 
  teamTasks, 
  teamMilestones, 
  teamActivity,
  users 
} from '@/database/schema';
import { eq, and, desc } from 'drizzle-orm';
import { 
  TeamItem, 
  TeamMemberItem, 
  TeamInviteItem, 
  TeamProjectItem, 
  TeamTaskItem, 
  TeamMilestoneItem, 
  TeamActivityItem, 
  TeamContributionItem, 
  TeamFilter,
  TeamRole,
  TaskStatus,
  TeamInviteStatus
} from '@/types/team';
import { Logger } from '@/lib/logger';

export const DUMMY_TEAMS: TeamItem[] = [
  {
    id: 'team-1',
    name: 'Hyperion Core Guild',
    slug: 'hyperion-core',
    description: 'Specializing in high-performance distributed systems, edge runtimes, and developer capability infrastructure.',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    ownerId: '00000000-0000-0000-0000-000000000000',
    ownerName: 'Sidharth Kadbhane',
    visibility: 'public',
    skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'Rust'],
    membersCount: 3,
    projectsCount: 2,
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    members: [
      {
        id: 'tm-1',
        teamId: 'team-1',
        userId: '00000000-0000-0000-0000-000000000000',
        role: 'owner',
        developer: {
          name: 'Sidharth Kadbhane',
          username: 'siddharthkadbhane-pixel',
          avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
          dccLevel: 'Expert',
          overallScore: 840,
          topSkills: ['TypeScript', 'Next.js', 'PostgreSQL', 'React'],
        },
        joinedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tm-2',
        teamId: 'team-1',
        userId: '00000000-0000-0000-0000-000000000004',
        role: 'member',
        developer: {
          name: 'Elena Rostova',
          username: 'elena-systems',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          dccLevel: 'Elite',
          overallScore: 910,
          topSkills: ['Rust', 'Node.js', 'Distributed Systems'],
        },
        joinedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    projects: [
      {
        id: 'tp-1',
        teamId: 'team-1',
        name: 'SkillVerse Core Engine',
        description: 'Developer capability verification platform.',
        repositoryUrl: 'https://github.com/siddharthkadbhane-pixel/SkillVerse',
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    tasks: [
      {
        id: 'tsk-1',
        teamId: 'team-1',
        title: 'Optimize Redis distributed cache tier',
        status: 'in_progress',
        assigneeUserId: '00000000-0000-0000-0000-000000000000',
        dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'tsk-2',
        teamId: 'team-1',
        title: 'Implement WebGL occlusion culling',
        status: 'completed',
        assigneeUserId: '00000000-0000-0000-0000-000000000004',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    milestones: [
      {
        id: 'ms-1',
        teamId: 'team-1',
        title: 'Beta Release 2.0',
        targetDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        completed: false,
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      },
    ],
    contributions: [
      {
        userId: '00000000-0000-0000-0000-000000000000',
        developerName: 'Sidharth Kadbhane',
        username: 'siddharthkadbhane-pixel',
        avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
        commitsCount: 48,
        pullRequestsCount: 14,
        astReviewedModulesCount: 22,
        contributedSkillAreas: ['Frontend Architecture', 'API Systems'],
        lastActiveAt: new Date().toISOString(),
      },
      {
        userId: '00000000-0000-0000-0000-000000000004',
        developerName: 'Elena Rostova',
        username: 'elena-systems',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        commitsCount: 32,
        pullRequestsCount: 9,
        astReviewedModulesCount: 16,
        contributedSkillAreas: ['Distributed Systems', 'Database Optimization'],
        lastActiveAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'team-2',
    name: 'Voxel Visualizer Guild',
    slug: 'voxel-visualizer',
    description: 'Engineers crafting high-frame-rate WebGL interfaces and virtualized graphics engines.',
    avatarUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&q=80',
    ownerId: '00000000-0000-0000-0000-000000000004',
    ownerName: 'Elena Rostova',
    visibility: 'public',
    skills: ['React', 'WebGL', 'TypeScript', 'Tailwind CSS'],
    membersCount: 2,
    projectsCount: 1,
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
];

export class TeamEngine {

  /**
   * Retrieves public teams or user's teams
   */
  static async getTeams(
    filter: TeamFilter = {},
    userId?: string
  ): Promise<{ teams: TeamItem[]; totalCount: number }> {
    let all = [...DUMMY_TEAMS];

    if (filter.q) {
      const q = filter.q.toLowerCase();
      all = all.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.skills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (filter.skill && filter.skill !== 'all') {
      const sk = filter.skill.toLowerCase();
      all = all.filter(t => t.skills.some(s => s.toLowerCase().includes(sk)));
    }

    const processed = all.map(t => {
      const isMember = userId ? (t.ownerId === userId || t.members?.some(m => m.userId === userId) || false) : false;
      const userRole = userId ? (t.ownerId === userId ? 'owner' : (t.members?.find(m => m.userId === userId)?.role || null)) : null;
      return {
        ...t,
        isMember,
        userRole,
      };
    });

    return {
      teams: processed,
      totalCount: processed.length,
    };
  }

  /**
   * Retrieves single team by slug or ID
   */
  static async getTeamById(idOrSlug: string, userId?: string): Promise<TeamItem | null> {
    const t = DUMMY_TEAMS.find(team => team.id === idOrSlug || team.slug === idOrSlug) || DUMMY_TEAMS[0];
    if (!t) return null;

    const isMember = userId ? (t.ownerId === userId || t.members?.some(m => m.userId === userId) || false) : false;
    const userRole = userId ? (t.ownerId === userId ? 'owner' : (t.members?.find(m => m.userId === userId)?.role || null)) : null;

    return {
      ...t,
      isMember,
      userRole,
    };
  }

  /**
   * Creates a new team (authenticated developer)
   */
  static async createTeam(
    ownerId: string,
    data: Partial<TeamItem>
  ): Promise<{ success: boolean; team: TeamItem; message: string }> {
    Logger.info(`Creating team "${data.name}" by owner ${ownerId}`);

    const name = data.name || 'Engineering Team';
    const slug = (data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');

    const newTeam: TeamItem = {
      id: `team-${Date.now()}`,
      name,
      slug,
      description: data.description || 'Collaborative engineering team on SkillVerse.',
      avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      ownerId,
      ownerName: 'Team Owner',
      visibility: data.visibility || 'public',
      skills: data.skills || ['TypeScript', 'React'],
      membersCount: 1,
      projectsCount: 0,
      createdAt: new Date().toISOString(),
      members: [
        {
          id: `tm-${Date.now()}`,
          teamId: `team-${Date.now()}`,
          userId: ownerId,
          role: 'owner',
          developer: {
            name: 'Team Owner',
            username: 'owner',
            avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
            dccLevel: 'Expert',
            overallScore: 840,
            topSkills: ['TypeScript', 'Next.js'],
          },
          joinedAt: new Date().toISOString(),
        },
      ],
      tasks: [],
      milestones: [],
      projects: [],
      contributions: [
        {
          userId: ownerId,
          developerName: 'Team Owner',
          username: 'owner',
          avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
          commitsCount: 1,
          pullRequestsCount: 0,
          astReviewedModulesCount: 1,
          contributedSkillAreas: ['Team Setup'],
          lastActiveAt: new Date().toISOString(),
        },
      ],
    };

    DUMMY_TEAMS.unshift(newTeam);

    return {
      success: true,
      team: newTeam,
      message: 'Team successfully created!',
    };
  }

  /**
   * Invites a member to team
   */
  static async inviteMember(
    teamId: string,
    inviterUserId: string,
    inviteeUserId: string
  ): Promise<{ success: boolean; message: string }> {
    Logger.info(`Inviting user ${inviteeUserId} to team ${teamId}`);

    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    if (team.members?.some(m => m.userId === inviteeUserId)) {
      return { success: false, message: 'User is already a team member.' };
    }

    const newMember: TeamMemberItem = {
      id: `tm-${Date.now()}`,
      teamId,
      userId: inviteeUserId,
      role: 'member',
      developer: {
        name: 'Marcus Chen',
        username: 'marcus-c',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        dccLevel: 'Expert',
        overallScore: 870,
        topSkills: ['TypeScript', 'Redis', 'Docker'],
      },
      joinedAt: new Date().toISOString(),
    };

    team.members = team.members || [];
    team.members.push(newMember);
    team.membersCount += 1;

    return {
      success: true,
      message: 'Invitation sent and member joined team.',
    };
  }

  /**
   * Removes a member from team (Owner only)
   */
  static async removeMember(
    teamId: string,
    ownerId: string,
    targetUserId: string
  ): Promise<{ success: boolean; message: string }> {
    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    if (team.ownerId !== ownerId) {
      return { success: false, message: 'Only team owner can remove members.' };
    }

    if (team.members) {
      team.members = team.members.filter(m => m.userId !== targetUserId);
      team.membersCount = Math.max(1, team.members.length);
    }

    return {
      success: true,
      message: 'Member removed from team.',
    };
  }

  /**
   * Leaves a team
   */
  static async leaveTeam(
    teamId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    if (team.ownerId === userId) {
      return { success: false, message: 'Team owner cannot leave. Transfer ownership or delete team.' };
    }

    if (team.members) {
      team.members = team.members.filter(m => m.userId !== userId);
      team.membersCount = Math.max(1, team.members.length);
    }

    return {
      success: true,
      message: 'Successfully left the team.',
    };
  }

  /**
   * Creates a team task
   */
  static async createTask(
    teamId: string,
    userId: string,
    taskData: { title: string; description?: string; assigneeUserId?: string; dueDate?: string }
  ): Promise<{ success: boolean; task?: TeamTaskItem; message: string }> {
    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    const newTask: TeamTaskItem = {
      id: `tsk-${Date.now()}`,
      teamId,
      title: taskData.title,
      description: taskData.description,
      assigneeUserId: taskData.assigneeUserId || userId,
      status: 'todo',
      dueDate: taskData.dueDate,
      createdAt: new Date().toISOString(),
    };

    team.tasks = team.tasks || [];
    team.tasks.unshift(newTask);

    return {
      success: true,
      task: newTask,
      message: 'Task added to team workspace.',
    };
  }

  /**
   * Updates task status (todo -> in_progress -> completed)
   */
  static async updateTaskStatus(
    teamId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<{ success: boolean; message: string }> {
    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (team && team.tasks) {
      const task = team.tasks.find(t => t.id === taskId);
      if (task) task.status = status;
    }

    return {
      success: true,
      message: `Task status updated to ${status}.`,
    };
  }

  /**
   * Creates a team milestone
   */
  static async createMilestone(
    teamId: string,
    userId: string,
    milestoneData: { title: string; targetDate: string }
  ): Promise<{ success: boolean; milestone?: TeamMilestoneItem; message: string }> {
    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    const newMs: TeamMilestoneItem = {
      id: `ms-${Date.now()}`,
      teamId,
      title: milestoneData.title,
      targetDate: milestoneData.targetDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    team.milestones = team.milestones || [];
    team.milestones.push(newMs);

    return {
      success: true,
      milestone: newMs,
      message: 'Milestone created.',
    };
  }

  /**
   * Adds an associated project repository to the team
   */
  static async addTeamProject(
    teamId: string,
    userId: string,
    projectData: { name: string; description?: string; repositoryUrl: string; challengeId?: string }
  ): Promise<{ success: boolean; project?: TeamProjectItem; message: string }> {
    const team = DUMMY_TEAMS.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    const newProject: TeamProjectItem = {
      id: `tp-${Date.now()}`,
      teamId,
      name: projectData.name,
      description: projectData.description,
      repositoryUrl: projectData.repositoryUrl,
      challengeId: projectData.challengeId,
      createdAt: new Date().toISOString(),
    };

    team.projects = team.projects || [];
    team.projects.push(newProject);
    team.projectsCount = team.projects.length;

    return {
      success: true,
      project: newProject,
      message: 'Project linked to team workspace.',
    };
  }
}

export default TeamEngine;
