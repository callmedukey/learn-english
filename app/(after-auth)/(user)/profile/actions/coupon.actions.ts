"use server";

import {
  validateCoupon,
  calculateDiscountedPrice,
} from "../queries/plans.query";

export async function validateCouponAction(code: string) {
  try {
    const coupon = await validateCoupon(code);

    if (!coupon) {
      return {
        success: false,
        error: "Invalid or expired coupon code",
        coupon: null,
      };
    }

    return {
      success: true,
      coupon,
      error: null,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      success: false,
      error: "Failed to validate coupon",
      coupon: null,
    };
  }
}

export async function calculatePriceWithCouponAction(
  originalPrice: number,
  couponCode?: string,
) {
  try {
    let coupon = null;

    if (couponCode) {
      coupon = await validateCoupon(couponCode);
    }

    const result = await calculateDiscountedPrice(originalPrice, coupon);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error("Error calculating price:", error);
    return {
      success: false,
      originalPrice,
      discountAmount: 0,
      finalPrice: originalPrice,
      coupon: null,
    };
  }
}
