import { db } from '@/lib/drizzle';
import { graphNodes, graphEdges, repositories, reviews, userSkills, activityEvents, engineeringTimeline, privacySettings, reputationScores } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { AgentOrchestratorService } from '../orchestrator/service';
import { Logger } from '@/lib/logger';

export class DeveloperGraphService {

  // Synchronizes the relational graph nodes and edges for a user
  static async syncDeveloperGraph(userId: string): Promise<void> {
    try {
      Logger.info(`Rebuilding Developer Graph for user: ${userId}`);

      // 1. Fetch User Repositories & Reviews
      const reposList = await db.query.repositories.findMany({
        where: eq(repositories.userId, userId),
      });

      const userSkillsList = await db.query.userSkills.findMany({
        where: eq(userSkills.userId, userId),
      });

      // Clear existing graph nodes and edges for this user
      // Cascading references will automatically drop associated edges
      const existingNodes = await db.query.graphNodes.findMany({
        where: eq(graphNodes.userId, userId),
      });

      for (const node of existingNodes) {
        await db.delete(graphNodes).where(eq(graphNodes.id, node.id));
      }

      // 2. Create Core Developer Node
      const [devNode] = await db
        .insert(graphNodes)
        .values({
          userId,
          type: 'developer',
          label: 'Developer Node',
          properties: { timestamp: new Date().toISOString() },
        })
        .returning();

      // 3. Create Repository & Technology Nodes + Edges
      for (const repo of reposList) {
        const [repoNode] = await db
          .insert(graphNodes)
          .values({
            userId,
            type: 'repository',
            label: repo.name,
            properties: {
              fullName: repo.fullName,
              language: repo.language || 'Unknown',
              stars: repo.stars || 0,
            },
          })
          .returning();

        // Edge: developer -> contributed_to -> repository
        await db.insert(graphEdges).values({
          sourceNodeId: devNode.id,
          targetNodeId: repoNode.id,
          type: 'contributed_to',
          properties: { contributionWeight: 80 },
        });

        // Parse skills from review if exist
        const review = await db.query.reviews.findFirst({
          where: eq(reviews.repositoryId, repo.id),
        });

        if (review && review.skillsExtracted) {
          const sks = review.skillsExtracted as any[];
          for (const s of sks) {
            // Check if skill node exists in graph
            let [skNode] = await db
              .insert(graphNodes)
              .values({
                userId,
                type: 'skill',
                label: s.name,
                properties: { category: s.category || 'General' },
              })
              .returning();

            // Edge: developer -> knows -> skill
            await db.insert(graphEdges).values({
              sourceNodeId: devNode.id,
              targetNodeId: skNode.id,
              type: 'knows',
              properties: { level: s.level || 3 },
            });

            // Edge: repository -> utilizes -> skill
            await db.insert(graphEdges).values({
              sourceNodeId: repoNode.id,
              targetNodeId: skNode.id,
              type: 'utilizes',
              properties: {},
            });
          }
        }
      }

      // 4. Ensure default privacy and reputation nodes exist
      const priv = await db.query.privacySettings.findFirst({
        where: eq(privacySettings.userId, userId),
      });
      if (!priv) {
        await db.insert(privacySettings).values({
          userId,
          visibleSkills: [],
        });
      }

      const rep = await db.query.reputationScores.findFirst({
        where: eq(reputationScores.userId, userId),
      });
      if (!rep) {
        await db.insert(reputationScores).values({
          userId,
          engineering: 720,
          community: 650,
          mentorship: 400,
          openSource: 580,
          learning: 800,
          challenge: 500,
        });
      }

      Logger.info(`Developer Graph synchronization complete.`);
    } catch (err) {
      Logger.error(`Failed syncDeveloperGraph`, err);
    }
  }

  // Queue Live activity event (Module 2)
  static async queueEventProcessing(
    userId: string,
    eventType: 'commit' | 'release' | 'pull_request' | 'documentation',
    repositoryName: string,
    payload: any
  ): Promise<void> {
    try {
      // 1. Log activity event
      const [evt] = await db
        .insert(activityEvents)
        .values({
          userId,
          eventType,
          repositoryName,
          payload,
          processed: false,
        })
        .returning();

      // 2. Evaluate if change is meaningful (e.g. commits count changed, README changed)
      const isMeaningful = eventType === 'release' || eventType === 'documentation' || 
        (eventType === 'commit' && (payload.commitCount || 0) % 5 === 0);

      // Log milestone to Engineering Timeline
      await db.insert(engineeringTimeline).values({
        userId,
        eventClass: isMeaningful ? 'milestone' : 'contribution',
        title: `Git Activity: ${eventType.toUpperCase()} in ${repositoryName}`,
        description: payload.message || `Processed live update event for ${repositoryName}`,
      });

      if (isMeaningful) {
        // Retrieve repo ID from DB to run AI agent update
        const repo = await db.query.repositories.findFirst({
          where: and(
            eq(repositories.userId, userId),
            eq(repositories.fullName, repositoryName)
          )
        });

        if (repo) {
          Logger.info(`Live Monitoring: Triggering automatic AI re-analysis for ${repositoryName}`);
          // Trigger orchestrator in background
          setTimeout(async () => {
            try {
              await AgentOrchestratorService.runPipeline(repo.id, userId);
              await db
                .update(activityEvents)
                .set({ processed: true })
                .where(eq(activityEvents.id, evt.id));
            } catch (err) {
              Logger.error(`Failed to auto-process event pipeline`, err);
            }
          }, 100);
        }
      }
    } catch (err) {
      Logger.error('Failed queueEventProcessing', err);
    }
  }
}

export default DeveloperGraphService;
