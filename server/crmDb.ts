import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  crmContacts,
  followUps,
  emailTemplates,
  leadPipeline,
  activityLog,
  InsertCrmContact,
  InsertFollowUp,
  InsertEmailTemplate,
  InsertLeadPipeline,
  InsertActivityLog,
} from "../drizzle/schema";

/**
 * Contact Management Queries
 */

export async function createContact(contact: InsertCrmContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(crmContacts).values(contact);
  return result;
}

export async function getContactsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(crmContacts).where(eq(crmContacts.userId, userId));
}

export async function getContactById(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.id, contactId))
    .limit(1);

  return result[0] || null;
}

export async function updateContact(
  contactId: number,
  updates: Partial<InsertCrmContact>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(crmContacts)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(crmContacts.id, contactId));
}

export async function deleteContact(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(crmContacts).where(eq(crmContacts.id, contactId));
}

/**
 * Follow-up Management Queries
 */

export async function createFollowUp(followUp: InsertFollowUp) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(followUps).values(followUp);
}

export async function getFollowUpsByContactId(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(followUps)
    .where(eq(followUps.contactId, contactId))
    .orderBy(desc(followUps.scheduledFor));
}

export async function getScheduledFollowUps(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(followUps)
    .where(
      and(
        eq(followUps.userId, userId),
        eq(followUps.status, "scheduled")
      )
    )
    .orderBy(asc(followUps.scheduledFor));
}

export async function updateFollowUp(
  followUpId: number,
  updates: Partial<InsertFollowUp>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(followUps)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(followUps.id, followUpId));
}

export async function deleteFollowUp(followUpId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(followUps).where(eq(followUps.id, followUpId));
}

/**
 * Email Template Queries
 */

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(emailTemplates).values(template);
}

export async function getEmailTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.userId, userId))
    .orderBy(desc(emailTemplates.createdAt));
}

export async function getEmailTemplateById(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, templateId))
    .limit(1);

  return result[0] || null;
}

export async function updateEmailTemplate(
  templateId: number,
  updates: Partial<InsertEmailTemplate>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(emailTemplates)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(emailTemplates.id, templateId));
}

export async function deleteEmailTemplate(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));
}

/**
 * Lead Pipeline Queries
 */

export async function createLeadPipeline(lead: InsertLeadPipeline) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(leadPipeline).values(lead);
}

export async function getLeadPipelineByContactId(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(leadPipeline)
    .where(eq(leadPipeline.contactId, contactId))
    .limit(1);

  return result[0] || null;
}

export async function getLeadsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(leadPipeline)
    .where(eq(leadPipeline.userId, userId))
    .orderBy(desc(leadPipeline.lastUpdatedAt));
}

export async function updateLeadPipeline(
  leadId: number,
  updates: Partial<InsertLeadPipeline>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(leadPipeline)
    .set({ ...updates, lastUpdatedAt: new Date() })
    .where(eq(leadPipeline.id, leadId));
}

/**
 * Activity Log Queries
 */

export async function logActivity(activity: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(activityLog).values(activity);
}

export async function getActivityByContactId(contactId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.contactId, contactId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

export async function getActivityByUserId(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/**
 * CRM Statistics
 */

export async function getCrmStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const contacts = await db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.userId, userId));

  const leads = await db
    .select()
    .from(leadPipeline)
    .where(eq(leadPipeline.userId, userId));

  const scheduledFollowUps = await db
    .select()
    .from(followUps)
    .where(
      and(
        eq(followUps.userId, userId),
        eq(followUps.status, "scheduled")
      )
    );

  return {
    totalContacts: contacts.length,
    totalLeads: leads.length,
    scheduledFollowUps: scheduledFollowUps.length,
    prospectCount: contacts.filter((c) => c.status === "prospect").length,
    leadCount: contacts.filter((c) => c.status === "lead").length,
    customerCount: contacts.filter((c) => c.status === "customer").length,
  };
}
