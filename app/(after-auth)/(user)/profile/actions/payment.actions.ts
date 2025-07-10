"use server";

import { getPaymentConfig } from "@/lib/utils/payment-config";
import { CouponRecurringType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

import {
  validateCoupon,
  calculateDiscountedPrice,
} from "../queries/plans.query";

function generateOrderId(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER_${timestamp}_${random}`;
}

export async function deletePaymentAction(paymentId: string) {
  try {
    await prisma.payment.delete({
      where: { id: paymentId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Failed to delete payment record" };
  }
}

export async function createPaymentAction(data: {
  userId: string;
  planId: string;
  couponCode?: string;
  customerEmail: string;
  customerName: string;
  customerMobilePhone?: string;
  isRecurring?: boolean; // For initial subscription that will auto-renew
}) {
  try {
    // Get plan and user details
    const [plan, user] = await Promise.all([
      prisma.plan.findUnique({
        where: { id: data.planId },
      }),
      prisma.user.findUnique({
        where: { id: data.userId },
        include: { country: true },
      }),
    ]);

    if (!plan || !plan.isActive) {
      return {
        success: false,
        error: "Invalid or inactive plan",
      };
    }

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get payment configuration based on user country
    const paymentConfig = getPaymentConfig(user, plan);

    // Determine if this is a recurring payment based on user type and settings
    const isRecurringPayment = data.isRecurring && paymentConfig.supportsAutoRenewal;
    
    // Validate coupon if provided
    let coupon = null;
    if (data.couponCode) {
      const paymentTypeForCoupon = isRecurringPayment ? "RECURRING" : "ONE_TIME";
      coupon = await validateCoupon(data.couponCode, paymentTypeForCoupon);
      if (!coupon) {
        // Try to get more specific error by checking without usage limit
        const couponWithoutLimit = await validateCoupon(data.couponCode, paymentTypeForCoupon, false);
        if (couponWithoutLimit && couponWithoutLimit.maxRecurringUses !== null) {
          return {
            success: false,
            error: "This coupon has reached its maximum number of uses",
          };
        }
        return {
          success: false,
          error: isRecurringPayment 
            ? "Invalid coupon or this coupon can only be used for one-time payments" 
            : "Invalid coupon or this coupon can only be used for recurring payments",
        };
      }
    }

    // Calculate final price based on user's currency
    const basePrice =
      paymentConfig.currency === "KRW"
        ? plan.price
        : (plan.priceUSD || plan.price / 1300) * 100;
    const priceCalculation = await calculateDiscountedPrice(
      basePrice, 
      coupon, 
      paymentConfig.currency as "KRW" | "USD"
    );

    // Generate order ID
    const orderId = generateOrderId();

    // Determine payment type
    const paymentType =
      data.isRecurring && paymentConfig.supportsAutoRenewal
        ? "INITIAL_SUBSCRIPTION"
        : "ONE_TIME";

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        couponId: coupon?.id,
        couponCode: coupon?.code,
        originalAmount: priceCalculation.originalPrice,
        discountAmount: priceCalculation.discountAmount,
        paymentKey: `TEMP_${orderId}`, // Temporary key, will be updated by Toss-Payment
        orderId,
        orderName: `${plan.name} - Learn English Subscription`,
        amount: priceCalculation.finalPrice,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerMobilePhone: data.customerMobilePhone,
        status: "PENDING",
        paymentType,
        currency: paymentConfig.currency,
      },
    });

    // Check if user has billing key
    const userWithBillingKey = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { billingKey: true },
    });

    return {
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        orderName: payment.orderName,
        amount: payment.amount,
        originalAmount: payment.originalAmount,
        discountAmount: payment.discountAmount,
        currency: payment.currency || "KRW",
        paymentType,
      },
      plan: {
        name: plan.name,
        duration: plan.duration,
      },
      paymentConfig,
      hasBillingKey: !!userWithBillingKey?.billingKey,
    };
  } catch (error) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      error: "Failed to create payment",
    };
  }
}

export async function createFreeSubscriptionAction(data: {
  userId: string;
  planId: string;
  couponCode: string; // Required for free subscriptions
  customerEmail: string;
  customerName: string;
  customerMobilePhone?: string;
}) {
  try {
    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: data.planId },
    });

    if (!plan || !plan.isActive) {
      return {
        success: false,
        error: "Invalid or inactive plan",
      };
    }

    // Validate coupon - required for free subscriptions
    // Free subscriptions are always one-time payments
    const coupon = await validateCoupon(data.couponCode, "ONE_TIME");
    if (!coupon) {
      return {
        success: false,
        error: "Invalid or expired coupon code. Note: Only one-time payment coupons can be used for free subscriptions.",
      };
    }

    // Calculate final price and verify it's 0
    const priceCalculation = await calculateDiscountedPrice(plan.price, coupon, "KRW");

    if (priceCalculation.finalPrice !== 0) {
      return {
        success: false,
        error: "This coupon does not provide a full discount",
      };
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000,
    );

    // Create payment and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record with FREE status
      const payment = await tx.payment.create({
        data: {
          userId: data.userId,
          planId: data.planId,
          couponId: coupon.id,
          couponCode: coupon.code,
          originalAmount: priceCalculation.originalPrice,
          discountAmount: priceCalculation.discountAmount,
          paymentKey: `FREE_COUPON_${orderId}`,
          orderId,
          orderName: `${plan.name} - Learn English Subscription (Free via Coupon)`,
          amount: 0,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          customerMobilePhone: data.customerMobilePhone,
          status: "PAID",
          method: "COUPON",
          approvedAt: new Date(),
        },
      });

      // Create user subscription
      const subscription = await tx.userSubscription.create({
        data: {
          userId: data.userId,
          planId: data.planId,
          paymentId: payment.id,
          status: "ACTIVE",
          startDate,
          endDate,
        },
      });

      // Mark one-time-use coupon as inactive
      if (coupon.oneTimeUse) {
        await tx.discountCoupon.update({
          where: { id: coupon.id },
          data: { active: false },
        });
      }

      return { payment, subscription };
    });

    return {
      success: true,
      payment: {
        id: result.payment.id,
        orderId: result.payment.orderId,
        orderName: result.payment.orderName,
        amount: result.payment.amount,
        originalAmount: result.payment.originalAmount,
        discountAmount: result.payment.discountAmount,
      },
      subscription: {
        id: result.subscription.id,
        endDate: result.subscription.endDate,
      },
      plan: {
        name: plan.name,
        duration: plan.duration,
      },
    };
  } catch (error) {
    console.error("Error creating free subscription:", error);
    return {
      success: false,
      error: "Failed to create free subscription",
    };
  }
}

export async function createCouponApplicationAction(data: {
  subscriptionId: string;
  couponId: string;
  userId: string;
}) {
  try {
    // Get the coupon details
    const coupon = await prisma.discountCoupon.findUnique({
      where: { id: data.couponId },
    });

    if (!coupon) {
      return {
        success: false,
        error: "Coupon not found",
      };
    }

    // Check if coupon supports recurring payments
    if (coupon.recurringType === CouponRecurringType.ONE_TIME) {
      // Don't create application for one-time coupons
      return {
        success: true,
        message: "Coupon is for one-time payments only",
      };
    }

    // Verify the subscription belongs to the user
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        id: data.subscriptionId,
        userId: data.userId,
      },
    });

    if (!subscription) {
      return {
        success: false,
        error: "Subscription not found or doesn't belong to user",
      };
    }

    // Create coupon application for recurring usage
    const couponApplication = await prisma.couponApplication.create({
      data: {
        subscriptionId: data.subscriptionId,
        couponId: data.couponId,
        remainingMonths: coupon.recurringMonths, // null means forever
        isActive: true,
        discountPercentage: coupon.discount > 0 ? coupon.discount : null,
        flatDiscountKRW: coupon.flatDiscount > 0 ? coupon.flatDiscount : null,
        flatDiscountUSD: coupon.flatDiscountUSD && coupon.flatDiscountUSD > 0 ? coupon.flatDiscountUSD : null,
      },
    });

    return {
      success: true,
      couponApplication: {
        id: couponApplication.id,
        remainingMonths: couponApplication.remainingMonths,
      },
    };
  } catch (error) {
    console.error("Error creating coupon application:", error);
    return {
      success: false,
      error: "Failed to create coupon application",
    };
  }
}
