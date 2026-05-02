import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createEmailTemplate,
  getUserEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getOrCreateDefaultTemplates,
} from "./emailTemplateDb";
import { scheduleBulkFollowUps, getUserScheduledFollowUps, getFollowUpStats } from "./bulkSchedulingDb";
import { TRPCError } from "@trpc/server";

export const emailTemplateRouter = router({
  /**
   * Get all templates for the user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getUserEmailTemplates(ctx.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch templates",
      });
    }
  }),

  /**
   * Get or create default templates
   */
  getDefaults: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getOrCreateDefaultTemplates(ctx.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get default templates",
      });
    }
  }),

  /**
   * Get a single template
   */
  get: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const template = await getEmailTemplate(input.templateId, ctx.user.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }
        return template;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch template",
        });
      }
    }),

  /**
   * Create a new template
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createEmailTemplate(
          ctx.user.id,
          input.name,
          input.subject,
          input.body,
          input.variables
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  /**
   * Update a template
   */
  update: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        body: z.string().optional(),
        variables: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await updateEmailTemplate(input.templateId, ctx.user.id, {
          name: input.name,
          subject: input.subject,
          body: input.body,
          variables: input.variables,
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update template",
        });
      }
    }),

  /**
   * Delete a template
   */
  delete: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await deleteEmailTemplate(input.templateId, ctx.user.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }
    }),

  /**
   * Schedule bulk follow-ups
   */
  scheduleBulk: protectedProcedure
    .input(
      z.object({
        contactIds: z.array(z.number()).min(1),
        templateId: z.number(),
        delays: z.array(z.number()).min(1),
        templateVariables: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await getEmailTemplate(input.templateId, ctx.user.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        const result = await scheduleBulkFollowUps(ctx.user.id, {
          contactIds: input.contactIds,
          templateId: input.templateId,
          delays: input.delays,
          customSubject: template.subject,
          customBody: template.body,
          templateVariables: input.templateVariables,
        });

        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule follow-ups",
        });
      }
    }),

  /**
   * Get scheduled follow-ups
   */
  getScheduled: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getUserScheduledFollowUps(ctx.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch scheduled follow-ups",
      });
    }
  }),

  /**
   * Get follow-up statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await getFollowUpStats(ctx.user.id);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch follow-up statistics",
      });
    }
  }),
});
