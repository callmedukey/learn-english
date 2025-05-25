"use server";

import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { passwordSchema } from "@/lib/schemas/auth.schema";
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
