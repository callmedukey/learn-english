"use server";

import { z } from "zod";

import { Prisma } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const deleteAccountSchema = z.object({
  reason: z.string().optional(),
  confirmText: z.literal("DELETE"),
});

export type DeleteAccountType = z.infer<typeof deleteAccountSchema>;

export async function deleteAccount(userId: string, data: DeleteAccountType) {
  try {
    // Validate the input
    const parsed = deleteAccountSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input data",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // Get the user to verify they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isDeleted: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    if (user.isDeleted) {
      return {
        success: false,
        error: "Account has already been deleted",
      };
    }

    // Generate anonymized email
    const timestamp = Date.now();
    const anonymizedEmail = `deleted_${timestamp}@deleted.local`;

    // Perform soft delete: update user fields to anonymize data
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Soft delete flags
        isDeleted: true,
        deletedAt: new Date(),
        deletionReason: parsed.data.reason || null,

        // Anonymize personal information
        email: anonymizedEmail,
        name: null,
        nickname: null,
        parentName: null,
        parentPhone: null,
        studentName: null,
        studentPhone: null,

        // Clear billing info
        billingKey: null,
        billingAuthKey: null,
        billingKeyIssuedAt: null,
        billingMethod: null,
        cardInfo: Prisma.JsonNull,
      },
    });

    // Delete all sessions for this user to force immediate logout
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete all device tokens for push notifications
    await prisma.deviceToken.deleteMany({
      where: { userId },
    });

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: "An unexpected error occurred while deleting your account",
    };
  }
}
