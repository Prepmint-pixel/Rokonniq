import { Request, Response } from "express";
import { handleStripeWebhook, verifyWebhookSignature } from "./stripeWebhookHandler";

/**
 * Stripe webhook endpoint handler
 * Receives and processes Stripe events
 */
export async function stripeWebhookEndpoint(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  if (!signature) {
    console.error("Missing Stripe signature");
    return res.status(400).json({ error: "Missing signature" });
  }

  try {
    // Get raw body for signature verification
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook signature
    const event = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!event) {
      console.error("Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Handle the webhook event
    await handleStripeWebhook(event);

    // Return success response
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Middleware to capture raw body for webhook signature verification
 */
export function captureRawBody(req: Request, res: Response, next: Function) {
  let data = "";

  req.on("data", (chunk) => {
    data += chunk;
  });

  req.on("end", () => {
    (req as any).rawBody = data;
    next();
  });
}
