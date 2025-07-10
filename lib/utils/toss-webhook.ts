import * as crypto from "crypto";

const WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET!;

/**
 * Verify webhook signature from Toss Payments
 * @param body - Raw request body as string
 * @param signature - Signature from TossPayments-Signature header
 * @returns boolean indicating if signature is valid
 */
export function verifyTossWebhookSignature(
  body: string, 
  signature: string | null
): boolean {
  if (!signature || !WEBHOOK_SECRET) {
    console.error("[Webhook] Missing signature or webhook secret");
    return false;
  }

  try {
    // Toss uses HMAC-SHA256 with base64 encoding
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const digest = hmac.update(body).digest("base64");
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error("[Webhook] Error verifying signature:", error);
    return false;
  }
}

/**
 * Common webhook event types from Toss Payments
 */
export const TOSS_WEBHOOK_EVENTS = {
  // Payment events
  PAYMENT_DONE: "PAYMENT.DONE",
  PAYMENT_FAILED: "PAYMENT.FAILED",
  PAYMENT_CANCELLED: "PAYMENT.CANCELLED",
  PAYMENT_PARTIAL_CANCELLED: "PAYMENT.PARTIAL_CANCELLED",
  
  // Billing key events
  BILLING_KEY_ISSUED: "BILLING_KEY.ISSUED",
  BILLING_KEY_UPDATED: "BILLING_KEY.UPDATED",
  BILLING_KEY_REMOVED: "BILLING_KEY.REMOVED",
  
  // Recurring payment events
  BILLING_PAYMENT_DONE: "BILLING.PAYMENT_DONE",
  BILLING_PAYMENT_FAILED: "BILLING.PAYMENT_FAILED",
} as const;

export type TossWebhookEventType = typeof TOSS_WEBHOOK_EVENTS[keyof typeof TOSS_WEBHOOK_EVENTS];

/**
 * Parse and validate webhook event data
 */
export function parseTossWebhookEvent(body: string) {
  try {
    const event = JSON.parse(body);
    
    // Validate required fields
    if (!event.eventType || !event.timestamp || !event.data) {
      throw new Error("Invalid webhook event structure");
    }
    
    return event;
  } catch (error) {
    console.error("[Webhook] Error parsing event:", error);
    throw new Error("Invalid webhook payload");
  }
}