import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { subscriptionPlans, userSubscriptions, stripeEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const seedPlans = async (db: any) => {
  const existingPlans = await db.select().from(subscriptionPlans).limit(1);
  if (existingPlans.length > 0) return;

  const plans = [
    {
      name: "free",
      displayName: "Free",
      description: "Perfect for getting started",
      price: 0,
      billingPeriod: "monthly",
      stripePriceId: null,
      maxCards: 1,
      maxContacts: 100,
      hasAnalytics: 0,
      hasWorkflows: 0,
      hasEmailCampaigns: 0,
      hasTeamMembers: 0,
    },
    {
      name: "pro",
      displayName: "Pro",
      description: "For professionals & small teams",
      price: 2999,
      billingPeriod: "monthly",
      stripePriceId: "price_1TSi1JBATw35oVyzr1Jf8eiN",
      maxCards: 5,
      maxContacts: 1000,
      hasAnalytics: 1,
      hasWorkflows: 1,
      hasEmailCampaigns: 1,
      hasTeamMembers: 0,
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      description: "For large teams & organizations",
      price: 9999,
      billingPeriod: "monthly",
      stripePriceId: "price_1TSi2pBATw35oVyzpwZXdBOk",
      maxCards: 999,
      maxContacts: 999999,
      hasAnalytics: 1,
      hasWorkflows: 1,
      hasEmailCampaigns: 1,
      hasTeamMembers: 1,
    },
  ];

  await db.insert(subscriptionPlans).values(plans);
};

export const subscriptionRouter = router({
  getPlans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await seedPlans(db);
    return db.select().from(subscriptionPlans).orderBy(subscriptionPlans.id);
  }),

  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await seedPlans(db);

    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (!subscription[0]) {
      const freePlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, "free"))
        .limit(1);
      return { subscription: null, plan: freePlan[0] };
    }

    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription[0].planId))
      .limit(1);

    return { subscription: subscription[0], plan: plan[0] };
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        billingPeriod: z.enum(["monthly", "yearly"]).optional().default("monthly"),
        savePaymentMethod: z.number().optional().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await seedPlans(db);

      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      if (!plan[0]) {
        throw new Error("Plan not found");
      }

      if (plan[0].price === 0) {
        const existingSub = await db
          .select()
          .from(userSubscriptions)
          .where(eq(userSubscriptions.userId, ctx.user.id))
          .limit(1);

        if (existingSub[0]) {
          await db
            .update(userSubscriptions)
            .set({ planId: input.planId, status: "active" as const })
            .where(eq(userSubscriptions.userId, ctx.user.id));
        } else {
          await db.insert(userSubscriptions).values({
            userId: ctx.user.id,
            planId: input.planId,
            status: "active" as const,
            stripeCustomerId: undefined,
            stripeSubscriptionId: undefined,
          });
        }
        return { checkoutUrl: null, success: true };
      }

      let userSub = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id))
        .limit(1);

      let customerId: string | undefined = (userSub[0]?.stripeCustomerId as string | undefined) || undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email || "",
          metadata: {
            userId: ctx.user.id.toString(),
          },
        });
        customerId = (customer.id || "") as string;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId || undefined,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan[0].stripePriceId || "",
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.VITE_FRONTEND_URL || "http://localhost:5173"}/pricing?success=true&savePaymentMethod=${input.savePaymentMethod}`,
        cancel_url: `${process.env.VITE_FRONTEND_URL || "http://localhost:5173"}/pricing?canceled=true`,
        metadata: {
          userId: ctx.user.id.toString(),
          planId: input.planId.toString(),
          savePaymentMethod: input.savePaymentMethod ? "true" : "false",
        },
      });

      return { checkoutUrl: session.url, success: true };
    }),

  upgradeSubscription: protectedProcedure
    .input(z.object({ newPlanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const currentSub = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id))
        .limit(1);

      if (!currentSub[0]?.stripeSubscriptionId) {
        throw new Error("No active subscription found");
      }

      const newPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.newPlanId))
        .limit(1);

      if (!newPlan[0]) {
        throw new Error("Plan not found");
      }

      await db
        .update(userSubscriptions)
        .set({ planId: input.newPlanId })
        .where(eq(userSubscriptions.userId, ctx.user.id));

      return { success: true };
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const currentSub = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, ctx.user.id))
      .limit(1);

    if (!currentSub[0]?.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    await db
      .update(userSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
      })
      .where(eq(userSubscriptions.userId, ctx.user.id));

    return { success: true };
  }),

  handleWebhook: publicProcedure
    .input(
      z.object({
        event: z.any(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const event = input.event;

      await db.insert(stripeEvents).values({
        stripeEventId: event.id,
        type: event.type,
        data: JSON.stringify(event.data),
        processed: 0,
      });

      return { received: true };
    }),
});
