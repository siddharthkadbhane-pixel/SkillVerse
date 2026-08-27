import { db } from '@/lib/drizzle';
import { repositories } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { RepositoryAnalyzerService } from '@/services/analyzer';
import { AiReviewService } from '@/services/ai';
import { Logger } from '@/lib/logger';

interface Job {
  id: string; // repositoryId
  fullName: string;
  gitToken: string;
  attempt: number;
  maxAttempts: number;
}

export class AnalysisWorker {
  private static queue: Job[] = [];
  private static processing = false;

  static enqueue(repoId: string, fullName: string, gitToken: string, maxAttempts = 3): void {
    // Avoid duplicate jobs in queue
    if (this.queue.some(job => job.id === repoId)) {
      Logger.info(`Job for repository ${fullName} is already in the queue.`);
      return;
    }

    this.queue.push({
      id: repoId,
      fullName,
      gitToken,
      attempt: 1,
      maxAttempts,
    });

    Logger.info(`Enqueued analysis job for ${fullName}. Queue length: ${this.queue.length}`);
    this.processNext();
  }

  private static async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift()!;

    Logger.info(`Processing background job for ${job.fullName} (Attempt ${job.attempt}/${job.maxAttempts})...`);

    try {
      // 1. Mark status as running
      await db
        .update(repositories)
        .set({ reviewStatus: 'running' })
        .where(eq(repositories.id, job.id));

      // 2. Fetch repo files & metadata (Analyzer)
      const { summary, context } = await RepositoryAnalyzerService.runAnalysis(
        job.id,
        job.fullName,
        job.gitToken
      );

      // Save metadata and context
      await db
        .update(repositories)
        .set({
          isAnalyzed: true,
          analyzedAt: new Date(),
          metadata: context.metadata,
          summary,
          context,
          updatedAt: new Date(),
        })
        .where(eq(repositories.id, job.id));

      // 3. Process AI Review & Skills & Trust Scores
      await AiReviewService.processRepositoryReview(job.id, job.gitToken);

      Logger.info(`Job completed successfully for ${job.fullName}`);

      // 4. Update status in db to completed is done inside processRepositoryReview
    } catch (err: any) {
      Logger.error(`Job failed for ${job.fullName}`, err);

      if (job.attempt < job.maxAttempts) {
        job.attempt++;
        // Re-enqueue with retry delay
        Logger.info(`Re-enqueuing job for ${job.fullName} for retry attempt ${job.attempt}`);
        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, 5000); // 5 seconds wait
      } else {
        Logger.error(`Job for ${job.fullName} exceeded maximum retries. Marking failed.`);
        await db
          .update(repositories)
          .set({ reviewStatus: 'failed' })
          .where(eq(repositories.id, job.id));
      }
    } finally {
      this.processing = false;
      // Continue to next job
      this.processNext();
    }
  }

  static getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.processing,
    };
  }
}

export default AnalysisWorker;
