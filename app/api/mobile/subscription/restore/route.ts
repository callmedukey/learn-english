import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { appleIAPService, AppleIAPService } from "@/lib/services/apple-iap.service";
import { googleIAPService, GoogleIAPService } from "@/lib/services/google-iap.service";
import { PaymentSource } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const restoreRequestSchema = z.object({
  platform: z.enum(["ios", "android"]),
  // iOS: array of transaction IDs, Android: array of { productId, purchaseToken }
  purchases: z.array(z.object({
    transactionId: z.string().optional(),
    productId: z.string(),
    purchaseToken: z.string().optional(),
  })),
});

interface RestoreResponse {
  success: boolean;
  restoredCount: number;
  subscription: {
    id: string;
    status: string;
    planName: string;
    endDate: string;
    isTrialPeriod: boolean;
    autoRenew: boolean;
    paymentSource: string;
  } | null;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<RestoreResponse>> {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, restoredCount: 0, subscription: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const validatedData = restoreRequestSchema.parse(body);

    const { platform, purchases } = validatedData;
    let restoredCount = 0;
    let latestSubscription: any = null;

    for (const purchase of purchases) {
      try {
        let isValid = false;
        let isActive = false;
        let isTrialPeriod = false;
        let expiresDate: Date | null = null;
        let autoRenewStatus = false;
        let originalTransactionId: string | null = null;
        let storeTransactionId: string | null = null;

        if (platform === "ios") {
          if (!purchase.transactionId) continue;

          const result = await appleIAPService.getSubscriptionStatus(purchase.transactionId);

          if (!result.success || !result.subscription) continue;

          isValid = result.subscription.isValid;
          isActive = result.subscription.isActive;
          isTrialPeriod = result.subscription.isTrialPeriod;
          expiresDate = result.subscription.expiresDate;
          autoRenewStatus = result.subscription.autoRenewStatus;
          originalTransactionId = result.subscription.originalTransactionId;
          storeTransactionId = result.subscription.transactionId;
        } else {
          if (!purchase.purchaseToken) continue;

          const result = await googleIAPService.validateSubscription(
            purchase.productId,
            purchase.purchaseToken
          );

          if (!result.success || !result.subscription) continue;

          isValid = result.subscription.isValid;
          isActive = result.subscription.isActive;
          isTrialPeriod = result.subscription.isTrialPeriod;
          expiresDate = result.subscription.expiresDate;
          autoRenewStatus = result.subscription.autoRenewStatus;
          storeTransactionId = purchase.purchaseToken;

          // Acknowledge if needed
          if (!result.subscription.isAcknowledged) {
            await googleIAPService.acknowledgeSubscription(
              purchase.productId,
              purchase.purchaseToken
            );
          }
        }

        if (!isValid || !isActive || !expiresDate) continue;

        // Get matching plan
        const planId = platform === "ios"
          ? await AppleIAPService.getMatchingPlanId(purchase.productId)
          : await GoogleIAPService.getMatchingPlanId(purchase.productId);

        if (!planId) continue;

        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) continue;

        const paymentSource: PaymentSource = platform === "ios" ? "APPLE" : "GOOGLE";

        // Check if already exists
        const existingPayment = await prisma.payment.findFirst({
          where: {
            OR: [
              { storeTransactionId: storeTransactionId || undefined },
              { originalTransactionId: originalTransactionId || undefined },
            ],
          },
          include: { subscription: true },
        });

        if (existingPayment?.subscription) {
          // Security check: Only restore if the payment belongs to this user
          if (existingPayment.userId !== userId) {
            console.warn(`[Restore] User ${userId} attempted to restore payment belonging to ${existingPayment.userId}`);
            continue;
          }

          // Update existing
          const updated = await prisma.userSubscription.update({
            where: { id: existingPayment.subscription.id },
            data: {
              status: "ACTIVE",
              endDate: expiresDate,
              autoRenew: autoRenewStatus,
              isTrialPeriod,
              recurringStatus: autoRenewStatus ? "ACTIVE" : "CANCELLED",
            },
            include: { plan: true },
          });

          restoredCount++;
          if (!latestSubscription || expiresDate > new Date(latestSubscription.endDate)) {
            latestSubscription = updated;
          }
        } else {
          // Create new
          const orderId = `RESTORE_${platform.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const now = new Date();

          const payment = await prisma.payment.create({
            data: {
              userId,
              planId,
              paymentKey: storeTransactionId || orderId,
              orderId,
              orderName: `${plan.name} - Restored`,
              amount: plan.price,
              currency: "KRW",
              status: "PAID",
              paymentType: "RECURRING",
              paymentSource,
              storeTransactionId,
              originalTransactionId,
              approvedAt: now,
            },
          });

          const subscription = await prisma.userSubscription.create({
            data: {
              userId,
              planId,
              paymentId: payment.id,
              status: "ACTIVE",
              startDate: now,
              endDate: expiresDate,
              paymentSource,
              storeProductId: purchase.productId,
              isTrialPeriod,
              autoRenew: autoRenewStatus,
              recurringStatus: autoRenewStatus ? "ACTIVE" : "INACTIVE",
              nextBillingDate: autoRenewStatus ? expiresDate : null,
            },
            include: { plan: true },
          });

          restoredCount++;
          if (!latestSubscription || expiresDate > new Date(latestSubscription.endDate)) {
            latestSubscription = subscription;
          }
        }
      } catch (purchaseError) {
        console.error(`[Restore] Error processing purchase:`, purchaseError);
        // Continue with other purchases
      }
    }

    console.log(`[Restore] Restored ${restoredCount} purchases for user ${userId}`);

    return NextResponse.json({
      success: true,
      restoredCount,
      subscription: latestSubscription ? {
        id: latestSubscription.id,
        status: latestSubscription.status,
        planName: latestSubscription.plan.name,
        endDate: latestSubscription.endDate.toISOString(),
        isTrialPeriod: latestSubscription.isTrialPeriod,
        autoRenew: latestSubscription.autoRenew,
        paymentSource: latestSubscription.paymentSource,
      } : null,
    });
  } catch (error) {
    console.error("[Restore] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, restoredCount: 0, subscription: null, error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, restoredCount: 0, subscription: null, error: "Failed to restore purchases" },
      { status: 500 }
    );
  }
}
