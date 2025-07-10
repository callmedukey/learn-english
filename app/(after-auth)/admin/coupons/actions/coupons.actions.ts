"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CouponRecurringType } from "@/prisma/generated/prisma";

import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  checkCouponExists,
} from "../queries/coupons.query";

const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code can only contain uppercase letters, numbers, hyphens, and underscores",
    ),
  discount: z
    .number()
    .min(0, "Discount percentage cannot be negative")
    .max(100, "Discount percentage cannot exceed 100%"),
  flatDiscount: z.number().min(0, "Flat discount cannot be negative"),
  flatDiscountUSD: z.number().min(0, "USD flat discount cannot be negative").optional().nullable(),
  active: z.boolean().optional(),
  oneTimeUse: z.boolean().optional(),
  deadline: z.date().optional().nullable(),
  recurringType: z.nativeEnum(CouponRecurringType).optional(),
  recurringMonths: z.number().min(1).optional().nullable(),
  maxRecurringUses: z.number().min(1).optional().nullable(),
});

const updateCouponSchema = z.object({
  id: z.string(),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Code can only contain uppercase letters, numbers, hyphens, and underscores",
    )
    .optional(),
  discount: z
    .number()
    .min(0, "Discount percentage cannot be negative")
    .max(100, "Discount percentage cannot exceed 100%")
    .optional(),
  flatDiscount: z
    .number()
    .min(0, "Flat discount cannot be negative")
    .optional(),
  flatDiscountUSD: z
    .number()
    .min(0, "USD flat discount cannot be negative")
    .optional()
    .nullable(),
  active: z.boolean().optional(),
  oneTimeUse: z.boolean().optional(),
  deadline: z.date().optional().nullable(),
  recurringType: z.nativeEnum(CouponRecurringType).optional(),
  recurringMonths: z.number().min(1).optional().nullable(),
  maxRecurringUses: z.number().min(1).optional().nullable(),
});

export async function createCouponAction(formData: FormData) {
  try {
    const deadlineStr = formData.get("deadline") as string;
    const recurringMonthsStr = formData.get("recurringMonths") as string;
    const maxRecurringUsesStr = formData.get("maxRecurringUses") as string;
    const flatDiscountUSDStr = formData.get("flatDiscountUSD") as string;
    
    const data = {
      code: formData.get("code") as string,
      discount: parseInt(formData.get("discount") as string) || 0,
      flatDiscount: parseInt(formData.get("flatDiscount") as string) || 0,
      flatDiscountUSD: flatDiscountUSDStr ? parseFloat(flatDiscountUSDStr) : null,
      active: formData.get("active") === "true",
      oneTimeUse: formData.get("oneTimeUse") === "true",
      deadline: deadlineStr ? new Date(deadlineStr) : null,
      recurringType: (formData.get("recurringType") as CouponRecurringType) || CouponRecurringType.ONE_TIME,
      recurringMonths: recurringMonthsStr ? parseInt(recurringMonthsStr) : null,
      maxRecurringUses: maxRecurringUsesStr ? parseInt(maxRecurringUsesStr) : null,
    };

    const validatedData = createCouponSchema.parse(data);

    // Validate that at least one discount type is provided
    const hasPercentageDiscount = (validatedData.discount ?? 0) > 0;
    const hasFlatDiscountKRW = (validatedData.flatDiscount ?? 0) > 0;
    const hasFlatDiscountUSD = (validatedData.flatDiscountUSD ?? 0) > 0;
    
    if (!hasPercentageDiscount && !hasFlatDiscountKRW && !hasFlatDiscountUSD) {
      return {
        success: false,
        error: "Either percentage discount or flat discount must be greater than 0",
      };
    }

    // Validate that only one discount type is provided
    const discountTypesCount = [hasPercentageDiscount, hasFlatDiscountKRW, hasFlatDiscountUSD].filter(Boolean).length;
    if (discountTypesCount > 1) {
      return {
        success: false,
        error: "Please provide only one discount type (percentage, flat KRW, or flat USD)",
      };
    }

    // Check if coupon code already exists
    const exists = await checkCouponExists(validatedData.code);
    if (exists) {
      return {
        success: false,
        error: "A coupon with this code already exists",
      };
    }

    await createCoupon({
      ...validatedData,
      flatDiscountUSD: validatedData.flatDiscountUSD ?? undefined,
    });

    revalidatePath("/admin/coupons");

    return {
      success: true,
      message: "Coupon created successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    console.error("Error creating coupon:", error);
    return {
      success: false,
      error: "Failed to create coupon",
    };
  }
}

export async function updateCouponAction(formData: FormData) {
  try {
    const deadlineStr = formData.get("deadline") as string;
    const recurringMonthsStr = formData.get("recurringMonths") as string;
    const maxRecurringUsesStr = formData.get("maxRecurringUses") as string;
    const flatDiscountUSDStr = formData.get("flatDiscountUSD") as string;
    
    const data = {
      id: formData.get("id") as string,
      code: formData.get("code") as string,
      discount: parseInt(formData.get("discount") as string) || 0,
      flatDiscount: parseInt(formData.get("flatDiscount") as string) || 0,
      flatDiscountUSD: flatDiscountUSDStr ? parseFloat(flatDiscountUSDStr) : null,
      active: formData.get("active") === "true",
      oneTimeUse: formData.get("oneTimeUse") === "true",
      deadline: deadlineStr === "" ? null : deadlineStr ? new Date(deadlineStr) : null,
      recurringType: (formData.get("recurringType") as CouponRecurringType) || CouponRecurringType.ONE_TIME,
      recurringMonths: recurringMonthsStr ? parseInt(recurringMonthsStr) : null,
      maxRecurringUses: maxRecurringUsesStr ? parseInt(maxRecurringUsesStr) : null,
    };

    const validatedData = updateCouponSchema.parse(data);

    // Validate that at least one discount type is provided
    const hasPercentageDiscount = (validatedData.discount ?? 0) > 0;
    const hasFlatDiscountKRW = (validatedData.flatDiscount ?? 0) > 0;
    const hasFlatDiscountUSD = (validatedData.flatDiscountUSD ?? 0) > 0;
    
    if (!hasPercentageDiscount && !hasFlatDiscountKRW && !hasFlatDiscountUSD) {
      return {
        success: false,
        error: "Either percentage discount or flat discount must be greater than 0",
      };
    }

    // Validate that only one discount type is provided
    const discountTypesCount = [hasPercentageDiscount, hasFlatDiscountKRW, hasFlatDiscountUSD].filter(Boolean).length;
    if (discountTypesCount > 1) {
      return {
        success: false,
        error: "Please provide only one discount type (percentage, flat KRW, or flat USD)",
      };
    }

    // Check if coupon code already exists (excluding current coupon)
    if (validatedData.code) {
      const exists = await checkCouponExists(
        validatedData.code,
        validatedData.id,
      );
      if (exists) {
        return {
          success: false,
          error: "A coupon with this code already exists",
        };
      }
    }

    await updateCoupon(validatedData.id, {
      code: validatedData.code,
      discount: validatedData.discount,
      flatDiscount: validatedData.flatDiscount,
      flatDiscountUSD: validatedData.flatDiscountUSD ?? undefined,
      active: validatedData.active,
      oneTimeUse: validatedData.oneTimeUse,
      deadline: validatedData.deadline,
      recurringType: validatedData.recurringType,
      recurringMonths: validatedData.recurringMonths,
      maxRecurringUses: validatedData.maxRecurringUses,
    });

    revalidatePath("/admin/coupons");

    return {
      success: true,
      message: "Coupon updated successfully",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    console.error("Error updating coupon:", error);
    return {
      success: false,
      error: "Failed to update coupon",
    };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    await deleteCoupon(id);

    revalidatePath("/admin/coupons");

    return {
      success: true,
      message: "Coupon deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return {
      success: false,
      error: "Failed to delete coupon",
    };
  }
}

export async function toggleCouponStatusAction(id: string, active: boolean) {
  try {
    await updateCoupon(id, { active });

    revalidatePath("/admin/coupons");

    return {
      success: true,
      message: `Coupon ${active ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    return {
      success: false,
      error: "Failed to update coupon status",
    };
  }
}
