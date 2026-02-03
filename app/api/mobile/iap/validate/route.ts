import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { appleIAPService, AppleIAPService } from "@/lib/services/apple-iap.service";
import { googleIAPService, GoogleIAPService } from "@/lib/services/google-iap.service";
import { PaymentSource } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

// Request validation schema
const validateRequestSchema = z.object({
  platform: z.enum(["ios", "android"]),
  productId: z.string().min(1),
  transactionId: z.string().min(1),
  // iOS: receipt data, Android: purchase token
  receipt: z.string().optional(),
  purchaseToken: z.string().optional(),
});

/**
 * Decode JWS token to extract transaction ID
 * StoreKit 2 returns JWS tokens that contain the actual transaction ID in the payload
 */
function extractTransactionIdFromJWS(jwsOrId: string): string | null {
  // If it doesn't look like a JWS (starts with "eyJ"), return as-is
  if (!jwsOrId.startsWith("eyJ")) {
    return jwsOrId;
  }

  try {
    // JWS format: header.payload.signature (base64url encoded)
    const parts = jwsOrId.split(".");
    if (parts.length !== 3) {
      console.warn("[Validate] Invalid JWS format");
      return null;
    }

    // Decode the payload (second part) - base64url to JSON
    const payloadBase64 = parts[1];
    // Convert base64url to standard base64
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    // Decode and parse
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));

    console.log("[Validate] Decoded JWS payload:", {
      transactionId: payload.transactionId,
      originalTransactionId: payload.originalTransactionId,
      productId: payload.productId,
    });

    // Return the transaction ID from the payload
    return payload.transactionId || payload.originalTransactionId || null;
  } catch (error) {
    console.error("[Validate] Failed to decode JWS:", error);
    return null;
  }
}

interface SubscriptionResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    planName: string;
    startDate: string;
    endDate: string;
    isTrialPeriod: boolean;
    autoRenew: boolean;
    paymentSource: string;
  } | null;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<SubscriptionResponse>> {
  // Verify authentication
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, subscription: null, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const validatedData = validateRequestSchema.parse(body);

    const { platform, productId, transactionId, purchaseToken } = validatedData;

    let isValid = false;
    let isActive = false;
    let isTrialPeriod = false;
    let expiresDate: Date | null = null;
    let autoRenewStatus = false;
    let originalTransactionId: string | null = null;
    let storeTransactionId: string | null = null;

    // Validate with the appropriate store
    if (platform === "ios") {
      // Extract actual transaction ID from JWS if needed (StoreKit 2 sends JWS tokens)
      const actualTransactionId = extractTransactionIdFromJWS(transactionId);
      if (!actualTransactionId) {
        console.warn(`[SECURITY] Could not extract transaction ID from JWS for user ${userId}`);
        return NextResponse.json(
          { success: false, subscription: null, error: "Invalid transaction format" },
          { status: 400 }
        );
      }

      console.log("[Validate] Using transaction ID:", actualTransactionId);
      const result = await appleIAPService.getSubscriptionStatus(actualTransactionId);

      if (!result.success || !result.subscription) {
        console.warn(`[SECURITY] Apple validation failed for user ${userId}, transactionId: ${actualTransactionId}, error: ${result.error}`);
        return NextResponse.json(
          { success: false, subscription: null, error: result.error || "Apple validation failed" },
          { status: 400 }
        );
      }

      isValid = result.subscription.isValid;
      isActive = result.subscription.isActive;
      isTrialPeriod = result.subscription.isTrialPeriod;
      expiresDate = result.subscription.expiresDate;
      autoRenewStatus = result.subscription.autoRenewStatus;
      originalTransactionId = result.subscription.originalTransactionId;
      storeTransactionId = result.subscription.transactionId;
    } else {
      // Android
      if (!purchaseToken) {
        return NextResponse.json(
          { success: false, subscription: null, error: "Purchase token required for Android" },
          { status: 400 }
        );
      }

      const result = await googleIAPService.validateSubscription(productId, purchaseToken);

      if (!result.success || !result.subscription) {
        console.warn(`[SECURITY] Google validation failed for user ${userId}, productId: ${productId}, error: ${result.error}`);
        return NextResponse.json(
          { success: false, subscription: null, error: result.error || "Google validation failed" },
          { status: 400 }
        );
      }

      isValid = result.subscription.isValid;
      isActive = result.subscription.isActive;
      isTrialPeriod = result.subscription.isTrialPeriod;
      expiresDate = result.subscription.expiresDate;
      autoRenewStatus = result.subscription.autoRenewStatus;
      storeTransactionId = purchaseToken;

      // Acknowledge the purchase if not already acknowledged
      // This is critical - unacknowledged purchases are refunded after 3 days
      if (!result.subscription.isAcknowledged) {
        const ackResult = await googleIAPService.acknowledgeSubscription(productId, purchaseToken);
        if (!ackResult.success) {
          console.error("[IAP] Failed to acknowledge Google purchase:", ackResult.error);
          return NextResponse.json(
            { success: false, subscription: null, error: "Failed to acknowledge purchase. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    if (!isValid || !expiresDate) {
      return NextResponse.json(
        { success: false, subscription: null, error: "Invalid subscription" },
        { status: 400 }
      );
    }

    // Get the matching plan from database
    const planId = platform === "ios"
      ? await AppleIAPService.getMatchingPlanId(productId)
      : await GoogleIAPService.getMatchingPlanId(productId);

    if (!planId) {
      return NextResponse.json(
        { success: false, subscription: null, error: "No matching plan found" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, subscription: null, error: "Plan not found" },
        { status: 400 }
      );
    }

    const paymentSource: PaymentSource = platform === "ios" ? "APPLE" : "GOOGLE";

    // Use transaction to prevent race conditions with concurrent requests
    const result = await prisma.$transaction(async (tx) => {
      // Check if this transaction already exists (inside transaction for atomicity)
      const existingPayment = await tx.payment.findFirst({
        where: {
          OR: [
            { storeTransactionId: storeTransactionId || undefined },
            { originalTransactionId: originalTransactionId || undefined },
          ],
        },
        include: {
          subscription: true,
        },
      });

      if (existingPayment?.subscription) {
        // Update existing subscription if needed
        const updatedSubscription = await tx.userSubscription.update({
          where: { id: existingPayment.subscription.id },
          data: {
            status: isActive ? "ACTIVE" : "EXPIRED",
            endDate: expiresDate,
            autoRenew: autoRenewStatus,
            isTrialPeriod,
            recurringStatus: autoRenewStatus ? "ACTIVE" : "CANCELLED",
          },
          include: {
            plan: true,
          },
        });

        return { type: "updated" as const, subscription: updatedSubscription };
      }

      // Create new payment and subscription
      const orderId = `${platform.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date();

      const payment = await tx.payment.create({
        data: {
          userId,
          planId,
          paymentKey: storeTransactionId || orderId,
          orderId,
          orderName: `${plan.name} - ${platform === "ios" ? "App Store" : "Google Play"}`,
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

      const subscription = await tx.userSubscription.create({
        data: {
          userId,
          planId,
          paymentId: payment.id,
          status: isActive ? "ACTIVE" : "PENDING",
          startDate: now,
          endDate: expiresDate,
          paymentSource,
          storeProductId: productId,
          isTrialPeriod,
          autoRenew: autoRenewStatus,
          recurringStatus: autoRenewStatus ? "ACTIVE" : "INACTIVE",
          nextBillingDate: autoRenewStatus ? expiresDate : null,
        },
        include: {
          plan: true,
        },
      });

      console.log(`[IAP] Created subscription ${subscription.id} for user ${userId} via ${platform}`);
      return { type: "created" as const, subscription };
    });

    const { subscription } = result;

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan.name,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        isTrialPeriod: subscription.isTrialPeriod,
        autoRenew: subscription.autoRenew,
        paymentSource: subscription.paymentSource,
      },
    });
  } catch (error) {
    console.error("[IAP] Validation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, subscription: null, error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, subscription: null, error: "Failed to validate purchase" },
      { status: 500 }
    );
  }
}
