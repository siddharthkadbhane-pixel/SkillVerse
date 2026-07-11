import { db } from '@/lib/drizzle';
import { repositories, trustHistory, skillHistory, users } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';

export interface TimelineMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'join' | 'repo' | 'trust' | 'skill';
}

export class PassportTimelineService {
  
  // Compiles database chronological events into a developer milestone feed
  static async compileTimelineForUser(userId: string): Promise<TimelineMilestone[]> {
    const feed: TimelineMilestone[] = [];

    // 1. Fetch User Joined Event
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (dbUser) {
      feed.push({
        id: `timeline_join_${dbUser.id}`,
        title: 'Joined SkillVerse Profile',
        description: 'Successfully created profile and authenticated with GitHub OAuth.',
        date: dbUser.createdAt.toISOString(),
        type: 'join',
      });
    }

    // 2. Fetch Connected Repositories
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, userId),
      orderBy: [desc(repositories.createdAt)],
    });

    userRepos.forEach(repo => {
      feed.push({
        id: `timeline_repo_connect_${repo.id}`,
        title: `Connected Repo: "${repo.name}"`,
        description: `Imported repository details from GitHub (Main language: ${repo.language || 'Plain Text'}).`,
        date: repo.createdAt.toISOString(),
        type: 'repo',
      });

      if (repo.isAnalyzed && repo.analyzedAt) {
        feed.push({
          id: `timeline_repo_analysis_${repo.id}`,
          title: `Codebase Telemetry Analysed`,
          description: `Discovered key files list. Static complexity summary stored in database.`,
          date: repo.analyzedAt.toISOString(),
          type: 'repo',
        });
      }
    });

    // 3. Fetch Trust Score Recalculation Logs
    const trustLogs = await db.query.trustHistory.findMany({
      where: eq(trustHistory.userId, userId),
      orderBy: [desc(trustHistory.createdAt)],
      limit: 5,
    });

    trustLogs.forEach(log => {
      feed.push({
        id: `timeline_trust_${log.id}`,
        title: `Trust Score calculated: ${log.overallScore} pts`,
        description: log.explanation || 'Recalculated developer reputation score.',
        date: log.createdAt.toISOString(),
        type: 'trust',
      });
    });

    // 4. Fetch Skill Updates
    const skillLogs = await db.query.skillHistory.findMany({
      where: eq(skillHistory.userId, userId),
      orderBy: [desc(skillHistory.createdAt)],
      limit: 5,
    });

    skillLogs.forEach(log => {
      feed.push({
        id: `timeline_skill_${log.id}`,
        title: `${log.skillName} Proficiency level: ${log.currentLevel}`,
        description: `Level adjusted from ${log.previousLevel} (${log.growthPercent >= 0 ? `+${log.growthPercent}` : log.growthPercent}% growth).`,
        date: log.createdAt.toISOString(),
        type: 'skill',
      });
    });

    // Sort feed chronologically descending
    return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }
}
export default PassportTimelineService;
