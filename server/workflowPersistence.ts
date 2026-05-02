import { getDb } from "./db";
import {
  workflowSteps,
  workflowConditions,
  type InsertWorkflowStep,
  type InsertWorkflowCondition,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Parse React Flow nodes and edges to create workflow steps and conditions
 */
export async function persistWorkflowStructure(
  workflowId: number,
  nodes: any[],
  edges: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    // Delete existing steps and conditions for this workflow
    const existingSteps = await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId));

    for (const step of existingSteps) {
      await db
        .delete(workflowConditions)
        .where(eq(workflowConditions.workflowStepId, step.id));
    }

    await db
      .delete(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId));

    // Create workflow steps from nodes
    const stepMap = new Map<string, number>(); // nodeId -> stepId

    for (const node of nodes) {
      if (node.type === "trigger") continue; // Skip trigger node

      const stepType = mapNodeTypeToStepType(node.type);
      if (!stepType) continue;

      try {
        const result = await db.insert(workflowSteps).values({
          workflowId,
          nodeId: node.id,
          stepType: stepType as any,
          config: node.data?.config ? JSON.stringify(node.data.config) : null,
          order: nodes.indexOf(node),
        });

        // Extract insertId from result
        const insertedId = (result as any)?.insertId || (result as any)?.[0]?.insertId;
        if (insertedId) {
          stepMap.set(node.id, insertedId);
        }
      } catch (err) {
        console.error(`Failed to insert step for node ${node.id}:`, err);
      }
    }

    // Create conditions from edges (for branching logic)
    for (const edge of edges) {
      const sourceNodeId = edge.source;
      const targetNodeId = edge.target;
      const sourceStepId = stepMap.get(sourceNodeId);

      if (!sourceStepId) continue;

      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (sourceNode?.type !== "condition") continue;

      const targetStepId = stepMap.get(targetNodeId);
      if (!targetStepId) continue;

      // Determine if this is the "true" or "false" branch based on edge data
      const isTrueBranch = edge.label === "true" || edge.sourceHandle === "true";

      try {
        if (isTrueBranch) {
          // Update the condition with the true branch
          const existingConditions = await db
            .select()
            .from(workflowConditions)
            .where(eq(workflowConditions.workflowStepId, sourceStepId));

          if (existingConditions.length > 0) {
            // Update existing condition
            await db
              .update(workflowConditions)
              .set({ nextStepIdIfTrue: targetStepId })
              .where(eq(workflowConditions.workflowStepId, sourceStepId));
          } else {
            // Create new condition
            await db.insert(workflowConditions).values({
              workflowStepId: sourceStepId,
              conditionType: "email_opened" as any,
              operator: "equals",
              nextStepIdIfTrue: targetStepId,
            });
          }
        } else {
          // Update the false branch
          const existingConditions = await db
            .select()
            .from(workflowConditions)
            .where(eq(workflowConditions.workflowStepId, sourceStepId));

          if (existingConditions.length > 0) {
            await db
              .update(workflowConditions)
              .set({ nextStepIdIfFalse: targetStepId })
              .where(eq(workflowConditions.workflowStepId, sourceStepId));
          } else {
            await db.insert(workflowConditions).values({
              workflowStepId: sourceStepId,
              conditionType: "email_opened" as any,
              operator: "equals",
              nextStepIdIfFalse: targetStepId,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to create condition for edge ${edge.id}:`, err);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Load workflow structure from database and convert to React Flow nodes/edges
 */
export async function loadWorkflowStructure(workflowId: number): Promise<{
  nodes: any[];
  edges: any[];
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { nodes: [], edges: [], error: "Database not available" };

    const steps = await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId));

    const nodes: any[] = [
      {
        id: "trigger-1",
        data: { label: "Trigger", type: "trigger" },
        position: { x: 250, y: 25 },
        type: "trigger",
      },
    ];

    const stepIdToNodeId = new Map<number, string>();
    let yPosition = 150;

    // Create nodes from steps
    for (const step of steps) {
      const nodeId = step.nodeId;
      stepIdToNodeId.set(step.id, nodeId);

      nodes.push({
        id: nodeId,
        data: {
          label: getNodeLabel(step.stepType),
          type: step.stepType,
          config: step.config ? JSON.parse(step.config) : null,
        },
        position: { x: 250, y: yPosition },
        type: mapStepTypeToNodeType(step.stepType),
      });

      yPosition += 100;
    }

    // Create edges from conditions
    const edges: any[] = [];
    for (const step of steps) {
      if (step.stepType !== "condition") continue;

      const conditions = await db
        .select()
        .from(workflowConditions)
        .where(eq(workflowConditions.workflowStepId, step.id));

      for (const condition of conditions) {
        if (condition.nextStepIdIfTrue) {
          const targetNodeId = stepIdToNodeId.get(condition.nextStepIdIfTrue);
          if (targetNodeId) {
            edges.push({
              id: `edge-${step.nodeId}-${targetNodeId}-true`,
              source: step.nodeId,
              target: targetNodeId,
              label: "true",
            });
          }
        }

        if (condition.nextStepIdIfFalse) {
          const targetNodeId = stepIdToNodeId.get(condition.nextStepIdIfFalse);
          if (targetNodeId) {
            edges.push({
              id: `edge-${step.nodeId}-${targetNodeId}-false`,
              source: step.nodeId,
              target: targetNodeId,
              label: "false",
            });
          }
        }
      }
    }

    return { nodes, edges };
  } catch (error) {
    return {
      nodes: [],
      edges: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function mapNodeTypeToStepType(nodeType: string): string | null {
  const mapping: Record<string, string> = {
    delay: "delay",
    email: "send_email",
    condition: "condition",
    status: "update_status",
    tag: "add_tag",
  };
  return mapping[nodeType] || null;
}

function mapStepTypeToNodeType(stepType: string): string {
  const mapping: Record<string, string> = {
    delay: "delay",
    send_email: "email",
    condition: "condition",
    update_status: "status",
    add_tag: "tag",
    webhook: "webhook",
  };
  return mapping[stepType] || "default";
}

function getNodeLabel(stepType: string): string {
  const labels: Record<string, string> = {
    delay: "Delay",
    send_email: "Send Email",
    condition: "Condition",
    update_status: "Update Status",
    add_tag: "Add Tag",
    webhook: "Webhook",
  };
  return labels[stepType] || stepType;
}
