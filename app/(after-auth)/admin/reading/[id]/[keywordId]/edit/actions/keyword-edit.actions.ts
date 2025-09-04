"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canEditKeyword } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const updateKeywordAction = async (formData: FormData) => {
  const keywordId = formData.get("keywordId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const rcLevelId = formData.get("rcLevelId") as string;
  const isFree = formData.get("isFree") === "on";
  const hidden = formData.get("hidden") === "on";
  const comingSoon = formData.get("comingSoon") === "on";
  const isActive = formData.get("isActive") === "on";
  
  // Challenge update fields
  const updateChallenge = formData.get("updateChallenge") === "true";
  const challengeId = formData.get("challengeId") as string;
  const includeInChallenge = formData.get("includeInChallenge") === "true";

  if (!keywordId || !name || !rcLevelId) {
    return {
      error: "Keyword ID, name, and RC Level ID are required",
    };
  }

  // Check user permissions
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if keyword exists
    const existingKeyword = await prisma.rCKeyword.findUnique({
      where: { id: keywordId },
      include: {
        RCQuestionSet: true,
      },
    });

    if (!existingKeyword) {
      return { error: "Keyword not found" };
    }

    // Check if user can edit this keyword
    if (!canEditKeyword(userRole, existingKeyword.locked)) {
      return { error: "You don't have permission to edit this locked keyword" };
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

    // Use transaction to update keyword and handle challenge updates
    const result = await prisma.$transaction(async (tx) => {
      // Update the keyword
      const updatedKeyword = await tx.rCKeyword.update({
        where: { id: keywordId },
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          rcLevelId,
          isFree,
          hidden,
          comingSoon,
        },
      });

      // Update the question set's active status if it exists
      if (existingKeyword.RCQuestionSet) {
        await tx.rCQuestionSet.update({
          where: { id: existingKeyword.RCQuestionSet.id },
          data: {
            active: isActive,
          },
        });
      }
      
      // Handle challenge updates
      if (updateChallenge && challengeId) {
        const challenge = await tx.monthlyChallenge.findUnique({
          where: { id: challengeId },
        });
        
        if (challenge) {
          const currentKeywordIds = challenge.keywordIds || [];
          let updatedKeywordIds: string[];
          
          if (includeInChallenge && !currentKeywordIds.includes(keywordId)) {
            // Add keyword to challenge
            updatedKeywordIds = [...currentKeywordIds, keywordId];
          } else if (!includeInChallenge && currentKeywordIds.includes(keywordId)) {
            // Remove keyword from challenge
            updatedKeywordIds = currentKeywordIds.filter(id => id !== keywordId);
          } else {
            // No change needed
            updatedKeywordIds = currentKeywordIds;
          }
          
          // Update the challenge with new keyword list
          await tx.monthlyChallenge.update({
            where: { id: challengeId },
            data: {
              keywordIds: updatedKeywordIds,
            },
          });
        }
      }
      
      return updatedKeyword;
    });

    revalidatePath(`/admin/reading/${rcLevelId}`);
    revalidatePath("/admin/reading");
    revalidatePath("/admin/challenges");

    return { success: true, keyword: result };
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
