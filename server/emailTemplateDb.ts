import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { emailTemplates, InsertEmailTemplate } from "../drizzle/schema";

/**
 * Create a new email template
 */
export async function createEmailTemplate(
  userId: number,
  name: string,
  subject: string,
  body: string,
  variables?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailTemplates).values({
    userId,
    name,
    subject,
    body,
    variables: variables ? JSON.stringify(variables) : null,
  });

  return result;
}

/**
 * Get all email templates for a user
 */
export async function getUserEmailTemplates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const templates = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.userId, userId));

  return templates.map((t) => ({
    ...t,
    variables: t.variables ? JSON.parse(t.variables) : [],
  }));
}

/**
 * Get a single email template
 */
export async function getEmailTemplate(templateId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const template = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, userId)
      )
    )
    .limit(1);

  if (!template.length) return null;

  return {
    ...template[0],
    variables: template[0].variables ? JSON.parse(template[0].variables) : [],
  };
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  templateId: number,
  userId: number,
  updates: {
    name?: string;
    subject?: string;
    body?: string;
    variables?: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.subject) updateData.subject = updates.subject;
  if (updates.body) updateData.body = updates.body;
  if (updates.variables) updateData.variables = JSON.stringify(updates.variables);

  return db
    .update(emailTemplates)
    .set(updateData)
    .where(
      and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, userId)
      )
    );
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplate(templateId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .delete(emailTemplates)
    .where(
      and(
        eq(emailTemplates.id, templateId),
        eq(emailTemplates.userId, userId)
      )
    );
}

/**
 * Get default templates for a user (create if not exist)
 */
export async function getOrCreateDefaultTemplates(userId: number) {
  const existing = await getUserEmailTemplates(userId);

  if (existing.length > 0) {
    return existing;
  }

  // Create default templates
  const defaultTemplates = [
    {
      name: "First Meeting Follow-up",
      subject: "Great meeting you today, {{contactName}}!",
      body: `Hi {{contactName}},

It was great meeting you today at {{eventName}}. I enjoyed our conversation about {{topic}}.

I'd love to continue our discussion and explore how we can work together. Let me know your availability for a quick call next week.

Best regards,
{{senderName}}`,
      variables: ["contactName", "eventName", "topic", "senderName"],
    },
    {
      name: "Proposal Follow-up",
      subject: "Following up on the proposal I sent",
      body: `Hi {{contactName}},

I wanted to follow up on the proposal I sent over on {{proposalDate}}. Do you have any questions or would you like to schedule a time to discuss it further?

I'm confident this solution will help {{company}} achieve {{goal}}.

Looking forward to hearing from you!

Best regards,
{{senderName}}`,
      variables: ["contactName", "proposalDate", "company", "goal", "senderName"],
    },
    {
      name: "Check-in",
      subject: "Just checking in",
      body: `Hi {{contactName}},

I wanted to reach out and see how things are going. I hope you've been well!

I'd love to reconnect and catch up. Let me know if you're available for a quick chat.

Best regards,
{{senderName}}`,
      variables: ["contactName", "senderName"],
    },
    {
      name: "Value-add Follow-up",
      subject: "Thought you'd find this interesting",
      body: `Hi {{contactName}},

I came across {{resource}} and immediately thought of you and your work on {{topic}}.

I think it could be valuable for {{company}}. Check it out and let me know what you think!

Best regards,
{{senderName}}`,
      variables: ["contactName", "resource", "topic", "company", "senderName"],
    },
  ];

  const created = [];
  for (const template of defaultTemplates) {
    await createEmailTemplate(
      userId,
      template.name,
      template.subject,
      template.body,
      template.variables
    );
    created.push(template);
  }

  return created;
}
