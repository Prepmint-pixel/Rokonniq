import { getDb } from "./db";
import { followUps, crmContacts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface BulkScheduleOptions {
  contactIds: number[];
  templateId: number;
  delays: number[]; // delays in hours (e.g., [0, 24, 72] for immediate, 1 day, 3 days)
  customSubject?: string;
  customBody?: string;
  templateVariables?: Record<string, string>;
}

/**
 * Schedule bulk follow-ups for multiple contacts
 */
export async function scheduleBulkFollowUps(
  userId: number,
  options: BulkScheduleOptions
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const followUpsToCreate = [];
  const now = new Date();

  // For each contact
  for (const contactId of options.contactIds) {
    // Get contact details
    const contact = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.id, contactId))
      .limit(1);

    if (!contact.length) continue;

    const contactData = contact[0];

    // Create follow-up for each delay
    for (const delayHours of options.delays) {
      const scheduledFor = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

      let subject = options.customSubject || "";
      let body = options.customBody || "";

      // Replace template variables
      if (options.templateVariables) {
        const vars = {
          ...options.templateVariables,
          contactName: contactData.name || "",
          contactEmail: contactData.email || "",
          company: contactData.company || "",
        };

        Object.entries(vars).forEach(([key, value]) => {
          subject = subject.replace(`{{${key}}}`, value);
          body = body.replace(`{{${key}}}`, value);
        });
      }

      followUpsToCreate.push({
        userId,
        contactId,
        templateId: options.templateId,
        subject,
        body,
        scheduledFor,
        status: "scheduled" as const,
      });
    }
  }

  // Batch insert all follow-ups
  if (followUpsToCreate.length > 0) {
    await db.insert(followUps).values(followUpsToCreate);
  }

  return {
    totalScheduled: followUpsToCreate.length,
    contactsCount: options.contactIds.length,
    delaysCount: options.delays.length,
  };
}

/**
 * Get scheduled follow-ups for a user
 */
export async function getUserScheduledFollowUps(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(followUps)
    .where(eq(followUps.userId, userId));
}

/**
 * Get follow-up statistics
 */
export async function getFollowUpStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allFollowUps = await db
    .select()
    .from(followUps)
    .where(eq(followUps.userId, userId));

  const stats = {
    total: allFollowUps.length,
    scheduled: allFollowUps.filter((f) => f.status === "scheduled").length,
    sent: allFollowUps.filter((f) => f.status === "sent").length,
    failed: allFollowUps.filter((f) => f.status === "failed").length,
    cancelled: allFollowUps.filter((f) => f.status === "cancelled").length,
  };

  return stats;
}

/**
 * Cancel all follow-ups for a contact
 */
export async function cancelContactFollowUps(
  userId: number,
  contactId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(followUps)
    .set({ status: "cancelled" })
    .where(
      eq(followUps.userId, userId) && eq(followUps.contactId, contactId)
    );
}

/**
 * Reschedule a follow-up
 */
export async function rescheduleFollowUp(
  followUpId: number,
  userId: number,
  newScheduledDate: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(followUps)
    .set({ scheduledFor: newScheduledDate })
    .where(eq(followUps.id, followUpId) && eq(followUps.userId, userId));
}
