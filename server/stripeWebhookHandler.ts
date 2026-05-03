import Stripe from "stripe";
import { getDb } from "./db";
import { userSubscriptions, paymentMethods } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("REPLACE_ME")) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
}

/**
 * Handle Stripe webhook events for automatic payment method saving
 */
export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    throw error;
  }
}

/**
 * Handle successful charge - auto-save payment method
 */
async function handleChargeSucceeded(charge: Stripe.Charge) {
    if (!charge.payment_method || !charge.customer) {
    console.log("Charge missing payment method or customer ID");
    return;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Find user subscription by Stripe customer ID
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeCustomerId, charge.customer as string))
      .limit(1);

    if (!subscription[0]) {
      console.log("No subscription found for customer:", charge.customer);
      return;
    }

    const userId = subscription[0].userId;

    // Check if payment method already exists
    const paymentMethodId = typeof charge.payment_method === 'string' ? charge.payment_method : (charge.payment_method as any).id;
    const existingMethod = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.stripePaymentMethodId, paymentMethodId))
      .limit(1);

    if (existingMethod[0]) {
      console.log("Payment method already saved");
      return;
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await getStripe().paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type !== "card" || !paymentMethod.card) {
      console.log("Payment method is not a card");
      return;
    }

    // Save payment method to database
    await db.insert(paymentMethods).values([
      {
        userId,
        stripePaymentMethodId: typeof charge.payment_method === 'string' ? charge.payment_method : (charge.payment_method as any).id,
        cardBrand: paymentMethod.card.brand,
        cardLast4: paymentMethod.card.last4,
        cardExpMonth: paymentMethod.card.exp_month,
        cardExpYear: paymentMethod.card.exp_year,
        cardHolderName: paymentMethod.billing_details?.name || undefined,
        isDefault: 0, // Don't auto-set as default
        billingAddress: paymentMethod.billing_details?.address
          ? JSON.stringify(paymentMethod.billing_details.address)
          : null,
      },
    ]);

    console.log(`Payment method auto-saved for user ${userId}`);
  } catch (error) {
    console.error("Error auto-saving payment method from charge:", error);
    throw error;
  }
}

/**
 * Handle successful payment intent - auto-save payment method
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  if (!paymentIntent.payment_method || !paymentIntent.customer) {
    console.log("Payment intent missing payment method or customer ID");
    return;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Find user subscription by Stripe customer ID
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeCustomerId, paymentIntent.customer as string))
      .limit(1);

    if (!subscription[0]) {
      console.log("No subscription found for customer:", paymentIntent.customer);
      return;
    }

    const userId = subscription[0].userId;
    const paymentMethodId = typeof paymentIntent.payment_method === "string"
      ? paymentIntent.payment_method
      : paymentIntent.payment_method.id;

    // Check if payment method already exists
    const existingMethod = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.stripePaymentMethodId, paymentMethodId))
      .limit(1);

    if (existingMethod[0]) {
      console.log("Payment method already saved");
      return;
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await getStripe().paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type !== "card" || !paymentMethod.card) {
      console.log("Payment method is not a card");
      return;
    }

    // Save payment method to database
    await db.insert(paymentMethods).values([
      {
        userId,
        stripePaymentMethodId: paymentMethodId,
        cardBrand: paymentMethod.card.brand,
        cardLast4: paymentMethod.card.last4,
        cardExpMonth: paymentMethod.card.exp_month,
        cardExpYear: paymentMethod.card.exp_year,
        cardHolderName: paymentMethod.billing_details?.name || undefined,
        isDefault: 0, // Don't auto-set as default
        billingAddress: paymentMethod.billing_details?.address
          ? JSON.stringify(paymentMethod.billing_details.address)
          : null,
      },
    ]);

    console.log(`Payment method auto-saved for user ${userId}`);
  } catch (error) {
    console.error("Error auto-saving payment method from payment intent:", error);
    throw error;
  }
}

/**
 * Handle successful invoice payment - auto-save payment method
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.customer) {
    console.log("Invoice missing customer ID");
    return;
  }

  try {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Find user subscription by Stripe customer ID
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeCustomerId, invoice.customer as string))
      .limit(1);

    if (!subscription[0]) {
      console.log("No subscription found for customer:", invoice.customer);
      return;
    }

    const userId = subscription[0].userId;

    // Retrieve invoice details to get payment intent
    const fullInvoice = await getStripe().invoices.retrieve(invoice.id);
    const paymentIntentId = (fullInvoice as any).payment_intent as string | undefined;
    if (!paymentIntentId) {
      console.log("Invoice has no payment intent");
      return;
    }

    // Retrieve payment intent to get payment method
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.payment_method) {
      console.log("Payment intent has no payment method");
      return;
    }

    const paymentMethodId = typeof paymentIntent.payment_method === "string"
      ? paymentIntent.payment_method
      : (paymentIntent.payment_method as any).id;

    // Check if payment method already exists
    const existingMethod = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.stripePaymentMethodId, paymentMethodId))
      .limit(1);

    if (existingMethod[0]) {
      console.log("Payment method already saved");
      return;
    }

    // Retrieve payment method details from Stripe
    const paymentMethod = await getStripe().paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type !== "card" || !paymentMethod.card) {
      console.log("Payment method is not a card");
      return;
    }

    // Save payment method to database
    await db.insert(paymentMethods).values([
      {
        userId,
        stripePaymentMethodId: paymentMethodId,
        cardBrand: paymentMethod.card.brand,
        cardLast4: paymentMethod.card.last4,
        cardExpMonth: paymentMethod.card.exp_month,
        cardExpYear: paymentMethod.card.exp_year,
        cardHolderName: paymentMethod.billing_details?.name || undefined,
        isDefault: 0, // Don't auto-set as default
        billingAddress: paymentMethod.billing_details?.address
          ? JSON.stringify(paymentMethod.billing_details.address)
          : null,
      },
    ]);

    console.log(`Payment method auto-saved for user ${userId}`);
  } catch (error) {
    console.error("Error auto-saving payment method from invoice:", error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  try {
    return getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return null;
  }
}
