"use server";

import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { passwordSchema } from "@/lib/schemas/auth.schema";
import { Gender } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordType = z.infer<typeof changePasswordSchema>;

const updateGenderSchema = z.object({
  gender: z.nativeEnum(Gender),
});

export type UpdateGenderType = z.infer<typeof updateGenderSchema>;

export async function changePassword(userId: string, data: ChangePasswordType) {
  try {
    // Validate the input
    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Get the user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return {
        success: false,
        error: "User not found or no password set",
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(
      parsed.data.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return {
        success: false,
        error: "Current password is incorrect",
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      };
    }

    // Hash the new password
    const hashedNewPassword = await hash(parsed.data.newPassword, 12);

    // Update the password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function updateGender(userId: string, data: UpdateGenderType) {
  try {
    // Validate the input
    const parsed = updateGenderSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid gender value",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Get the current user to check if they can update gender
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if user is allowed to update gender (null or "Other")
    if (user.gender !== null && user.gender !== "Other") {
      return {
        success: false,
        error: "Gender can only be updated when it's not set or set to 'Other'",
      };
    }

    // Update the gender
    await prisma.user.update({
      where: { id: userId },
      data: { gender: parsed.data.gender },
    });

    return {
      success: true,
      message: "Gender updated successfully",
    };
  } catch (error) {
    console.error("Error updating gender:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
