"use server";

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

    // Validate coupon if provided
    let coupon = null;
    if (data.couponCode) {
      coupon = await validateCoupon(data.couponCode);
      if (!coupon) {
        return {
          success: false,
          error: "Invalid or expired coupon code",
        };
      }
    }

    // Calculate final price
    const priceCalculation = await calculateDiscountedPrice(plan.price, coupon);

    // Generate order ID
    const orderId = generateOrderId();

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
      },
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
      },
      plan: {
        name: plan.name,
        duration: plan.duration,
      },
    };
  } catch (error) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      error: "Failed to create payment",
    };
  }
}
