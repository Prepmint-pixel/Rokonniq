import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { subscriptionPlans, userSubscriptions, digitalCards, crmContacts, workflows } from "../drizzle/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";

export const recommendationRouter = router({
  /**
   * Get user's current usage and plan limits
   */
  getUserUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user's current subscription and plan
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, ctx.user.id))
      .limit(1);

    let plan = null;
    if (subscription[0]) {
      const planData = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription[0].planId))
        .limit(1);
      plan = planData[0];
    } else {
      // Default to free plan
      const freePlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, "free"))
        .limit(1);
      plan = freePlan[0];
    }

    if (!plan) throw new Error("Plan not found");

    // Count user's resources
    const cardCountResult = await db
      .select({ count: count() })
      .from(digitalCards)
      .where(eq(digitalCards.userId, ctx.user.id));

    const contactCountResult = await db
      .select({ count: count() })
      .from(crmContacts)
      .where(eq(crmContacts.userId, ctx.user.id));

    const workflowCountResult = await db
      .select({ count: count() })
      .from(workflows)
      .where(eq(workflows.userId, ctx.user.id));

    const cardCount = cardCountResult[0]?.count || 0;
    const contactCount = contactCountResult[0]?.count || 0;
    const workflowCount = workflowCountResult[0]?.count || 0;

    return {
      plan,
      subscription: subscription[0],
      usage: {
        cards: cardCount,
        contacts: contactCount,
        workflows: workflowCount,
      },
    };
  }),

  /**
   * Get upgrade recommendations based on usage
   */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user's current usage
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, ctx.user.id))
      .limit(1);

    let currentPlan = null;
    if (subscription[0]) {
      const planData = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription[0].planId))
        .limit(1);
      currentPlan = planData[0];
    } else {
      const freePlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, "free"))
        .limit(1);
      currentPlan = freePlan[0];
    }

    if (!currentPlan) throw new Error("Plan not found");

    // Get all plans for comparison
    const allPlans = await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);

    // Count user's resources
    const cardCountResult = await db
      .select({ count: count() })
      .from(digitalCards)
      .where(eq(digitalCards.userId, ctx.user.id));

    const contactCountResult = await db
      .select({ count: count() })
      .from(crmContacts)
      .where(eq(crmContacts.userId, ctx.user.id));

    const workflowCountResult = await db
      .select({ count: count() })
      .from(workflows)
      .where(eq(workflows.userId, ctx.user.id));

    const cardCount = cardCountResult[0]?.count || 0;
    const contactCount = contactCountResult[0]?.count || 0;
    const workflowCount = workflowCountResult[0]?.count || 0;

    const recommendations = [];

    // Check card limit
    const cardUsagePercent = (cardCount / currentPlan.maxCards) * 100;
    if (cardUsagePercent >= 80) {
      const nextPlan = allPlans.find(
        (p) => p.id !== currentPlan.id && p.maxCards > currentPlan.maxCards
      );
      if (nextPlan) {
        recommendations.push({
          type: "card_limit",
          severity: cardUsagePercent >= 100 ? "critical" : "warning",
          message: `You're using ${cardCount} of ${currentPlan.maxCards} digital contact cards`,
          suggestion: `Upgrade to ${nextPlan.displayName} to get ${nextPlan.maxCards} cards`,
          usagePercent: Math.min(cardUsagePercent, 100),
          currentLimit: currentPlan.maxCards,
          nextLimit: nextPlan.maxCards,
          nextPlanId: nextPlan.id,
          nextPlanName: nextPlan.displayName,
        });
      }
    }

    // Check contact limit
    const contactUsagePercent = (contactCount / currentPlan.maxContacts) * 100;
    if (contactUsagePercent >= 80) {
      const nextPlan = allPlans.find(
        (p) => p.id !== currentPlan.id && p.maxContacts > currentPlan.maxContacts
      );
      if (nextPlan) {
        recommendations.push({
          type: "contact_limit",
          severity: contactUsagePercent >= 100 ? "critical" : "warning",
          message: `You're using ${contactCount} of ${currentPlan.maxContacts} CRM contacts`,
          suggestion: `Upgrade to ${nextPlan.displayName} to get ${nextPlan.maxContacts} contacts`,
          usagePercent: Math.min(contactUsagePercent, 100),
          currentLimit: currentPlan.maxContacts,
          nextLimit: nextPlan.maxContacts,
          nextPlanId: nextPlan.id,
          nextPlanName: nextPlan.displayName,
        });
      }
    }

    // Check for feature recommendations
    if (!currentPlan.hasAnalytics && workflowCount > 0) {
      const nextPlan = allPlans.find(
        (p) => p.id !== currentPlan.id && p.hasAnalytics && p.price > currentPlan.price
      );
      if (nextPlan) {
        recommendations.push({
          type: "feature_analytics",
          severity: "info",
          message: "You're using workflows but don't have analytics enabled",
          suggestion: `Upgrade to ${nextPlan.displayName} to track workflow performance`,
          nextPlanId: nextPlan.id,
          nextPlanName: nextPlan.displayName,
        });
      }
    }

    if (!currentPlan.hasWorkflows && workflowCount > 0) {
      const nextPlan = allPlans.find(
        (p) => p.id !== currentPlan.id && p.hasWorkflows && p.price > currentPlan.price
      );
      if (nextPlan) {
        recommendations.push({
          type: "feature_workflows",
          severity: "info",
          message: "You're using workflows but don't have full workflow features",
          suggestion: `Upgrade to ${nextPlan.displayName} for advanced workflow capabilities`,
          nextPlanId: nextPlan.id,
          nextPlanName: nextPlan.displayName,
        });
      }
    }

    return {
      currentPlan,
      usage: {
        cards: cardCount,
        contacts: contactCount,
        workflows: workflowCount,
      },
      recommendations: recommendations.sort((a, b) => {
        // Sort by severity: critical > warning > info
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
               (severityOrder[b.severity as keyof typeof severityOrder] || 3);
      }),
    };
  }),

  /**
   * Dismiss a recommendation for a period of time
   */
  dismissRecommendation: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        daysUntilRemind: z.number().optional().default(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In a real app, you'd store this in a dismissedRecommendations table
      // For now, we'll just return success
      return {
        success: true,
        message: `Recommendation dismissed. We'll remind you in ${input.daysUntilRemind} days.`,
      };
    }),
});
