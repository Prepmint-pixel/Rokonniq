import cron from "node-cron";
import { getDb } from "./db";
import { followUps } from "../drizzle/schema";
import { eq, lt, and } from "drizzle-orm";
import { sendGmailEmail, parseEmailTemplate } from "./gmailIntegration";
import { getGmailCredentials } from "./gmailDb";

// Store running jobs to prevent duplicates
const runningJobs = new Set<string>();

/**
 * Start email scheduler - runs every minute to check for due follow-ups
 */
export function startEmailScheduler() {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    await processDueFollowUps();
  });

  console.log("[Email Scheduler] Started - checking for due follow-ups every minute");
}

/**
 * Process follow-ups that are due to be sent
 */
async function processDueFollowUps() {
  const db = await getDb();
  if (!db) return;

  try {
    const now = new Date();

    // Find follow-ups that are due and not yet sent
    const dueFollowUps = await db
      .select()
      .from(followUps)
      .where(
        and(
          eq(followUps.status, "scheduled"),
          lt(followUps.scheduledFor, now)
        )
      );

    for (const followUp of dueFollowUps) {
      const jobKey = `followup-${followUp.id}`;

      // Skip if already processing this job
      if (runningJobs.has(jobKey)) continue;

      runningJobs.add(jobKey);

      try {
        await sendFollowUpEmail(followUp);

        // Mark as sent
        await db
          .update(followUps)
          .set({
            status: "sent",
            sentAt: new Date(),
          })
          .where(eq(followUps.id, followUp.id));

        console.log(`[Email Scheduler] Sent follow-up email for follow-up ID: ${followUp.id}`);
      } catch (error) {
        console.error(`[Email Scheduler] Failed to send follow-up ${followUp.id}:`, error);

        // Mark as failed
        await db
          .update(followUps)
          .set({
            status: "failed",
          })
          .where(eq(followUps.id, followUp.id));
      } finally {
        runningJobs.delete(jobKey);
      }
    }
  } catch (error) {
    console.error("[Email Scheduler] Error processing due follow-ups:", error);
  }
}

/**
 * Send a follow-up email
 */
async function sendFollowUpEmail(followUp: any) {
  const gmailCreds = await getGmailCredentials(followUp.userId);

  if (!gmailCreds || !gmailCreds.isConnected) {
    throw new Error("Gmail not connected for this user");
  }

  // Parse email template with variables
  let emailBody = followUp.body;
  
  // Send email via Gmail (Gmail credentials are stored in DB)
  const result = await sendGmailEmail(
    process.env.GMAIL_CLIENT_ID || "",
    process.env.GMAIL_CLIENT_SECRET || "",
    gmailCreds.email,
    gmailCreds.accessToken,
    gmailCreds.refreshToken,
    followUp.contactEmail,
    followUp.subject,
    emailBody
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to send email");
  }

  return result;
}

/**
 * Schedule a follow-up email manually
 */
export async function scheduleFollowUpEmail(
  followUpId: number,
  scheduledFor: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update the follow-up with scheduled date
  await db
    .update(followUps)
    .set({
      scheduledFor,
      status: "scheduled",
    })
    .where(eq(followUps.id, followUpId));
}

/**
 * Cancel a scheduled follow-up
 */
export async function cancelFollowUp(followUpId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(followUps)
    .set({
      status: "cancelled",
    })
    .where(eq(followUps.id, followUpId));
}
