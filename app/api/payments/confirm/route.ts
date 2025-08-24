import { NextRequest, NextResponse } from "next/server";

import { hasPaymentAccess } from "@/lib/utils/payment-access";
import { prisma } from "@/prisma/prisma-client";

const TOSS_CLIENT_SECRET = process.env.TOSS_CLIENT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Check if user has payment access during maintenance
    const hasAccess = await hasPaymentAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Payment system is under maintenance" },
        { status: 503 },
      );
    }

    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        plan: true,
        user: {
          include: {
            country: true,
          },
        },
        coupon: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }

    // Debug logging
    console.log("[Payment Confirm] Payment found:", {
      orderId: payment.orderId,
      userId: payment.userId,
      couponCode: payment.couponCode,
      hasCoupon: !!payment.coupon,
      couponType: payment.coupon?.recurringType,
      userCountry: payment.user.country?.name,
    });

    // Verify amount matches
    if (payment.amount !== amount) {
      return NextResponse.json(
        { success: false, error: "Amount mismatch" },
        { status: 400 },
      );
    }

    // Confirm payment with TossPayments
    const tossResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(TOSS_CLIENT_SECRET + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      },
    );

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureCode: tossResult.code,
          failureReason: tossResult.message,
          tossResponse: tossResult,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: tossResult.message || "Payment confirmation failed",
        },
        { status: 400 },
      );
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + payment.plan.duration * 24 * 60 * 60 * 1000,
    );

    // Update payment and create subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentKey,
          status: "PAID",
          method: tossResult.method,
          approvedAt: new Date(),
          tossResponse: tossResult,
        },
      });

      // Check if this is a recurring payment setup
      // For Korean users, all subscriptions are recurring (mandatory)
      const isKoreanUser = payment.user.country?.name === "South Korea";
      
      // Check if this payment has a billing key (indicates recurring setup)
      // Korean users always get recurring, others only if they have billing key
      const hasBillingKey = tossResult.card?.billingKey || tossResult.billingKey;
      const isRecurringSetup = isKoreanUser || hasBillingKey;

      // Calculate next billing date for recurring subscriptions
      const nextBillingDate = isRecurringSetup ? endDate : undefined;

      // Create user subscription
      const subscription = await tx.userSubscription.create({
        data: {
          userId: payment.userId,
          planId: payment.planId,
          paymentId: payment.id,
          status: "ACTIVE",
          startDate,
          endDate,
          // Auto-renewal fields
          autoRenew: isRecurringSetup,
          recurringStatus: isRecurringSetup ? "ACTIVE" : ("INACTIVE" as const),
          nextBillingDate,
          lastBillingDate: isRecurringSetup ? startDate : undefined,
        },
      });

      // Mark oneTimeUse coupon as inactive
      if (payment.coupon && payment.coupon.oneTimeUse) {
        await tx.discountCoupon.update({
          where: { id: payment.coupon.id },
          data: { active: false },
        });
      }

      // Debug logging for CouponApplication creation
      console.log("[Payment Confirm] Checking CouponApplication creation:", {
        hasCoupon: !!payment.coupon,
        couponCode: payment.coupon?.code,
        couponRecurringType: payment.coupon?.recurringType,
        hasBillingKey,
        isRecurringSetup,
        isKoreanUser,
        willCreateApplication: !!(payment.coupon && payment.coupon.recurringType === "RECURRING" && isRecurringSetup),
      });

      // Create CouponApplication for recurring coupons on recurring subscriptions
      if (
        payment.coupon &&
        payment.coupon.recurringType === "RECURRING" &&
        isRecurringSetup
      ) {
        console.log("[Payment Confirm] Creating CouponApplication for subscription:", subscription.id);
        
        const couponApplication = await tx.couponApplication.create({
          data: {
            subscriptionId: subscription.id,
            couponId: payment.coupon.id,
            remainingMonths: payment.coupon.recurringMonths,
            isActive: true,
            discountPercentage: payment.coupon.discount > 0 ? payment.coupon.discount : null,
            flatDiscountKRW: payment.coupon.flatDiscount > 0 ? payment.coupon.flatDiscount : null,
            flatDiscountUSD: payment.coupon.flatDiscountUSD && payment.coupon.flatDiscountUSD > 0 ? payment.coupon.flatDiscountUSD : null,
          },
        });
        
        console.log("[Payment Confirm] CouponApplication created:", {
          id: couponApplication.id,
          couponId: couponApplication.couponId,
          remainingMonths: couponApplication.remainingMonths,
        });
      } else {
        console.log("[Payment Confirm] CouponApplication NOT created - conditions not met");
      }

      return { updatedPayment, subscription };
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: result.updatedPayment.id,
        orderId: result.updatedPayment.orderId,
        amount: result.updatedPayment.amount,
        planName: payment.plan.name,
        expirationDate: result.subscription.endDate.toLocaleDateString(
          "ko-KR",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        ),
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
