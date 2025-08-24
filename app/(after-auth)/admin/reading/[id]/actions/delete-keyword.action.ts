"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canDeleteKeyword } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const deleteKeyword = async (keywordId: string) => {
  if (!keywordId) {
    return { error: "Keyword ID is required" };
  }

  // Check permissions
  const session = await auth();
  if (!canDeleteKeyword(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete keywords" };
  }

  try {
    const existingKeyword = await prisma.rCKeyword.findUnique({
      where: { id: keywordId },
      include: {
        RCQuestionSet: {
          include: {
            _count: {
              select: {
                RCQuestion: true,
              },
            },
          },
        },
      },
    });

    if (!existingKeyword) {
      return { error: "Keyword not found" };
    }

    // Delete the keyword (this will cascade delete the question set and questions)
    await prisma.rCKeyword.delete({
      where: { id: keywordId },
    });

    revalidatePath("/admin/reading");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete keyword:", error);
    return {
      error: "Failed to delete keyword. Please try again.",
    };
  }
};
