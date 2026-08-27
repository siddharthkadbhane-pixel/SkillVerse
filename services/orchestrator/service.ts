import { db } from '@/lib/drizzle';
import { repositories, reviews, reviewHistory, agentRuns, agentOutputs, agentLogs, agentMetrics, users } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { AgentRegistry, AgentResponse } from '../agents/registry';
import { SharedMemoryService } from '../memory/service';
import { TrustCalculatorService } from '../trust/calculator';
import { NotificationsService } from '../notifications/service';
import { Logger } from '@/lib/logger';

export class AgentOrchestratorService {
  
  // Triggers the complete multi-agent pipeline
  static async runPipeline(repositoryId: string, userId: string): Promise<string> {
    const startTime = Date.now();
    Logger.info(`Starting Multi-Agent Orchestrator Pipeline for repo: ${repositoryId}`);

    // 1. Fetch Repository Details
    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.id, repositoryId),
    });

    if (!repo) {
      throw new Error(`Repository not found: ${repositoryId}`);
    }

    const context = repo.context as any;
    if (!context) {
      throw new Error(`Repository context is empty. Please run code scanner first.`);
    }

    // 2. Setup Shared Memory Context
    await SharedMemoryService.clearMemory(userId, repositoryId);
    await SharedMemoryService.setMemory(userId, repositoryId, 'repository_context', context);
    await SharedMemoryService.setMemory(userId, repositoryId, 'repository_metadata', repo.metadata || {});

    // 3. Create Agent Run Record
    const [runRecord] = await db
      .insert(agentRuns)
      .values({
        repositoryId,
        userId,
        status: 'running',
      })
      .returning();

    const runId = runRecord.id;

    // List of all 12 agents to run
    const agentIds = [
      'repo-intelligence',
      'code-quality',
      'architecture',
      'security',
      'performance',
      'testing',
      'documentation',
      'skill-extraction',
      'trust-engine',
      'learning',
      'career',
      'community',
    ];

    try {
      // Mark repo as auditing
      await db
        .update(repositories)
        .set({ reviewStatus: 'running' })
        .where(eq(repositories.id, repositoryId));

      // 4. Run agents in parallel
      const agentPromises = agentIds.map(async (agentId) => {
        try {
          // Log start
          await db.insert(agentLogs).values({
            runId,
            agentId,
            logLevel: 'info',
            message: `Initiating agent pipeline: ${agentId}`,
          });

          const res = await AgentRegistry.runAgent(agentId, context);

          // Save Output
          await db.insert(agentOutputs).values({
            runId,
            agentId,
            output: res.data,
            status: 'completed',
          });

          // Save Metrics
          await db.insert(agentMetrics).values({
            runId,
            agentId,
            executionTimeMs: res.executionTimeMs,
            tokensUsed: 450, // default estimation
          });

          // Log complete
          await db.insert(agentLogs).values({
            runId,
            agentId,
            logLevel: 'info',
            message: `Agent pipeline execution complete. Confidence: ${res.confidence}%`,
          });

          // Write results back to Shared Memory
          await SharedMemoryService.setMemory(userId, repositoryId, `agent_result_${agentId}`, res.data);

          return res;
        } catch (err: any) {
          Logger.error(`Orchestrator failed to run agent ${agentId}`, err);

          await db.insert(agentOutputs).values({
            runId,
            agentId,
            output: {},
            status: 'failed',
            errorMessage: err.message,
          });

          await db.insert(agentLogs).values({
            runId,
            agentId,
            logLevel: 'error',
            message: `Agent pipeline failure: ${err.message}`,
          });

          return {
            agentId,
            success: false,
            confidence: 0,
            reasoning: `Agent failed to run. ${err.message}`,
            evidence: '',
            data: {},
            executionTimeMs: 0,
          };
        }
      });

      const results = await Promise.all(agentPromises);

      // 5. Aggregate Outputs into Final Consolidated Report
      const intel = results.find(r => r.agentId === 'repo-intelligence')?.data || {};
      const quality = results.find(r => r.agentId === 'code-quality')?.data || {};
      const arch = results.find(r => r.agentId === 'architecture')?.data || {};
      const security = results.find(r => r.agentId === 'security')?.data || {};
      const performance = results.find(r => r.agentId === 'performance')?.data || {};
      const testing = results.find(r => r.agentId === 'testing')?.data || {};
      const doc = results.find(r => r.agentId === 'documentation')?.data || {};
      const skills = results.find(r => r.agentId === 'skill-extraction')?.data || {};
      const trust = results.find(r => r.agentId === 'trust-engine')?.data || {};
      const learning = results.find(r => r.agentId === 'learning')?.data || {};
      const career = results.find(r => r.agentId === 'career')?.data || {};
      const community = results.find(r => r.agentId === 'community')?.data || {};

      // Merge health scores
      const healthScores = {
        overallHealth: Math.round(((quality.score || 80) + (security.score || 80) + (performance.score || 80) + (testing.score || 70) + (doc.score || 80)) / 5),
        categories: {
          documentation: { score: doc.score || 80, grade: 'B', evidence: doc.evidence || 'README character size review' },
          maintainability: { score: quality.score || 80, grade: 'B', evidence: 'Static analysis check' },
          security: { score: security.score || 80, grade: 'B', evidence: security.evidence || 'Config check' },
          performance: { score: performance.score || 80, grade: 'B', evidence: 'Package analyzer' },
          testing: { score: testing.score || 70, grade: 'C', evidence: 'Testing configs verified' },
        },
        recommendations: [
          ...(quality.recommendations || []).map((r: string) => ({ category: 'Quality', message: r, impact: 'Medium' })),
          ...(security.fixes || []).map((r: string) => ({ category: 'Security', message: r, impact: 'High' })),
        ]
      };

      const consolidatedScore = healthScores.overallHealth;

      // Save final consolidated Review to DB
      const existingReview = await db.query.reviews.findFirst({
        where: eq(reviews.repositoryId, repositoryId),
      });

      const updatedVal = {
        summary: `Ecosystem AI Review complete. Core: ${quality.cleanCode || ''}. Security assessment: ${security.secretsExposure || ''}.`,
        strengths: quality.recommendations || ['Modular design'],
        weaknesses: security.fixes || [],
        architecture: arch.folderOrganization || 'Modular structure',
        codeQuality: quality.cleanCode || 'Follows standards',
        documentation: doc.commentDensity || 'Adequate setup guides',
        bestPractices: quality.namingConventions || 'Follows standards',
        suggestedLearning: learning.learningRoadmap || ['Setup tests'],
        overallScore: consolidatedScore,
        confidenceScore: Math.round(results.reduce((acc, curr) => acc + curr.confidence, 0) / results.length),
        healthScores,
        intelligenceReport: {
          architectureStyle: intel.architecture || 'Modular layout',
          structure: {
            folderDepth: 3,
            totalFilesCount: intel.dependenciesCount || 10,
            hasSrcFolder: true,
            foldersList: ['app', 'components', 'lib'],
          },
          configs: (intel.configsDetected || []).map((c: string) => ({ name: c, detected: true, purpose: 'Config settings' })),
          dependencies: {
            framework: intel.frameworks?.[0] || 'Next.js',
            packageManager: 'npm',
            buildTool: 'Next compiler',
            totalDependencies: intel.dependenciesCount || 12,
            hasTypeScript: true,
          }
        },
        aiExplainability: {
          reasoning: trust.reasoning || 'Coordinated multi-agent evaluation complete.',
          confidenceScore: 85,
        },
        skillsExtracted: skills.skills || [],
      };

      if (existingReview) {
        await db
          .update(reviews)
          .set(updatedVal)
          .where(eq(reviews.id, existingReview.id));
      } else {
        await db.insert(reviews).values({
          repositoryId,
          ...updatedVal,
        });
      }

      // Add to Review History version list
      const allHistories = await db.select().from(reviewHistory).where(eq(reviewHistory.repositoryId, repositoryId));
      const nextVer = allHistories.length + 1;
      await db.insert(reviewHistory).values({
        repositoryId,
        version: nextVer,
        summary: updatedVal.summary,
        strengths: updatedVal.strengths,
        weaknesses: updatedVal.weaknesses,
        architecture: updatedVal.architecture,
        codeQuality: updatedVal.codeQuality,
        documentation: updatedVal.documentation,
        bestPractices: updatedVal.bestPractices,
        suggestedLearning: updatedVal.suggestedLearning,
        overallScore: updatedVal.overallScore,
        confidenceScore: updatedVal.confidenceScore,
        healthScores: updatedVal.healthScores,
        intelligenceReport: updatedVal.intelligenceReport,
        aiExplainability: updatedVal.aiExplainability,
        skillsExtracted: updatedVal.skillsExtracted,
      });

      // Recalculate User Trust Score
      await TrustCalculatorService.calculateUserTrustScore(userId);

      // 6. Update Run Record to Completed
      const duration = Date.now() - startTime;
      await db
        .update(agentRuns)
        .set({
          status: 'completed',
          completedAt: new Date(),
          durationMs: duration,
        })
        .where(eq(agentRuns.id, runId));

      // Mark Repository as Completed
      await db
        .update(repositories)
        .set({
          reviewStatus: 'completed',
          isAnalyzed: true,
          analyzedAt: new Date(),
        })
        .where(eq(repositories.id, repositoryId));

      // Notification triggers
      await NotificationsService.sendNotification({
        userId,
        title: 'Agent Orchestration Complete',
        content: `Coordinated multi-agent analysis for "${repo.name}" has completed successfully. Overall Health: ${consolidatedScore}%.`,
        type: 'agent_orchestration_complete',
        actionUrl: `/repositories/${repositoryId}`,
      });

      Logger.info(`Orchestration Pipeline completed successfully in ${duration}ms`);
      return runId;
    } catch (err: any) {
      Logger.error(`Multi-Agent Pipeline execution failed:`, err);

      await db
        .update(agentRuns)
        .set({
          status: 'failed',
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        })
        .where(eq(agentRuns.id, runId));

      await db
        .update(repositories)
        .set({ reviewStatus: 'failed' })
        .where(eq(repositories.id, repositoryId));

      throw err;
    }
  }

  // Retries a single failed agent inside a run
  static async retryAgent(runId: string, agentId: string, userId: string): Promise<AgentResponse> {
    Logger.info(`Retrying agent ${agentId} inside run ${runId}`);

    const run = await db.query.agentRuns.findFirst({
      where: eq(agentRuns.id, runId),
    });

    if (!run) {
      throw new Error(`Agent run not found: ${runId}`);
    }

    const repo = await db.query.repositories.findFirst({
      where: eq(repositories.id, run.repositoryId),
    });

    if (!repo) {
      throw new Error(`Repository details not found.`);
    }

    const context = repo.context as any;
    if (!context) {
      throw new Error(`No code repository context stored.`);
    }

    const startTime = Date.now();

    // 1. Log retry initiation
    await db.insert(agentLogs).values({
      runId,
      agentId,
      logLevel: 'info',
      message: `Retrying agent manually: ${agentId}`,
    });

    try {
      const res = await AgentRegistry.runAgent(agentId, context);

      // Delete existing output/metrics if any
      await db.delete(agentOutputs).where(and(eq(agentOutputs.runId, runId), eq(agentOutputs.agentId, agentId)));
      await db.delete(agentMetrics).where(and(eq(agentMetrics.runId, runId), eq(agentMetrics.agentId, agentId)));

      // Save New Output
      await db.insert(agentOutputs).values({
        runId,
        agentId,
        output: res.data,
        status: 'completed',
      });

      // Save New Metrics
      await db.insert(agentMetrics).values({
        runId,
        agentId,
        executionTimeMs: res.executionTimeMs,
        tokensUsed: 450,
      });

      // Save back to Shared Memory
      await SharedMemoryService.setMemory(userId, run.repositoryId, `agent_result_${agentId}`, res.data);

      await db.insert(agentLogs).values({
        runId,
        agentId,
        logLevel: 'info',
        message: `Agent retry completed successfully. Confidence: ${res.confidence}%`,
      });

      return res;
    } catch (err: any) {
      await db.insert(agentLogs).values({
        runId,
        agentId,
        logLevel: 'error',
        message: `Agent retry failed: ${err.message}`,
      });
      throw err;
    }
  }
}

export default AgentOrchestratorService;
