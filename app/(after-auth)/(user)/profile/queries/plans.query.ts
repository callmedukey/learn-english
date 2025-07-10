"server only";

import {
  Plan,
  DiscountCoupon,
  UserSubscription,
} from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function getActivePlans(): Promise<Plan[]> {
  return prisma.plan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });
}

export interface UserActiveSubscription extends UserSubscription {
  plan: Plan;
}

export async function getUserActiveSubscription(
  userId: string,
): Promise<UserActiveSubscription | null> {
  return prisma.userSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: {
        gt: new Date(),
      },
    },
    include: {
      plan: true,
    },
    orderBy: {
      endDate: "desc",
    },
  });
}

export async function validateCoupon(
  code: string,
  paymentType?: "ONE_TIME" | "RECURRING",
  checkUsageLimit: boolean = true,
): Promise<DiscountCoupon | null> {
  if (!code.trim()) {
    return null;
  }

  const coupon = await prisma.discountCoupon.findFirst({
    where: {
      code: code.toUpperCase(),
      active: true,
    },
    include: {
      _count: {
        select: {
          payments: true, // Count total uses for one-time coupons
          couponApplications: true, // Count subscriptions for recurring coupons
        },
      },
    },
  });

  if (!coupon) {
    return null;
  }

  // Check if coupon has expired
  if (coupon.deadline && new Date(coupon.deadline) < new Date()) {
    return null;
  }

  // Check payment type compatibility if specified
  if (paymentType) {
    // ONE_TIME payment requires ONE_TIME coupon
    if (paymentType === "ONE_TIME" && coupon.recurringType === "RECURRING") {
      return null;
    }
    // RECURRING payment requires RECURRING coupon
    if (paymentType === "RECURRING" && coupon.recurringType === "ONE_TIME") {
      return null;
    }
  }

  // Check usage limits based on coupon type
  if (checkUsageLimit && coupon.maxRecurringUses !== null) {
    if (coupon.recurringType === "RECURRING") {
      // For recurring coupons, check number of subscriptions started
      if (coupon._count.couponApplications >= coupon.maxRecurringUses) {
        return null;
      }
    } else {
      // For one-time coupons, check total payment uses
      if (coupon._count.payments >= coupon.maxRecurringUses) {
        return null;
      }
    }
  }

  return coupon;
}

export async function calculateDiscountedPrice(
  originalPrice: number,
  coupon: DiscountCoupon | null,
  currency: "KRW" | "USD" = "KRW",
): Promise<{
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  coupon: DiscountCoupon | null;
}> {
  if (!coupon) {
    return {
      originalPrice,
      discountAmount: 0,
      finalPrice: originalPrice,
      coupon: null,
    };
  }

  let discountAmount = 0;

  if (coupon.discount > 0) {
    // Percentage discount applies to any currency
    discountAmount = Math.floor((originalPrice * coupon.discount) / 100);
  } else if (currency === "USD" && coupon.flatDiscountUSD && coupon.flatDiscountUSD > 0) {
    // USD flat discount for international users (price is in cents)
    discountAmount = Math.min(Math.round(coupon.flatDiscountUSD * 100), originalPrice);
  } else if (currency === "KRW" && coupon.flatDiscount > 0) {
    // KRW flat discount for Korean users
    discountAmount = Math.min(coupon.flatDiscount, originalPrice);
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  return {
    originalPrice,
    discountAmount,
    finalPrice,
    coupon,
  };
}
