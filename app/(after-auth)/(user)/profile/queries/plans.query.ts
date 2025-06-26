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
): Promise<DiscountCoupon | null> {
  if (!code.trim()) {
    return null;
  }

  const coupon = await prisma.discountCoupon.findFirst({
    where: {
      code: code.toUpperCase(),
      active: true,
    },
  });

  if (!coupon) {
    return null;
  }

  // Check if coupon has expired
  if (coupon.deadline && new Date(coupon.deadline) < new Date()) {
    return null;
  }

  return coupon;
}

export async function calculateDiscountedPrice(
  originalPrice: number,
  coupon: DiscountCoupon | null,
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
    // Percentage discount
    discountAmount = Math.floor((originalPrice * coupon.discount) / 100);
  } else if (coupon.flatDiscount > 0) {
    // Flat discount
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
