import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createContact,
  getContactsByUserId,
  getContactById,
  updateContact,
  deleteContact,
  createFollowUp,
  getFollowUpsByContactId,
  getScheduledFollowUps,
  updateFollowUp,
  deleteFollowUp,
  createEmailTemplate,
  getEmailTemplatesByUserId,
  getEmailTemplateById,
  updateEmailTemplate,
  deleteEmailTemplate,
  createLeadPipeline,
  getLeadPipelineByContactId,
  getLeadsByUserId,
  updateLeadPipeline,
  logActivity,
  getActivityByContactId,
  getCrmStats,
} from "./crmDb";

export const crmRouter = router({
  /**
   * Contact Management
   */
  createContact: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createContact({
        userId: ctx.user.id,
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        title: input.title,
        notes: input.notes,
        source: input.source,
        status: "prospect",
      });

      return { success: true };
    }),

  getContacts: protectedProcedure.query(async ({ ctx }) => {
    const contacts = await getContactsByUserId(ctx.user.id);
    return contacts || [];
  }),

  getContact: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const contact = await getContactById(input.contactId);
      return contact || null;
    }),

  updateContact: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        notes: z.string().optional(),
        status: z.enum(["prospect", "lead", "customer", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { contactId, ...updates } = input;
      await updateContact(contactId, updates);

      if (updates.status) {
        await logActivity({
          userId: ctx.user.id,
          contactId,
          activityType: "status_changed",
          description: `Status changed to ${updates.status}`,
        });
      }

      return { success: true };
    }),

  deleteContact: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteContact(input.contactId);
      return { success: true };
    }),

  /**
   * Follow-up Management
   */
  createFollowUp: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        templateId: z.number().optional(),
        subject: z.string().min(1),
        body: z.string().min(1),
        scheduledFor: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createFollowUp({
        userId: ctx.user.id,
        contactId: input.contactId,
        templateId: input.templateId,
        subject: input.subject,
        body: input.body,
        scheduledFor: input.scheduledFor,
        notes: input.notes,
        status: "scheduled",
      });

      await logActivity({
        userId: ctx.user.id,
        contactId: input.contactId,
        activityType: "follow_up_scheduled",
        description: `Follow-up scheduled for ${input.scheduledFor.toLocaleDateString()}`,
      });

      return { success: true };
    }),

  getFollowUpsByContact: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const followUps = await getFollowUpsByContactId(input.contactId);
      return followUps || [];
    }),

  getScheduledFollowUps: protectedProcedure.query(async ({ ctx }) => {
    const followUps = await getScheduledFollowUps(ctx.user.id);
    return followUps || [];
  }),

  updateFollowUp: protectedProcedure
    .input(
      z.object({
        followUpId: z.number(),
        subject: z.string().optional(),
        body: z.string().optional(),
        scheduledFor: z.date().optional(),
        status: z.enum(["scheduled", "sent", "failed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { followUpId, ...updates } = input;
      await updateFollowUp(followUpId, updates);
      return { success: true };
    }),

  deleteFollowUp: protectedProcedure
    .input(z.object({ followUpId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteFollowUp(input.followUpId);
      return { success: true };
    }),

  /**
   * Email Template Management
   */
  createEmailTemplate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        variables: z.array(z.string()).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createEmailTemplate({
        userId: ctx.user.id,
        name: input.name,
        subject: input.subject,
        body: input.body,
        variables: input.variables ? JSON.stringify(input.variables) : null,
        isDefault: input.isDefault ? 1 : 0,
      });
      return { success: true };
    }),

  getEmailTemplates: protectedProcedure.query(async ({ ctx }) => {
    const templates = await getEmailTemplatesByUserId(ctx.user.id);
    return templates || [];
  }),

  getEmailTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const template = await getEmailTemplateById(input.templateId);
      return template || null;
    }),

  updateEmailTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { templateId, variables, ...updates } = input;
      await updateEmailTemplate(templateId, {
        ...updates,
        variables: variables ? JSON.stringify(variables) : undefined,
      });
      return { success: true };
    }),

  deleteEmailTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteEmailTemplate(input.templateId);
      return { success: true };
    }),

  /**
   * Lead Pipeline Management
   */
  convertToLead: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        value: z.number().optional(),
        probability: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update contact status
      await updateContact(input.contactId, { status: "lead" });

      // Create or update lead pipeline
      const existingLead = await getLeadPipelineByContactId(input.contactId);

      if (existingLead) {
        await updateLeadPipeline(existingLead.id, {
          value: input.value,
          probability: input.probability,
        });
      } else {
        await createLeadPipeline({
          userId: ctx.user.id,
          contactId: input.contactId,
          stage: "initial_contact",
          value: input.value,
          probability: input.probability || 0,
        });
      }

      await logActivity({
        userId: ctx.user.id,
        contactId: input.contactId,
        activityType: "status_changed",
        description: "Converted to lead",
      });

      return { success: true };
    }),

  updateLeadStage: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        stage: z.enum([
          "initial_contact",
          "interested",
          "qualified",
          "proposal",
          "negotiation",
          "won",
          "lost",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await getLeadPipelineByContactId(input.contactId);
      if (!lead) throw new Error("Lead not found");

      await updateLeadPipeline(lead.id, {
        stage: input.stage,
        notes: input.notes,
      });

      await logActivity({
        userId: ctx.user.id,
        contactId: input.contactId,
        activityType: "status_changed",
        description: `Lead stage updated to ${input.stage}`,
      });

      return { success: true };
    }),

  getLeads: protectedProcedure.query(async ({ ctx }) => {
    const leads = await getLeadsByUserId(ctx.user.id);
    return leads || [];
  }),

  /**
   * Activity & Statistics
   */
  getContactActivity: protectedProcedure
    .input(z.object({ contactId: z.number() }))
    .query(async ({ input }) => {
      const activity = await getActivityByContactId(input.contactId);
      return activity || [];
    }),

  getCrmStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getCrmStats(ctx.user.id);
    return stats || { totalContacts: 0, totalLeads: 0, scheduledFollowUps: 0, prospectCount: 0, leadCount: 0, customerCount: 0 };
  }),
});
