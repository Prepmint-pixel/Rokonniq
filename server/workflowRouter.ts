import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  workflows,
  workflowSteps,
  workflowConditions,
  workflowExecutions,
  type InsertWorkflow,
  type InsertWorkflowStep,
  type InsertWorkflowCondition,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { executeWorkflow, triggerWorkflowByEvent } from "./workflowEngine";
import { persistWorkflowStructure, loadWorkflowStructure } from "./workflowPersistence";

export const workflowRouter = router({
  /**
   * Create a new workflow
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        trigger: z.enum([
          "contact_added",
          "contact_status_changed",
          "email_opened",
          "email_clicked",
          "qr_scanned",
          "manual",
        ]),
        triggerConfig: z.record(z.string(), z.any()).optional(),
        nodeData: z.string().optional(),
        edgeData: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(workflows).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        trigger: input.trigger,
        triggerConfig: input.triggerConfig
          ? JSON.stringify(input.triggerConfig)
          : null,
        nodeData: input.nodeData,
        edgeData: input.edgeData,
        isActive: 1,
      });

      return { success: true };
    }),

  /**
   * Update a workflow
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        trigger: z.enum([
          "contact_added",
          "contact_status_changed",
          "email_opened",
          "email_clicked",
          "qr_scanned",
          "manual",
        ]).optional(),
        triggerConfig: z.record(z.string(), z.any()).optional(),
        nodeData: z.string().optional(),
        edgeData: z.string().optional(),
        isActive: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // Verify ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, id), eq(workflows.userId, ctx.user.id)))
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      const updatePayload: any = {};
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.description) updatePayload.description = updateData.description;
      if (updateData.trigger) updatePayload.trigger = updateData.trigger;
      if (updateData.triggerConfig)
        updatePayload.triggerConfig = JSON.stringify(updateData.triggerConfig);
      if (updateData.nodeData) updatePayload.nodeData = updateData.nodeData;
      if (updateData.edgeData) updatePayload.edgeData = updateData.edgeData;
      if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;

      await db.update(workflows).set(updatePayload).where(eq(workflows.id, id));

      return { success: true };
    }),

  /**
   * Get all workflows for the user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userWorkflows = await db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, ctx.user.id));

    return userWorkflows.map((w) => ({
      ...w,
      triggerConfig: w.triggerConfig ? JSON.parse(w.triggerConfig) : null,
      nodeData: w.nodeData ? JSON.parse(w.nodeData) : null,
      edgeData: w.edgeData ? JSON.parse(w.edgeData) : null,
    }));
  }),

  /**
   * Get a specific workflow with its steps
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id))
        )
        .limit(1);

      if (!workflow.length) return null;

      const steps = await db
        .select()
        .from(workflowSteps)
        .where(eq(workflowSteps.workflowId, input.id));

      return {
        ...workflow[0],
        triggerConfig: workflow[0].triggerConfig
          ? JSON.parse(workflow[0].triggerConfig)
          : null,
        nodeData: workflow[0].nodeData ? JSON.parse(workflow[0].nodeData) : null,
        edgeData: workflow[0].edgeData ? JSON.parse(workflow[0].edgeData) : null,
        steps: steps.map((s) => ({
          ...s,
          config: s.config ? JSON.parse(s.config) : null,
        })),
      };
    }),

  /**
   * Delete a workflow
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(and(eq(workflows.id, input.id), eq(workflows.userId, ctx.user.id)))
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      // Delete related steps and conditions
      const steps = await db
        .select()
        .from(workflowSteps)
        .where(eq(workflowSteps.workflowId, input.id));

      for (const step of steps) {
        await db
          .delete(workflowConditions)
          .where(eq(workflowConditions.workflowStepId, step.id));
      }

      await db.delete(workflowSteps).where(eq(workflowSteps.workflowId, input.id));
      await db.delete(workflows).where(eq(workflows.id, input.id));

      return { success: true };
    }),

  /**
   * Add a step to a workflow
   */
  addStep: protectedProcedure
    .input(
      z.object({
        workflowId: z.number(),
        nodeId: z.string(),
        stepType: z.enum([
          "delay",
          "send_email",
          "update_status",
          "add_tag",
          "condition",
          "webhook",
        ]),
        config: z.record(z.string(), z.any()).optional(),
        order: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify workflow ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      const result = await db.insert(workflowSteps).values({
        workflowId: input.workflowId,
        nodeId: input.nodeId,
        stepType: input.stepType,
        config: input.config ? JSON.stringify(input.config) : null,
        order: input.order,
      });

      return { success: true };
    }),

  /**
   * Update a workflow step
   */
  updateStep: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        workflowId: z.number(),
        config: z.record(z.string(), z.any()).optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify workflow ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      const updatePayload: any = {};
      if (input.config) updatePayload.config = JSON.stringify(input.config);
      if (input.order !== undefined) updatePayload.order = input.order;

      await db.update(workflowSteps).set(updatePayload).where(eq(workflowSteps.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a workflow step
   */
  deleteStep: protectedProcedure
    .input(z.object({ id: z.number(), workflowId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify workflow ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      // Delete conditions for this step
      await db
        .delete(workflowConditions)
        .where(eq(workflowConditions.workflowStepId, input.id));

      // Delete the step
      await db.delete(workflowSteps).where(eq(workflowSteps.id, input.id));

      return { success: true };
    }),

  /**
   * Add a condition to a workflow step
   */
  addCondition: protectedProcedure
    .input(
      z.object({
        workflowStepId: z.number(),
        workflowId: z.number(),
        conditionType: z.enum([
          "email_opened",
          "email_clicked",
          "engagement_score",
          "contact_status",
          "time_elapsed",
          "custom_field",
        ]),
        operator: z.string(),
        value: z.unknown().optional(),
        nextStepIdIfTrue: z.number().optional(),
        nextStepIdIfFalse: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify workflow ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      const result = await db.insert(workflowConditions).values({
        workflowStepId: input.workflowStepId,
        conditionType: input.conditionType,
        operator: input.operator,
        value: input.value ? JSON.stringify(input.value) : null,
        nextStepIdIfTrue: input.nextStepIdIfTrue,
        nextStepIdIfFalse: input.nextStepIdIfFalse,
      });

      return { success: true };
    }),

  /**
   * Execute a workflow for a contact
   */
  executeForContact: protectedProcedure
    .input(z.object({ workflowId: z.number(), contactId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify workflow ownership
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) {
        throw new Error("Workflow not found");
      }

      const result = await executeWorkflow(
        input.workflowId,
        input.contactId,
        ctx.user.id
      );

      return result;
    }),

  /**
   * Get execution history for a workflow
   */
  getExecutions: protectedProcedure
    .input(z.object({ workflowId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Verify workflow ownership
      const workflow = await db
        .select()
        .from(workflows)
        .where(
          and(
            eq(workflows.id, input.workflowId),
            eq(workflows.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!workflow.length) return [];

      const executions = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, input.workflowId));

      return executions.map((e) => ({
        ...e,
        executionData: e.executionData ? JSON.parse(e.executionData) : null,
      }));
    }),
});
