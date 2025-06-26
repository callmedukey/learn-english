"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

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
  active: z.boolean().optional(),
  oneTimeUse: z.boolean().optional(),
  deadline: z.date().optional().nullable(),
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
  active: z.boolean().optional(),
  oneTimeUse: z.boolean().optional(),
  deadline: z.date().optional().nullable(),
});

export async function createCouponAction(formData: FormData) {
  try {
    const deadlineStr = formData.get("deadline") as string;
    const data = {
      code: formData.get("code") as string,
      discount: parseInt(formData.get("discount") as string) || 0,
      flatDiscount: parseInt(formData.get("flatDiscount") as string) || 0,
      active: formData.get("active") === "true",
      oneTimeUse: formData.get("oneTimeUse") === "true",
      deadline: deadlineStr ? new Date(deadlineStr) : null,
    };

    const validatedData = createCouponSchema.parse(data);

    // Validate that exactly one discount type is provided
    if (
      (validatedData.discount ?? 0) === 0 &&
      (validatedData.flatDiscount ?? 0) === 0
    ) {
      return {
        success: false,
        error:
          "Either percentage discount or flat discount must be greater than 0",
      };
    }

    if (
      (validatedData.discount ?? 0) > 0 &&
      (validatedData.flatDiscount ?? 0) > 0
    ) {
      return {
        success: false,
        error:
          "You can only use either percentage discount OR flat discount, not both",
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

    await createCoupon(validatedData);

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
    const data = {
      id: formData.get("id") as string,
      code: formData.get("code") as string,
      discount: parseInt(formData.get("discount") as string) || 0,
      flatDiscount: parseInt(formData.get("flatDiscount") as string) || 0,
      active: formData.get("active") === "true",
      oneTimeUse: formData.get("oneTimeUse") === "true",
      deadline: deadlineStr === "" ? null : deadlineStr ? new Date(deadlineStr) : null,
    };

    const validatedData = updateCouponSchema.parse(data);

    // Validate that exactly one discount type is provided
    if (
      (validatedData.discount ?? 0) === 0 &&
      (validatedData.flatDiscount ?? 0) === 0
    ) {
      return {
        success: false,
        error:
          "Either percentage discount or flat discount must be greater than 0",
      };
    }

    if (
      (validatedData.discount ?? 0) > 0 &&
      (validatedData.flatDiscount ?? 0) > 0
    ) {
      return {
        success: false,
        error:
          "You can only use either percentage discount OR flat discount, not both",
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
      active: validatedData.active,
      oneTimeUse: validatedData.oneTimeUse,
      deadline: validatedData.deadline,
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
