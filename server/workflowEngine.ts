import { getDb } from "./db";
import {
  workflows,
  workflowExecutions,
  workflowExecutionSteps,
  workflowSteps,
  workflowConditions,
  crmContacts,
  emailDeliveryLog,
  activityLog,
  type Workflow,
  type WorkflowStep,
  type WorkflowExecution,
  type WorkflowExecutionStep,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendPersonalizedEmail } from "./emailSendingService";

export interface WorkflowStepConfig {
  delay?: {
    value: number;
    unit: "minutes" | "hours" | "days";
  };
  email?: {
    templateId?: number;
    subject?: string;
    body?: string;
    useTemplate?: boolean;
  };
  status?: {
    newStatus: string;
  };
  tag?: {
    tagName: string;
  };
  condition?: {
    type: string;
    operator: string;
    value: unknown;
  };
}

export interface WorkflowExecutionContext {
  executionId: number;
  workflowId: number;
  contactId: number;
  userId: number;
  contact: any;
  stepResults: Record<number, any>;
}

/**
 * Calculate delay in milliseconds based on config
 */
export function calculateDelay(config: WorkflowStepConfig["delay"]): number {
  if (!config) return 0;

  const { value, unit } = config;
  const multipliers: Record<string, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 0);
}

/**
 * Evaluate a condition based on contact data and engagement metrics
 */
export async function evaluateCondition(
  condition: any,
  context: WorkflowExecutionContext
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const { conditionType, operator, value } = condition;

  switch (conditionType) {
    case "email_opened": {
      // Check if email was opened
      const engagement = await db
        .select()
        .from(emailDeliveryLog)
        .where(
          and(
            eq(emailDeliveryLog.contactId, context.contactId),
            eq(emailDeliveryLog.status, "opened")
          )
        )
        .limit(1);
      return engagement.length > 0;
    }

    case "email_clicked": {
      // Check if email was clicked
      const engagement = await db
        .select()
        .from(emailDeliveryLog)
        .where(
          and(
            eq(emailDeliveryLog.contactId, context.contactId),
            eq(emailDeliveryLog.status, "clicked")
          )
        )
        .limit(1);
      return engagement.length > 0;
    }

    case "contact_status": {
      // Check contact status
      const contact = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.id, context.contactId))
        .limit(1);

      if (!contact.length) return false;
      return compareValues(contact[0].status, operator, value);
    }

    case "engagement_score": {
      // Calculate engagement score from email metrics
      const logs = await db
        .select()
        .from(emailDeliveryLog)
        .where(eq(emailDeliveryLog.contactId, context.contactId));

      const opens = logs.filter((l: any) => l.status === "opened").length;
      const clicks = logs.filter((l: any) => l.status === "clicked").length;
      const score = opens * 10 + clicks * 20;

      return compareValues(score, operator, value);
    }

    case "time_elapsed": {
      // Check if enough time has elapsed since contact was added
      const contact = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.id, context.contactId))
        .limit(1);

      if (!contact.length) return false;

      const createdTime = new Date(contact[0].createdAt).getTime();
      const elapsedMs = Date.now() - createdTime;
      const valueMs = parseInt(value as string) * 1000; // Assuming value is in seconds

      return compareValues(elapsedMs, operator, valueMs);
    }

    case "custom_field": {
      // Check custom field value (extensible for future use)
      const fieldName = (value as any)?.fieldName;
      const fieldValue = (value as any)?.fieldValue;
      const contactValue = (context.contact as any)?.[fieldName];

      return compareValues(contactValue, operator, fieldValue);
    }

    default:
      return false;
  }
}

/**
 * Compare values using an operator
 */
function compareValues(
  actual: any,
  operator: string,
  expected: any
): boolean {
  switch (operator) {
    case "equals":
      return actual === expected;
    case "not_equals":
      return actual !== expected;
    case "greater_than":
      return actual > expected;
    case "less_than":
      return actual < expected;
    case "greater_than_or_equal":
      return actual >= expected;
    case "less_than_or_equal":
      return actual <= expected;
    case "contains":
      return String(actual).includes(String(expected));
    case "not_contains":
      return !String(actual).includes(String(expected));
    default:
      return false;
  }
}

/**
 * Execute a single workflow step
 */
export async function executeWorkflowStep(
  step: WorkflowStep,
  context: WorkflowExecutionContext
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const config: WorkflowStepConfig = step.config
      ? JSON.parse(step.config)
      : {};

    switch (step.stepType) {
      case "delay": {
        const delayMs = calculateDelay(config.delay);
        // Schedule the next step to run after delay
        return { success: true, result: { delayMs } };
      }

      case "send_email": {
        if (!config.email) {
          return { success: false, error: "Email config missing" };
        }

        const db = await getDb();
        if (!db) return { success: false, error: "Database not available" };

        const contact = context.contact;
        const subject = config.email.subject || "Follow-up";
        const body = config.email.body || "";

        const result = await sendPersonalizedEmail(
          context.userId,
          context.contactId,
          contact,
          subject,
          body
        );

        // Log the email activity
        await db.insert(activityLog).values({
          userId: context.userId,
          contactId: context.contactId,
          activityType: "email_sent",
          description: `Workflow email sent: ${subject}`,
          metadata: JSON.stringify({ stepId: step.id, executionId: context.executionId }),
        });

        return { success: result.success, result };
      }

      case "update_status": {
        if (!config.status) {
          return { success: false, error: "Status config missing" };
        }

        const db = await getDb();
        if (!db) return { success: false, error: "Database not available" };

        await db
          .update(crmContacts)
          .set({ status: config.status.newStatus as any })
          .where(eq(crmContacts.id, context.contactId));

        // Log the status change
        await db.insert(activityLog).values({
          userId: context.userId,
          contactId: context.contactId,
          activityType: "status_changed",
          description: `Status changed to: ${config.status.newStatus}`,
          metadata: JSON.stringify({ stepId: step.id, executionId: context.executionId }),
        });

        return { success: true, result: { newStatus: config.status.newStatus } };
      }

      case "add_tag": {
        if (!config.tag) {
          return { success: false, error: "Tag config missing" };
        }

        const db = await getDb();
        if (!db) return { success: false, error: "Database not available" };

        // TODO: Implement tag system if needed
        // For now, just log it
        await db.insert(activityLog).values({
          userId: context.userId,
          contactId: context.contactId,
          activityType: "note_added",
          description: `Tag added: ${config.tag.tagName}`,
          metadata: JSON.stringify({ stepId: step.id, executionId: context.executionId }),
        });

        return { success: true, result: { tag: config.tag.tagName } };
      }

      case "condition": {
        // Conditions are handled separately in workflow execution
        return { success: true, result: { type: "condition" } };
      }

      case "webhook": {
        // TODO: Implement webhook support
        return { success: true, result: { type: "webhook" } };
      }

      default:
        return { success: false, error: `Unknown step type: ${step.stepType}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute a workflow for a specific contact
 */
export async function executeWorkflow(
  workflowId: number,
  contactId: number,
  userId: number
): Promise<{ success: boolean; executionId?: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    // Get workflow
    const workflowList = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (!workflowList.length) {
      return { success: false, error: "Workflow not found" };
    }

    const workflow = workflowList[0];

    // Get contact
    const contactList = await db
      .select()
      .from(crmContacts)
      .where(eq(crmContacts.id, contactId))
      .limit(1);

    if (!contactList.length) {
      return { success: false, error: "Contact not found" };
    }

    const contact = contactList[0];

    // Create execution record
    const [execution] = await db
      .insert(workflowExecutions)
      .values({
        workflowId,
        contactId,
        userId,
        status: "started",
      });

    const executionId = execution.insertId as number;
    const context: WorkflowExecutionContext = {
      executionId,
      workflowId,
      contactId,
      userId,
      contact,
      stepResults: {},
    };

    // Get all steps for this workflow
    const steps = await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId));

    // Sort steps by order
    steps.sort((a: any, b: any) => a.order - b.order);

    // Execute steps
    let currentStepIndex = 0;
    let shouldContinue = true;

    while (shouldContinue && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];

      // Create execution step record
      const [stepExecution] = await db
        .insert(workflowExecutionSteps)
        .values({
          executionId,
          stepId: step.id,
          status: "executing",
        });

      const stepExecutionId = stepExecution.insertId as number;

      try {
        if (step.stepType === "condition") {
          // Handle conditional branching
          const conditions = await db
            .select()
            .from(workflowConditions)
            .where(eq(workflowConditions.workflowStepId, step.id));

          if (conditions.length > 0) {
            const condition = conditions[0];
            const conditionMet = await evaluateCondition(condition, context);

            const nextStepId = conditionMet
              ? condition.nextStepIdIfTrue
              : condition.nextStepIdIfFalse;

            // Update execution step
            await db
              .update(workflowExecutionSteps)
              .set({
                status: "completed",
                result: JSON.stringify({
                  conditionMet,
                  nextStepId,
                }),
                completedAt: new Date(),
              })
              .where(eq(workflowExecutionSteps.id, stepExecutionId));

            if (nextStepId) {
              // Find the next step by ID
              const nextStepIndex = steps.findIndex((s: any) => s.id === nextStepId);
              if (nextStepIndex !== -1) {
                currentStepIndex = nextStepIndex;
                continue;
              }
            }
          }

          shouldContinue = false;
        } else {
          // Execute regular step
          const result = await executeWorkflowStep(step, context);

          if (result.success) {
            // Update execution step
            await db
              .update(workflowExecutionSteps)
              .set({
                status: "completed",
                result: JSON.stringify(result.result),
                completedAt: new Date(),
              })
              .where(eq(workflowExecutionSteps.id, stepExecutionId));

            context.stepResults[step.id] = result.result;

            // Handle delays
            if (step.stepType === "delay" && result.result?.delayMs) {
              // Schedule next step execution
              // For now, we'll just continue immediately
              // In production, this would be scheduled via a job queue
            }

            currentStepIndex++;
          } else {
            // Step failed
            await db
              .update(workflowExecutionSteps)
              .set({
                status: "failed",
                errorMessage: result.error,
                completedAt: new Date(),
              })
              .where(eq(workflowExecutionSteps.id, stepExecutionId));

            shouldContinue = false;
          }
        }
      } catch (error) {
        await db
          .update(workflowExecutionSteps)
          .set({
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          })
          .where(eq(workflowExecutionSteps.id, stepExecutionId));

        shouldContinue = false;
      }
    }

    // Update execution status
    const finalStatus = shouldContinue ? "completed" : "failed";
    await db
      .update(workflowExecutions)
      .set({
        status: finalStatus as any,
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));

    return { success: true, executionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Trigger workflow based on an event
 */
export async function triggerWorkflowByEvent(
  userId: number,
  triggerType: string,
  contactId: number,
  metadata?: any
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    // Find workflows that match this trigger
    const matchingWorkflows = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.userId, userId),
          eq(workflows.trigger, triggerType as any),
          eq(workflows.isActive, 1)
        )
      );

    // Execute each matching workflow
    for (const workflow of matchingWorkflows) {
      // Check trigger config if needed
      const triggerConfig = workflow.triggerConfig
        ? JSON.parse(workflow.triggerConfig)
        : {};

      // Execute the workflow
      await executeWorkflow(workflow.id, contactId, userId);
    }
  } catch (error) {
    console.error("Error triggering workflow:", error);
  }
}
