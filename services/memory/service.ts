import { db } from '@/lib/drizzle';
import { agentMemory } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { Logger } from '@/lib/logger';

export class SharedMemoryService {
  static async getMemory<T>(userId: string, repositoryId: string | null, key: string): Promise<T | null> {
    try {
      const condition = repositoryId
        ? and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.repositoryId, repositoryId),
            eq(agentMemory.memoryKey, key)
          )
        : and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.memoryKey, key)
          );

      const record = await db.query.agentMemory.findFirst({
        where: condition,
      });

      if (!record) return null;
      return record.memoryValue as T;
    } catch (err) {
      Logger.error(`Failed to read shared memory for key ${key}`, err);
      return null;
    }
  }

  static async setMemory<T>(userId: string, repositoryId: string | null, key: string, value: T): Promise<void> {
    try {
      const condition = repositoryId
        ? and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.repositoryId, repositoryId),
            eq(agentMemory.memoryKey, key)
          )
        : and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.memoryKey, key)
          );

      const existing = await db.query.agentMemory.findFirst({
        where: condition,
      });

      if (existing) {
        await db
          .update(agentMemory)
          .set({
            memoryValue: value as any,
            updatedAt: new Date(),
          })
          .where(eq(agentMemory.id, existing.id));
      } else {
        await db
          .insert(agentMemory)
          .values({
            userId,
            repositoryId: repositoryId || null,
            memoryKey: key,
            memoryValue: value as any,
          });
      }
    } catch (err) {
      Logger.error(`Failed to set shared memory for key ${key}`, err);
    }
  }

  static async clearMemory(userId: string, repositoryId?: string): Promise<void> {
    try {
      const condition = repositoryId
        ? and(
            eq(agentMemory.userId, userId),
            eq(agentMemory.repositoryId, repositoryId)
          )
        : eq(agentMemory.userId, userId);

      await db.delete(agentMemory).where(condition);
      Logger.info(`Cleared shared memory context for user ${userId}`);
    } catch (err) {
      Logger.error(`Failed to clear shared memory`, err);
    }
  }
}

export default SharedMemoryService;
