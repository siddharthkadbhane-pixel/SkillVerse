import { db } from '@/lib/drizzle';
import { recommendations, graphNodes, graphEdges } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class RecommendationEngineService {

  // Generates customized job, mentor, and learning recommendations using graph relations
  static async generateRecommendations(userId: string): Promise<any[]> {
    try {
      Logger.info(`Compiling recommendations for user: ${userId}`);

      // 1. Fetch skills from Graph
      const nodesList = await db.query.graphNodes.findMany({
        where: eq(graphNodes.userId, userId),
      });

      const skillLabels = nodesList
        .filter(n => n.type === 'skill')
        .map(n => n.label.toLowerCase());

      // Fallback baseline skills if graph empty
      if (skillLabels.length === 0) {
        skillLabels.push('typescript', 'react', 'javascript');
      }

      // Define static mock opportunity catalog
      const opportunityCatalog = [
        { id: 'job-1', type: 'job', title: 'Senior Fullstack Developer (TypeScript & Node)', reqs: ['typescript', 'node', 'react'], company: 'PixelCorp', score: 85, reasoning: 'Highly relevant: your portfolio shows extensive TypeScript and React utilization.' },
        { id: 'job-2', type: 'job', title: 'React UI Engineer', reqs: ['react', 'css'], company: 'ThemeLabs', score: 75, reasoning: 'Matching: React components modularity verified in repositories.' },
        { id: 'job-3', type: 'job', title: 'Python Backend Specialist', reqs: ['python', 'django'], company: 'DataFlow', score: 50, reasoning: 'Alternative path: utilizes Python scripting nodes.' },
        
        { id: 'challenge-1', type: 'challenge', title: 'Next.js 15 Optimization Hackathon', reqs: ['next.js', 'react'], score: 90, reasoning: 'Excellent match: Next.js framework detected in your primary repositories.' },
        { id: 'challenge-2', type: 'challenge', title: 'Vitest Unit Testing Challenge', reqs: ['testing', 'vitest'], score: 80, reasoning: 'Growth recommendation: expand your Vitest and unit testing skills.' },
        
        { id: 'mentor-1', type: 'mentor', title: 'Senior Architect Alpha', reqs: ['typescript', 'architecture'], score: 95, reasoning: 'Recommended mentor: expert in Modular Architecture and component structures.' },
        { id: 'mentor-2', type: 'mentor', title: 'Staff Engineer Beta', reqs: ['testing', 'security'], score: 85, reasoning: 'Recommended mentor: guides on unit testing coverage and secrets validation.' },
      ];

      const matching: any[] = [];

      for (const opp of opportunityCatalog) {
        // Calculate overlap match score
        const matches = opp.reqs.filter(r => skillLabels.includes(r.toLowerCase()));
        if (matches.length > 0) {
          const baseScore = Math.round((matches.length / opp.reqs.length) * 100);
          
          matching.push({
            userId,
            type: opp.type,
            itemId: opp.id,
            title: opp.title,
            reasoning: opp.reasoning,
            score: baseScore,
          });
        }
      }

      // Sort by score descending
      matching.sort((a, b) => b.score - a.score);

      // Clear previous recommendations from DB
      await db.delete(recommendations).where(eq(recommendations.userId, userId));

      // Insert top 5 recommendations
      const insertedList = [];
      for (const m of matching.slice(0, 5)) {
        const [inserted] = await db
          .insert(recommendations)
          .values(m)
          .returning();
        insertedList.push(inserted);
      }

      return insertedList;
    } catch (err) {
      Logger.error('Failed to generate recommendations', err);
      return [];
    }
  }
}

// Helper utility for and conditions imports
import { and } from 'drizzle-orm';
export default RecommendationEngineService;
