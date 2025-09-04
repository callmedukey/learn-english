"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { nicknameRegex } from "@/lib/regex/auth.regex";
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

const updateBirthdaySchema = z.object({
  birthday: z.coerce.date(),
});

export type UpdateBirthdayType = z.infer<typeof updateBirthdaySchema>;

const updateNicknameSchema = z.object({
  nickname: z.string()
    .min(3, "Nickname must be at least 3 characters")
    .max(8, "Nickname must be at most 8 characters")
    .regex(nicknameRegex, "Nickname must contain only lowercase letters and numbers"),
});

export type UpdateNicknameType = z.infer<typeof updateNicknameSchema>;

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

export async function updateBirthday(userId: string, data: UpdateBirthdayType) {
  try {
    // Validate the input
    const parsed = updateBirthdaySchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid birthday value",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Get the current user to check if they can update birthday
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthdayChangedAt: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if user has already changed their birthday
    if (user.birthdayChangedAt !== null) {
      return {
        success: false,
        error: "Birthday can only be changed once",
      };
    }

    // Update the birthday and mark it as changed
    await prisma.user.update({
      where: { id: userId },
      data: { 
        birthday: parsed.data.birthday,
        birthdayChangedAt: new Date(),
      },
    });

    // Revalidate the dashboard page to update the leaderboard with new grade
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Birthday updated successfully",
    };
  } catch (error) {
    console.error("Error updating birthday:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function updateNickname(userId: string, data: UpdateNicknameType) {
  try {
    // Validate the input
    const parsed = updateNicknameSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid nickname",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Check if nickname is already taken (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        nickname: {
          equals: parsed.data.nickname,
          mode: "insensitive",
        },
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: "This nickname is already taken",
        fieldErrors: { nickname: ["This nickname is already taken"] },
      };
    }

    // Update the nickname
    await prisma.user.update({
      where: { id: userId },
      data: { nickname: parsed.data.nickname },
    });

    // Revalidate the settings page
    revalidatePath("/profile/settings");

    return {
      success: true,
      message: "Nickname updated successfully",
    };
  } catch (error) {
    console.error("Error updating nickname:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
