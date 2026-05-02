import cron from "node-cron";
import {
  getFailedEmailsForRetry,
  getPendingEmailsFromQueue,
  markEmailAsProcessing,
  removeFromQueue,
  updateEmailDeliveryStatus,
  incrementRetryAttempt,
  getUserDeliveryLogs,
} from "./emailDeliveryDb";
import { sendGmailEmail } from "./gmailIntegration";
import { getGmailCredentials } from "./gmailDb";
import { getDb } from "./db";
import { emailDeliveryLog, emailDeliveryQueue } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Calculate next retry time with exponential backoff
 * 1st retry: 5 minutes
 * 2nd retry: 15 minutes
 * 3rd retry: 1 hour
 */
function getNextRetryTime(attemptCount: number): Date {
  const now = new Date();
  const delays = [5, 15, 60]; // minutes
  const delayMinutes = delays[Math.min(attemptCount, delays.length - 1)];
  return new Date(now.getTime() + delayMinutes * 60 * 1000);
}

/**
 * Process a single email from the queue
 */
export async function processEmailFromQueue(queueId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get queue item
    const queueItems = await db
      .select()
      .from(emailDeliveryQueue)
      .where(eq(emailDeliveryQueue.id, queueId))
      .limit(1);

    if (queueItems.length === 0) return false;

    const queueItem = queueItems[0];

    // Get delivery log
    const deliveryLogs = await db
      .select()
      .from(emailDeliveryLog)
      .where(eq(emailDeliveryLog.id, queueItem.deliveryLogId))
      .limit(1);

    if (deliveryLogs.length === 0) return false;

    const deliveryLog = deliveryLogs[0];

    // Mark as processing
    await markEmailAsProcessing(queueId);

    // Send email via Gmail
    // Get Gmail credentials for user
    const gmailCreds = await getGmailCredentials(deliveryLog.userId);
    if (!gmailCreds) {
      await updateEmailDeliveryStatus(deliveryLog.id, "failed", {
        reason: "Gmail credentials not found",
      });
      await removeFromQueue(queueId);
      return false;
    }

    const result = await sendGmailEmail(
      process.env.GMAIL_CLIENT_ID || "",
      process.env.GMAIL_CLIENT_SECRET || "",
      gmailCreds.email,
      gmailCreds.accessToken,
      gmailCreds.refreshToken,
      deliveryLog.recipientEmail,
      deliveryLog.subject,
      deliveryLog.metadata ? JSON.parse(deliveryLog.metadata).body : ""
    );

    if (result.success) {
      // Update delivery log status
      await updateEmailDeliveryStatus(deliveryLog.id, "sent", {
        gmailMessageId: result.messageId,
        sentAt: new Date().toISOString(),
      });

      // Remove from queue
      await removeFromQueue(queueId);
      return true;
    } else {
      // Handle failure
      const nextRetry = getNextRetryTime(deliveryLog.attemptCount);
      await incrementRetryAttempt(deliveryLog.id, nextRetry);

      if (deliveryLog.attemptCount >= (deliveryLog.maxAttempts || 3)) {
        // Max retries exceeded
        await updateEmailDeliveryStatus(deliveryLog.id, "failed", {
          reason: "Max retry attempts exceeded",
          lastError: result.error,
        });
        await removeFromQueue(queueId);
      } else {
        // Update queue with new retry time
        await db
          .update(emailDeliveryQueue)
          .set({ scheduledFor: nextRetry, isProcessing: 0 })
          .where(eq(emailDeliveryQueue.id, queueId));
      }
      return false;
    }
  } catch (error) {
    console.error("[Email Retry Service] Error processing queue:", error);
    return false;
  }
}

/**
 * Retry failed emails
 */
export async function retryFailedEmails(): Promise<void> {
  try {
    const failedEmails = await getFailedEmailsForRetry(3);

    for (const email of failedEmails) {
      try {
        const nextRetry = getNextRetryTime(email.attemptCount);
        // Get Gmail credentials for user
        const gmailCreds = await getGmailCredentials(email.userId);
        if (!gmailCreds) {
          await updateEmailDeliveryStatus(email.id, "failed", {
            reason: "Gmail credentials not found",
          });
          continue;
        }

        const result = await sendGmailEmail(
          process.env.GMAIL_CLIENT_ID || "",
          process.env.GMAIL_CLIENT_SECRET || "",
          gmailCreds.email,
          gmailCreds.accessToken,
          gmailCreds.refreshToken,
          email.recipientEmail,
          email.subject,
          email.metadata ? JSON.parse(email.metadata).body : ""
        );

        if (result.success) {
          await updateEmailDeliveryStatus(email.id, "sent", {
            gmailMessageId: result.messageId,
            retriedAt: new Date().toISOString(),
          });
        } else {
          await incrementRetryAttempt(email.id, nextRetry);
        }
      } catch (error) {
        console.error(`[Email Retry Service] Error retrying email ${email.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[Email Retry Service] Error in retry process:", error);
  }
}

/**
 * Process pending emails from queue
 */
export async function processPendingEmails(): Promise<void> {
  try {
    const pendingEmails = await getPendingEmailsFromQueue(10);

    for (const queueItem of pendingEmails) {
      await processEmailFromQueue(queueItem.id);
    }
  } catch (error) {
    console.error("[Email Retry Service] Error processing pending emails:", error);
  }
}

/**
 * Initialize email retry scheduler
 * Runs every 5 minutes to process pending and failed emails
 */
export function initializeEmailRetryScheduler(): void {
  console.log("[Email Retry Service] Initializing email retry scheduler...");

  // Process pending emails every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Email Retry Service] Processing pending emails...");
    await processPendingEmails();
  });

  // Retry failed emails every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("[Email Retry Service] Retrying failed emails...");
    await retryFailedEmails();
  });

  console.log("[Email Retry Service] Email retry scheduler initialized");
}

/**
 * Schedule an email for sending
 */
export async function scheduleEmailForSending(
  userId: number,
  deliveryLogId: number,
  scheduledFor: Date,
  priority: number = 0
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(emailDeliveryQueue).values({
    userId,
    deliveryLogId,
    scheduledFor,
    priority,
    isProcessing: 0,
  });
}
