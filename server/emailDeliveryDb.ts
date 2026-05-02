import { eq, and, lt, gte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  emailDeliveryLog,
  emailDeliveryQueue,
  emailEngagement,
  type InsertEmailDeliveryLog,
  type InsertEmailDeliveryQueue,
  type InsertEmailEngagement,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Log an email delivery attempt
 */
export async function logEmailDelivery(
  data: InsertEmailDeliveryLog
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailDeliveryLog).values(data);
  return result[0].insertId as number;
}

/**
 * Update email delivery status
 */
export async function updateEmailDeliveryStatus(
  deliveryLogId: number,
  status: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailDeliveryLog)
    .set({
      status: status as any,
      updatedAt: new Date(),
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    })
    .where(eq(emailDeliveryLog.id, deliveryLogId));
}

/**
 * Get delivery logs for a user
 */
export async function getUserDeliveryLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(emailDeliveryLog)
    .where(eq(emailDeliveryLog.userId, userId))
    .orderBy(desc(emailDeliveryLog.createdAt));
}

/**
 * Get delivery logs for a specific follow-up
 */
export async function getFollowUpDeliveryLogs(followUpId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(emailDeliveryLog)
    .where(eq(emailDeliveryLog.followUpId, followUpId))
    .orderBy(desc(emailDeliveryLog.createdAt));
}

/**
 * Get failed emails for retry
 */
export async function getFailedEmailsForRetry(
  maxRetries: number = 3
): Promise<typeof emailDeliveryLog.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  return await db
    .select()
    .from(emailDeliveryLog)
    .where(
      and(
        eq(emailDeliveryLog.status, "failed"),
        lt(emailDeliveryLog.attemptCount, maxRetries),
        gte(emailDeliveryLog.nextRetryAt, now)
      )
    )
    .orderBy(asc(emailDeliveryLog.nextRetryAt));
}

/**
 * Add email to delivery queue
 */
export async function addToDeliveryQueue(
  data: InsertEmailDeliveryQueue
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailDeliveryQueue).values(data);
  return result[0].insertId as number;
}

/**
 * Get pending emails from queue
 */
export async function getPendingEmailsFromQueue(
  limit: number = 10
): Promise<typeof emailDeliveryQueue.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  return await db
    .select()
    .from(emailDeliveryQueue)
    .where(
      and(
        eq(emailDeliveryQueue.isProcessing, 0),
        gte(emailDeliveryQueue.scheduledFor, now)
      )
    )
    .orderBy(asc(emailDeliveryQueue.priority), asc(emailDeliveryQueue.scheduledFor))
    .limit(limit);
}

/**
 * Mark email as processing
 */
export async function markEmailAsProcessing(queueId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(emailDeliveryQueue)
    .set({ isProcessing: 1 })
    .where(eq(emailDeliveryQueue.id, queueId));
}

/**
 * Remove email from queue
 */
export async function removeFromQueue(queueId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(emailDeliveryQueue).where(eq(emailDeliveryQueue.id, queueId));
}

/**
 * Record email engagement (open, click, etc.)
 */
export async function recordEmailEngagement(
  data: InsertEmailEngagement
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailEngagement).values(data);
}

/**
 * Get delivery statistics for a user
 */
export async function getDeliveryStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logs = await db
    .select()
    .from(emailDeliveryLog)
    .where(eq(emailDeliveryLog.userId, userId));

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed").length,
    bounced: logs.filter((l) => l.status === "bounced").length,
    opened: logs.filter((l) => l.status === "opened").length,
    clicked: logs.filter((l) => l.status === "clicked").length,
    pending: logs.filter((l) => l.status === "pending").length,
  };

  return {
    ...stats,
    successRate: stats.total > 0 ? ((stats.sent + stats.opened + stats.clicked) / stats.total * 100).toFixed(2) : 0,
    openRate: stats.sent > 0 ? ((stats.opened + stats.clicked) / stats.sent * 100).toFixed(2) : 0,
  };
}

/**
 * Get engagement metrics for a delivery log
 */
export async function getEngagementMetrics(deliveryLogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(emailEngagement)
    .where(eq(emailEngagement.deliveryLogId, deliveryLogId))
    .orderBy(desc(emailEngagement.timestamp));
}

/**
 * Increment retry attempt count
 */
export async function incrementRetryAttempt(
  deliveryLogId: number,
  nextRetryTime: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const current = await db
    .select()
    .from(emailDeliveryLog)
    .where(eq(emailDeliveryLog.id, deliveryLogId))
    .limit(1);

  if (current.length === 0) return;

  await db
    .update(emailDeliveryLog)
    .set({
      attemptCount: current[0].attemptCount + 1,
      lastAttemptAt: new Date(),
      nextRetryAt: nextRetryTime,
      updatedAt: new Date(),
    })
    .where(eq(emailDeliveryLog.id, deliveryLogId));
}
