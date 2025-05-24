"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const deleteKeyword = async (keywordId: string) => {
  if (!keywordId) {
    return { error: "Keyword ID is required" };
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
