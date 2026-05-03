import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { paymentMethods } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("REPLACE_ME")) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

export const paymentMethodsRouter = router({
  /**
   * Get all payment methods for the user
   */
  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    return await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, ctx.user.id))
      .orderBy(paymentMethods.isDefault);
  }),

  /**
   * Get default payment method
   */
  getDefaultPaymentMethod: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    const result = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, ctx.user.id))
      .limit(1);

    return result[0] || null;
  }),

  /**
   * Add a new payment method
   */
  addPaymentMethod: protectedProcedure
    .input(
      z.object({
        stripePaymentMethodId: z.string(),
        cardBrand: z.string(),
        cardLast4: z.string(),
        cardExpMonth: z.number(),
        cardExpYear: z.number(),
        cardHolderName: z.string().optional(),
        billingAddress: z.unknown().optional(),
        setAsDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // If setting as default, unset other defaults
      if (input.setAsDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: 0 })
          .where(eq(paymentMethods.userId, ctx.user.id));
      }

      const result = await db.insert(paymentMethods).values([{
        userId: ctx.user.id,
        stripePaymentMethodId: input.stripePaymentMethodId,
        cardBrand: input.cardBrand,
        cardLast4: input.cardLast4,
        cardExpMonth: input.cardExpMonth,
        cardExpYear: input.cardExpYear,
        cardHolderName: input.cardHolderName,
        isDefault: input.setAsDefault ? 1 : 0,
        billingAddress: input.billingAddress ? JSON.stringify(input.billingAddress) : null,
      }]);

      return { success: true };
    }),

  /**
   * Set a payment method as default
   */
  setDefaultPaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify the payment method belongs to the user
      const pm = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.paymentMethodId))
        .limit(1);

      if (!pm[0]) {
        throw new Error("Payment method not found");
      }

      // Unset all other defaults
      await db
        .update(paymentMethods)
        .set({ isDefault: 0 })
        .where(eq(paymentMethods.userId, ctx.user.id));

      // Set this one as default
      await db
        .update(paymentMethods)
        .set({ isDefault: 1 })
        .where(eq(paymentMethods.id, input.paymentMethodId));

      return { success: true };
    }),

  /**
   * Delete a payment method
   */
  deletePaymentMethod: protectedProcedure
    .input(z.object({ paymentMethodId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify the payment method belongs to the user
      const pm = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.paymentMethodId))
        .limit(1);

      if (!pm[0]) {
        throw new Error("Payment method not found");
      }

      // Detach from Stripe
      try {
        await getStripe().paymentMethods.detach(pm[0].stripePaymentMethodId);
      } catch (error) {
        console.error("Failed to detach payment method from Stripe:", error);
      }

      // Delete from database
      await db
        .delete(paymentMethods)
        .where(eq(paymentMethods.id, input.paymentMethodId));

      return { success: true };
    }),

  /**
   * Create a setup intent for adding a new payment method
   */
  createSetupIntent: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.email) {
      throw new Error("User email is required");
    }

    try {
      const setupIntent = await getStripe().setupIntents.create({
        payment_method_types: ["card"],
        metadata: {
          userId: ctx.user.id,
          userEmail: ctx.user.email,
        },
      });

      return {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
      };
    } catch (error) {
      console.error("Failed to create setup intent:", error);
      throw new Error("Failed to create setup intent");
    }
  }),

  /**
   * Update payment method billing address
   */
  updatePaymentMethodBillingAddress: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.number(),
        billingAddress: z.unknown(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Verify the payment method belongs to the user
      const pm = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.paymentMethodId))
        .limit(1);

      if (!pm[0]) {
        throw new Error("Payment method not found");
      }

      await db
        .update(paymentMethods)
        .set({
          billingAddress: JSON.stringify(input.billingAddress),
          updatedAt: new Date(),
        })
        .where(eq(paymentMethods.id, input.paymentMethodId));

      return { success: true };
    }),
});
