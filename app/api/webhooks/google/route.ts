import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { googleIAPService, GoogleIAPService } from "@/lib/services/google-iap.service";
import { prisma } from "@/prisma/prisma-client";

// Webhook verification configuration
const GOOGLE_PUBSUB_VERIFICATION_TOKEN = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
const GOOGLE_PUBSUB_SUBSCRIPTION = process.env.GOOGLE_PUBSUB_SUBSCRIPTION;

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verify the webhook request is from Google Pub/Sub
 * Uses verification token passed as query parameter
 */
function verifyWebhookRequest(
  request: Request,
  body: GoogleRTDNMessage
): { valid: boolean; error?: string } {
  // Check if verification is configured
  if (!GOOGLE_PUBSUB_VERIFICATION_TOKEN) {
    // In development, allow unverified requests with warning
    if (process.env.NODE_ENV === "development") {
      console.warn("[Google Webhook] Verification token not configured - allowing in development");
      return { valid: true };
    }
    console.error("[Google Webhook] GOOGLE_PUBSUB_VERIFICATION_TOKEN not configured");
    return { valid: false, error: "Webhook verification not configured" };
  }

  // Verify token from query parameter
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    console.error("[Google Webhook] Missing verification token in request");
    return { valid: false, error: "Missing verification token" };
  }

  if (!safeCompare(token, GOOGLE_PUBSUB_VERIFICATION_TOKEN)) {
    console.error("[Google Webhook] Invalid verification token");
    return { valid: false, error: "Invalid verification token" };
  }

  // Optionally verify subscription name
  if (GOOGLE_PUBSUB_SUBSCRIPTION && body.subscription) {
    if (!body.subscription.includes(GOOGLE_PUBSUB_SUBSCRIPTION)) {
      console.error(`[Google Webhook] Unexpected subscription: ${body.subscription}`);
      return { valid: false, error: "Invalid subscription" };
    }
  }

  return { valid: true };
}

/**
 * Google Play Real-time Developer Notifications (RTDN) Handler
 *
 * Notification types:
 * 1 = SUBSCRIPTION_RECOVERED
 * 2 = SUBSCRIPTION_RENEWED
 * 3 = SUBSCRIPTION_CANCELED
 * 4 = SUBSCRIPTION_PURCHASED
 * 5 = SUBSCRIPTION_ON_HOLD
 * 6 = SUBSCRIPTION_IN_GRACE_PERIOD
 * 7 = SUBSCRIPTION_RESTARTED
 * 8 = SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
 * 9 = SUBSCRIPTION_DEFERRED
 * 10 = SUBSCRIPTION_PAUSED
 * 11 = SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
 * 12 = SUBSCRIPTION_REVOKED
 * 13 = SUBSCRIPTION_EXPIRED
 */

interface GoogleRTDNMessage {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export async function POST(request: Request) {
  try {
    const body: GoogleRTDNMessage = await request.json();

    // Verify webhook authenticity
    const verification = verifyWebhookRequest(request, body);
    if (!verification.valid) {
      console.error(`[Google Webhook] Verification failed: ${verification.error}`);
      return NextResponse.json({ error: verification.error }, { status: 403 });
    }

    if (!body.message?.data) {
      console.error("[Google Webhook] Missing message data");
      return NextResponse.json({ error: "Missing message data" }, { status: 400 });
    }

    // Decode the notification
    const notification = googleIAPService.parseRealtimeNotification(body.message.data);

    if (!notification) {
      console.error("[Google Webhook] Failed to parse notification");
      return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
    }

    // Handle test notifications
    if (notification.testNotification) {
      console.log("[Google Webhook] Test notification received");
      return NextResponse.json({ success: true });
    }

    const subscriptionNotification = notification.subscriptionNotification;
    if (!subscriptionNotification) {
      console.log("[Google Webhook] Not a subscription notification");
      return NextResponse.json({ success: true });
    }

    const { notificationType, purchaseToken, subscriptionId: productId } = subscriptionNotification;
    const notificationTypeName = GoogleIAPService.getNotificationTypeName(notificationType);
    const messageId = body.message?.messageId;

    console.log(`[Google Webhook] Received ${notificationTypeName} for product ${productId} (messageId: ${messageId})`);

    // Idempotency check - skip if we've already processed this notification
    if (messageId) {
      const existingWebhook = await prisma.paymentWebhook.findUnique({
        where: { notificationId: messageId },
      });

      if (existingWebhook) {
        console.log(`[Google Webhook] Duplicate notification ${messageId}, skipping`);
        return NextResponse.json({ success: true });
      }
    }

    // Log the webhook with notificationId for idempotency
    await prisma.paymentWebhook.create({
      data: {
        eventType: `GOOGLE_${notificationTypeName}`,
        notificationId: messageId,
        data: notification as any,
        processed: false,
      },
    });

    // Find existing payment/subscription
    const existingPayment = await prisma.payment.findFirst({
      where: {
        storeTransactionId: purchaseToken,
      },
      include: {
        subscription: true,
        plan: true,
      },
    });

    // Get subscription status from Google
    const validationResult = await googleIAPService.validateSubscription(productId, purchaseToken);
    const googleSubscription = validationResult.subscription;

    // Handle different notification types
    switch (notificationType) {
      case 4: // SUBSCRIPTION_PURCHASED
        // New subscription
        if (googleSubscription && !existingPayment) {
          // Mobile app should call /validate endpoint
          // This is a backup in case they haven't
          console.log(`[Google Webhook] New purchase detected for product ${productId}`);
        }
        break;

      case 2: // SUBSCRIPTION_RENEWED - use transaction for atomic operations
        if (existingPayment?.subscription && googleSubscription) {
          const planId = await GoogleIAPService.getMatchingPlanId(productId);
          const orderId = `GOOGLE_RENEW_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

          await prisma.$transaction(async (tx) => {
            // Check if this renewal already exists (idempotency)
            const existingRenewal = await tx.payment.findFirst({
              where: {
                storeTransactionId: purchaseToken,
                paymentKey: googleSubscription.orderId || orderId,
              },
            });

            if (!existingRenewal) {
              // Create renewal payment record
              await tx.payment.create({
                data: {
                  userId: existingPayment.userId,
                  planId: planId || existingPayment.planId,
                  paymentKey: googleSubscription.orderId || orderId,
                  orderId,
                  orderName: `${existingPayment.plan?.name || "Subscription"} - Renewal`,
                  amount: existingPayment.amount,
                  currency: "KRW",
                  status: "PAID",
                  paymentType: "RECURRING",
                  paymentSource: "GOOGLE",
                  storeTransactionId: purchaseToken,
                  approvedAt: new Date(),
                },
              });
            }

            await tx.userSubscription.update({
              where: { id: existingPayment.subscription!.id },
              data: {
                status: "ACTIVE",
                endDate: googleSubscription.expiresDate || existingPayment.subscription!.endDate,
                isTrialPeriod: false,
                autoRenew: googleSubscription.autoRenewStatus,
                recurringStatus: "ACTIVE",
                nextBillingDate: googleSubscription.expiresDate,
                failedAttempts: 0,
                lastBillingDate: new Date(),
              },
            });
          });

          console.log(`[Google Webhook] Renewed subscription ${existingPayment.subscription.id}`);
        }
        break;

      case 1: // SUBSCRIPTION_RECOVERED
        // Payment recovered after billing retry
        if (existingPayment?.subscription && googleSubscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "ACTIVE",
              endDate: googleSubscription.expiresDate || existingPayment.subscription.endDate,
              autoRenew: googleSubscription.autoRenewStatus,
              recurringStatus: "ACTIVE",
              failedAttempts: 0,
              gracePeriodEnd: null,
            },
          });

          console.log(`[Google Webhook] Subscription recovered: ${existingPayment.subscription.id}`);
        }
        break;

      case 3: // SUBSCRIPTION_CANCELED
        // User cancelled auto-renewal
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              autoRenew: false,
              recurringStatus: "CANCELLED",
              nextBillingDate: null,
              // Status remains ACTIVE until endDate
            },
          });

          console.log(`[Google Webhook] Subscription cancelled: ${existingPayment.subscription.id}`);
        }
        break;

      case 5: // SUBSCRIPTION_ON_HOLD
        // Payment failed, subscription on hold
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "ACTIVE", // User still has access during hold period
              recurringStatus: "PENDING_PAYMENT",
              failedAttempts: { increment: 1 },
              lastFailureReason: "Payment on hold",
              lastFailureDate: new Date(),
            },
          });

          console.log(`[Google Webhook] Subscription on hold: ${existingPayment.subscription.id}`);
        }
        break;

      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
        // In grace period after billing failure
        if (existingPayment?.subscription && googleSubscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "ACTIVE", // User still has access during grace period
              recurringStatus: "PENDING_PAYMENT",
              gracePeriodEnd: googleSubscription.expiresDate,
            },
          });

          console.log(`[Google Webhook] Subscription in grace period: ${existingPayment.subscription.id}`);
        }
        break;

      case 7: // SUBSCRIPTION_RESTARTED
        // Subscription restarted (resubscribed)
        if (existingPayment?.subscription && googleSubscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "ACTIVE",
              endDate: googleSubscription.expiresDate || existingPayment.subscription.endDate,
              autoRenew: googleSubscription.autoRenewStatus,
              recurringStatus: "ACTIVE",
              nextBillingDate: googleSubscription.expiresDate,
              failedAttempts: 0,
              gracePeriodEnd: null,
            },
          });

          console.log(`[Google Webhook] Subscription restarted: ${existingPayment.subscription.id}`);
        }
        break;

      case 10: // SUBSCRIPTION_PAUSED
        // Subscription paused
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              recurringStatus: "PAUSED",
              autoRenew: false,
            },
          });

          console.log(`[Google Webhook] Subscription paused: ${existingPayment.subscription.id}`);
        }
        break;

      case 8: // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
        // User accepted price increase
        if (existingPayment?.subscription) {
          console.log(`[Google Webhook] Price change confirmed for subscription ${existingPayment.subscription.id}`);
          // Price change will apply at next renewal - no action needed
        }
        break;

      case 9: // SUBSCRIPTION_DEFERRED
        // Subscription renewal was deferred
        if (existingPayment?.subscription && googleSubscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              endDate: googleSubscription.expiresDate || existingPayment.subscription.endDate,
              nextBillingDate: googleSubscription.expiresDate,
            },
          });

          console.log(`[Google Webhook] Subscription deferred: ${existingPayment.subscription.id}`);
        }
        break;

      case 11: // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
        // User changed their pause schedule
        if (existingPayment?.subscription) {
          console.log(`[Google Webhook] Pause schedule changed for subscription ${existingPayment.subscription.id}`);
        }
        break;

      case 12: // SUBSCRIPTION_REVOKED - use transaction for atomic operations
        // Subscription revoked (refund, etc.)
        if (existingPayment) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: "REFUNDED",
                refundedAt: new Date(),
              },
            });

            if (existingPayment.subscription) {
              await tx.userSubscription.update({
                where: { id: existingPayment.subscription.id },
                data: {
                  status: "CANCELLED",
                  recurringStatus: "CANCELLED",
                  autoRenew: false,
                  cancelledAt: new Date(),
                  cancelReason: "Revoked",
                },
              });
            }
          });

          console.log(`[Google Webhook] Subscription revoked: ${existingPayment.id}`);
        }
        break;

      case 13: // SUBSCRIPTION_EXPIRED
        // Subscription expired
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "EXPIRED",
              recurringStatus: "INACTIVE",
              autoRenew: false,
              nextBillingDate: null,
            },
          });

          console.log(`[Google Webhook] Subscription expired: ${existingPayment.subscription.id}`);
        }
        break;

      default:
        console.log(`[Google Webhook] Unhandled notification type: ${notificationTypeName}`);
    }

    // Mark webhook as processed
    await prisma.paymentWebhook.updateMany({
      where: {
        eventType: `GOOGLE_${notificationTypeName}`,
        processed: false,
      },
      data: {
        processed: true,
      },
    });

    // Google expects 200 OK to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Google Webhook] Error:", error);
    // Return 500 so Google will retry
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
