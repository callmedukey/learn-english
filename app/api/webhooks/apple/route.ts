import { NextResponse } from "next/server";

import { appleIAPService, AppleIAPService } from "@/lib/services/apple-iap.service";
import { prisma } from "@/prisma/prisma-client";

/**
 * Apple App Store Server Notifications V2 Webhook Handler
 *
 * Notification types:
 * - CONSUMPTION_REQUEST
 * - DID_CHANGE_RENEWAL_PREF
 * - DID_CHANGE_RENEWAL_STATUS
 * - DID_FAIL_TO_RENEW
 * - DID_RENEW
 * - EXPIRED
 * - GRACE_PERIOD_EXPIRED
 * - OFFER_REDEEMED
 * - PRICE_INCREASE
 * - REFUND
 * - REFUND_DECLINED
 * - REFUND_REVERSED
 * - RENEWAL_EXTENDED
 * - RENEWAL_EXTENSION
 * - REVOKE
 * - SUBSCRIBED
 * - TEST
 */

interface AppleNotificationPayload {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  data: {
    appAppleId: number;
    bundleId: string;
    bundleVersion: string;
    environment: string;
    signedTransactionInfo: string;
    signedRenewalInfo?: string;
  };
  version: string;
  signedDate: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signedPayload } = body;

    if (!signedPayload) {
      console.error("[Apple Webhook] Missing signedPayload");
      return NextResponse.json({ error: "Missing signedPayload" }, { status: 400 });
    }

    // Verify and decode the notification
    const { isValid, notification, error } = await appleIAPService.verifyNotification(signedPayload);

    if (!isValid || !notification) {
      console.error("[Apple Webhook] Invalid notification:", error);
      return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
    }

    const payload = notification as AppleNotificationPayload;
    const { notificationType, subtype, notificationUUID, data } = payload;

    console.log(`[Apple Webhook] Received ${notificationType}${subtype ? `:${subtype}` : ""} (UUID: ${notificationUUID})`);

    // Idempotency check - skip if we've already processed this notification
    const existingWebhook = await prisma.paymentWebhook.findUnique({
      where: { notificationId: notificationUUID },
    });

    if (existingWebhook) {
      console.log(`[Apple Webhook] Duplicate notification ${notificationUUID}, skipping`);
      return NextResponse.json({ success: true });
    }

    // Log the webhook with notificationId for idempotency
    await prisma.paymentWebhook.create({
      data: {
        eventType: `APPLE_${notificationType}${subtype ? `_${subtype}` : ""}`,
        notificationId: notificationUUID,
        data: payload as any,
        processed: false,
      },
    });

    // Decode transaction info
    const transactionParts = data.signedTransactionInfo.split(".");
    if (transactionParts.length !== 3) {
      console.error("[Apple Webhook] Invalid transaction info format");
      return NextResponse.json({ error: "Invalid transaction info" }, { status: 400 });
    }

    const transactionInfo = JSON.parse(
      Buffer.from(transactionParts[1], "base64url").toString("utf8")
    );

    const {
      transactionId,
      originalTransactionId,
      productId,
      expiresDate,
    } = transactionInfo;

    // Find existing payment/subscription
    // Note: Use explicit undefined check to avoid matching all null originalTransactionId records
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { storeTransactionId: transactionId },
          ...(originalTransactionId ? [{ originalTransactionId }] : []),
        ],
      },
      include: {
        subscription: true,
        user: true,
        plan: true,
      },
    });

    // Handle different notification types
    switch (notificationType) {
      case "SUBSCRIBED":
        // New subscription or resubscription
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "ACTIVE",
              endDate: new Date(expiresDate),
              autoRenew: true,
              recurringStatus: "ACTIVE",
              nextBillingDate: new Date(expiresDate),
            },
          });
        }
        // If no existing record, mobile app should call /validate endpoint
        break;

      case "DID_RENEW":
        // Subscription renewed - use transaction for atomic operations
        if (existingPayment?.subscription) {
          const planId = await AppleIAPService.getMatchingPlanId(productId);
          const orderId = `APPLE_RENEW_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

          await prisma.$transaction(async (tx) => {
            // Check if this renewal payment already exists (idempotency)
            const existingRenewal = await tx.payment.findFirst({
              where: { storeTransactionId: transactionId },
            });

            if (!existingRenewal) {
              // Create renewal payment record
              await tx.payment.create({
                data: {
                  userId: existingPayment.userId,
                  planId: planId || existingPayment.planId,
                  paymentKey: transactionId,
                  orderId,
                  orderName: `${existingPayment.plan?.name || "Subscription"} - Renewal`,
                  amount: existingPayment.amount,
                  currency: "KRW",
                  status: "PAID",
                  paymentType: "RECURRING",
                  paymentSource: "APPLE",
                  storeTransactionId: transactionId,
                  originalTransactionId,
                  approvedAt: new Date(),
                },
              });
            }

            await tx.userSubscription.update({
              where: { id: existingPayment.subscription!.id },
              data: {
                status: "ACTIVE",
                endDate: new Date(expiresDate),
                isTrialPeriod: false,
                autoRenew: true,
                recurringStatus: "ACTIVE",
                nextBillingDate: new Date(expiresDate),
                failedAttempts: 0,
                lastBillingDate: new Date(),
              },
            });
          });

          console.log(`[Apple Webhook] Renewed subscription ${existingPayment.subscription.id}`);
        }
        break;

      case "DID_CHANGE_RENEWAL_STATUS":
        // User changed auto-renewal setting
        if (existingPayment?.subscription) {
          const autoRenew = subtype === "AUTO_RENEW_ENABLED";

          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              autoRenew,
              recurringStatus: autoRenew ? "ACTIVE" : "CANCELLED",
              nextBillingDate: autoRenew ? new Date(expiresDate) : null,
            },
          });

          console.log(`[Apple Webhook] Auto-renew ${autoRenew ? "enabled" : "disabled"} for ${existingPayment.subscription.id}`);
        }
        break;

      case "DID_FAIL_TO_RENEW":
        // Renewal failed (billing issue)
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              recurringStatus: "PENDING_PAYMENT",
              failedAttempts: { increment: 1 },
              lastFailureReason: "Billing failed",
              lastFailureDate: new Date(),
              gracePeriodEnd: new Date(expiresDate), // Apple provides grace period end
            },
          });

          console.log(`[Apple Webhook] Renewal failed for ${existingPayment.subscription.id}`);
        }
        break;

      case "EXPIRED":
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

          console.log(`[Apple Webhook] Subscription expired: ${existingPayment.subscription.id}`);
        }
        break;

      case "GRACE_PERIOD_EXPIRED":
        // Grace period ended without successful payment
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "EXPIRED",
              recurringStatus: "CANCELLED",
              autoRenew: false,
              nextBillingDate: null,
            },
          });

          console.log(`[Apple Webhook] Grace period expired: ${existingPayment.subscription.id}`);
        }
        break;

      case "REFUND":
        // Refund issued - use transaction for atomic operations
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
                  cancelReason: "Refunded",
                },
              });
            }
          });

          console.log(`[Apple Webhook] Refund processed for payment ${existingPayment.id}`);
        }
        break;

      case "REVOKE":
        // Subscription revoked (family sharing removed, etc.)
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "CANCELLED",
              recurringStatus: "CANCELLED",
              autoRenew: false,
              cancelledAt: new Date(),
              cancelReason: "Revoked",
            },
          });

          console.log(`[Apple Webhook] Subscription revoked: ${existingPayment.subscription.id}`);
        }
        break;

      case "REFUND_DECLINED":
        // Refund request was declined - subscription remains active
        if (existingPayment?.subscription) {
          console.log(`[Apple Webhook] Refund declined for subscription ${existingPayment.subscription.id}`);
          // No action needed - subscription remains as is
        }
        break;

      case "REFUND_REVERSED":
        // Refund was reversed - reactivate subscription
        if (existingPayment) {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: existingPayment.id },
              data: {
                status: "PAID",
                refundedAt: null,
              },
            });

            if (existingPayment.subscription) {
              await tx.userSubscription.update({
                where: { id: existingPayment.subscription.id },
                data: {
                  status: "ACTIVE",
                  recurringStatus: "ACTIVE",
                  cancelledAt: null,
                  cancelReason: null,
                },
              });
            }
          });

          console.log(`[Apple Webhook] Refund reversed for payment ${existingPayment.id}`);
        }
        break;

      case "RENEWAL_EXTENDED":
      case "RENEWAL_EXTENSION":
        // Subscription was extended (e.g., due to service issues)
        if (existingPayment?.subscription) {
          await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              endDate: new Date(expiresDate),
              nextBillingDate: new Date(expiresDate),
            },
          });

          console.log(`[Apple Webhook] Subscription extended: ${existingPayment.subscription.id}`);
        }
        break;

      case "OFFER_REDEEMED":
        // User redeemed a promotional offer
        if (existingPayment?.subscription) {
          console.log(`[Apple Webhook] Offer redeemed for subscription ${existingPayment.subscription.id}`);
          // Could track offer usage here if needed
        }
        break;

      case "PRICE_INCREASE":
        // Price increase notification - user needs to consent
        if (existingPayment?.subscription) {
          console.log(`[Apple Webhook] Price increase pending for subscription ${existingPayment.subscription.id}`);
          // Could send notification to user or update UI to show pending price change
        }
        break;

      case "DID_CHANGE_RENEWAL_PREF":
        // User changed their subscription plan (upgrade/downgrade)
        if (existingPayment?.subscription) {
          console.log(`[Apple Webhook] Renewal preference changed for subscription ${existingPayment.subscription.id}`);
          // The new plan will take effect at next renewal
        }
        break;

      case "TEST":
        // Test notification
        console.log("[Apple Webhook] Test notification received");
        break;

      default:
        console.log(`[Apple Webhook] Unhandled notification type: ${notificationType}`);
    }

    // Mark webhook as processed
    await prisma.paymentWebhook.updateMany({
      where: {
        eventType: `APPLE_${notificationType}${subtype ? `_${subtype}` : ""}`,
        processed: false,
      },
      data: {
        processed: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Apple Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
