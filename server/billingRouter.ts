import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { billingHistory, userSubscriptions, subscriptionPlans } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const billingRouter = router({
  /**
   * Get current subscription with plan details
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const userSub = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (!userSub[0]) {
      return null;
    }

    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, userSub[0].planId))
      .limit(1);

    return {
      subscription: userSub[0],
      plan: plan[0],
    };
  }),

  /**
   * Get billing history for the user
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    return await db
      .select()
      .from(billingHistory)
      .where(eq(billingHistory.userId, ctx.user.id))
      .orderBy(desc(billingHistory.createdAt));
  }),

  /**
   * Get all subscription plans
   */
  getPlans: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
  }),

  /**
   * Upgrade subscription to a new plan
   */
  upgradeSubscription: protectedProcedure
    .input(z.object({ newPlanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get the new plan
      const newPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.newPlanId))
        .limit(1);

      if (!newPlan[0]) {
        throw new Error("Plan not found");
      }

      // Update user subscription
      await db
        .update(userSubscriptions)
        .set({
          planId: input.newPlanId,
          status: "active" as const,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.userId, ctx.user.id));

      // Create billing record
      await db.insert(billingHistory).values({
        userId: ctx.user.id,
        subscriptionId: input.newPlanId,
        amount: newPlan[0].price,
        currency: "usd",
        status: "paid" as const,
        description: `Upgrade to ${newPlan[0].displayName}`,
        paidAt: new Date(),
      });

      return { success: true, plan: newPlan[0] };
    }),

  /**
   * Cancel subscription (downgrade to free)
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Get free plan
    const freePlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, "free"))
      .limit(1);

    if (!freePlan[0]) {
      throw new Error("Free plan not found");
    }

    // Update user subscription
    await db
      .update(userSubscriptions)
      .set({
        planId: freePlan[0].id,
        status: "canceled" as const,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, ctx.user.id));

    // Create billing record
    await db.insert(billingHistory).values({
      userId: ctx.user.id,
      amount: 0,
      currency: "usd",
      status: "paid" as const,
      description: "Subscription canceled - downgraded to Free plan",
      paidAt: new Date(),
    });

    return { success: true };
  }),

  /**
   * Add billing record (called by Stripe webhook)
   */
  addBillingRecord: protectedProcedure
    .input(
      z.object({
        stripeInvoiceId: z.string(),
        amount: z.number(),
        status: z.enum(["draft", "open", "paid", "void", "uncollectible"]),
        description: z.string().optional(),
        pdfUrl: z.string().optional(),
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
        dueDate: z.date().optional(),
        paidAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Check if invoice already exists
      const existing = await db
        .select()
        .from(billingHistory)
        .where(eq(billingHistory.stripeInvoiceId, input.stripeInvoiceId))
        .limit(1);

      if (existing[0]) {
        return { success: false, message: "Invoice already recorded" };
      }

      await db.insert(billingHistory).values({
        userId: ctx.user.id,
        stripeInvoiceId: input.stripeInvoiceId,
        amount: input.amount,
        currency: "usd",
        status: input.status,
        description: input.description,
        pdfUrl: input.pdfUrl,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        dueDate: input.dueDate,
        paidAt: input.paidAt,
      });

      return { success: true };
    }),
});
