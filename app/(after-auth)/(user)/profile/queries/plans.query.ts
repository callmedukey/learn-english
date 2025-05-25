"server only";

import { Plan, DiscountCoupon } from "@/prisma/generated/prisma";
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

export async function validateCoupon(
  code: string,
): Promise<DiscountCoupon | null> {
  if (!code.trim()) {
    return null;
  }

  return prisma.discountCoupon.findFirst({
    where: {
      code: code.toUpperCase(),
      active: true,
    },
  });
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
