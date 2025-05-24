"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const updateKeywordAction = async (formData: FormData) => {
  const keywordId = formData.get("keywordId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const rcLevelId = formData.get("rcLevelId") as string;
  const isFree = formData.get("isFree") === "on";

  if (!keywordId || !name || !rcLevelId) {
    return {
      error: "Keyword ID, name, and RC Level ID are required",
    };
  }

  try {
    // Check if keyword exists
    const existingKeyword = await prisma.rCKeyword.findUnique({
      where: { id: keywordId },
    });

    if (!existingKeyword) {
      return { error: "Keyword not found" };
    }

    // Check if RC level exists
    const rcLevel = await prisma.rCLevel.findUnique({
      where: { id: rcLevelId },
    });

    if (!rcLevel) {
      return { error: "RC level not found" };
    }

    // Check for duplicate name in the target level (if changing levels)
    if (rcLevelId !== existingKeyword.rcLevelId) {
      const duplicateKeyword = await prisma.rCKeyword.findFirst({
        where: {
          rcLevelId,
          name: {
            equals: name,
            mode: "insensitive",
          },
          id: {
            not: keywordId,
          },
        },
      });

      if (duplicateKeyword) {
        return {
          error: "A keyword with this name already exists in the target level",
        };
      }
    }

    // Update the keyword
    const updatedKeyword = await prisma.rCKeyword.update({
      where: { id: keywordId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        rcLevelId,
        isFree,
      },
    });

    revalidatePath(`/admin/reading/${rcLevelId}`);
    revalidatePath("/admin/reading");

    return { success: true, keyword: updatedKeyword };
  } catch (error) {
    console.error("Failed to update keyword:", error);
    return {
      error: "Failed to update keyword. Please try again.",
    };
  }
};

export const deleteKeywordAction = async (keywordId: string) => {
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

    revalidatePath(`/admin/reading/${existingKeyword.rcLevelId}`);
    revalidatePath("/admin/reading");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete keyword:", error);
    return {
      error: "Failed to delete keyword. Please try again.",
    };
  }
};
