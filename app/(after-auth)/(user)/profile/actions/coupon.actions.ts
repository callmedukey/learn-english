"use server";

import {
  validateCoupon,
  calculateDiscountedPrice,
} from "../queries/plans.query";

export async function validateCouponAction(code: string, isKoreanUser: boolean = false) {
  try {
    // Korean users can only use RECURRING coupons
    // International users can only use ONE_TIME coupons
    const paymentType = isKoreanUser ? "RECURRING" : "ONE_TIME";
    const coupon = await validateCoupon(code, paymentType);

    if (!coupon) {
      // Try to get the coupon without type validation to provide better error message
      const couponWithoutType = await validateCoupon(code);
      if (couponWithoutType) {
        if (isKoreanUser && couponWithoutType.recurringType === "ONE_TIME") {
          return {
            success: false,
            error: "This coupon is only valid for international one-time payments",
            coupon: null,
          };
        } else if (!isKoreanUser && couponWithoutType.recurringType === "RECURRING") {
          return {
            success: false,
            error: "This coupon is only valid for Korean recurring payments",
            coupon: null,
          };
        }
      }
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
  currency: "KRW" | "USD" = "KRW",
) {
  try {
    let coupon = null;

    if (couponCode) {
      coupon = await validateCoupon(couponCode);
    }

    const result = await calculateDiscountedPrice(originalPrice, coupon, currency);

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
