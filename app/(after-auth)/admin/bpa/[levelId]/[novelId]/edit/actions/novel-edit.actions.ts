"use server";

import console from "console";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canEditNovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const updateNovelAction = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const bpaLevelId = formData.get("bpaLevelId") as string;
  const hidden = formData.get("hidden") === "on";
  const comingSoon = formData.get("comingSoon") === "on";

  // Challenge update fields
  const updateChallenge = formData.get("updateChallenge") === "true";
  const challengeId = formData.get("challengeId") as string;
  const includeInChallenge = formData.get("includeInChallenge") === "true";

  if (!novelId || !title || !bpaLevelId) {
    return {
      error: "Novel ID, title, and BPA level are required",
    };
  }

  // Check user permissions
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const existingNovel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      include: { bpaLevel: true },
    });

    if (!existingNovel) {
      return { error: "Novel not found" };
    }

    // Check if user can edit this novel
    if (!canEditNovel(userRole, existingNovel.locked)) {
      return { error: "You don't have permission to edit this locked novel" };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update novel basic info
      await tx.bPANovel.update({
        where: { id: novelId },
        data: {
          title,
          description: description || null,
          bpaLevelId: bpaLevelId,
          hidden,
          comingSoon,
        },
      });

      // Handle challenge updates
      if (updateChallenge && challengeId) {
        const challenge = await tx.monthlyChallenge.findUnique({
          where: { id: challengeId },
        });

        if (challenge) {
          const currentNovelIds = challenge.novelIds || [];
          let updatedNovelIds: string[];

          if (includeInChallenge && !currentNovelIds.includes(novelId)) {
            // Add novel to challenge
            updatedNovelIds = [...currentNovelIds, novelId];
          } else if (!includeInChallenge && currentNovelIds.includes(novelId)) {
            // Remove novel from challenge
            updatedNovelIds = currentNovelIds.filter(id => id !== novelId);
          } else {
            // No change needed
            updatedNovelIds = currentNovelIds;
          }

          // Update the challenge with new novel list
          await tx.monthlyChallenge.update({
            where: { id: challengeId },
            data: {
              novelIds: updatedNovelIds,
            },
          });
        }
      }

      const finalUpdatedNovel = await tx.bPANovel.findUnique({
        where: { id: novelId },
        include: { bpaLevel: true },
      });
      return finalUpdatedNovel;
    });

    revalidatePath(`/admin/bpa`);
    revalidatePath(`/admin/bpa/${bpaLevelId}`);
    revalidatePath(`/admin/bpa/${bpaLevelId}/${novelId}/edit`);
    revalidatePath("/admin/challenges");
    return { success: true, novel: result };
  } catch (error) {
    console.error("Failed to update BPA novel:", error);

    return {
      error: "Failed to update BPA novel. Please try again.",
    };
  }
};

export const deleteNovelAction = async (novelId: string) => {
  if (!novelId) {
    return { error: "Novel ID is required for deletion" };
  }

  try {
    const novelToDelete = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      include: { bpaLevel: true },
    });

    if (!novelToDelete) {
      return { error: "Novel not found. Cannot delete." };
    }

    await prisma.$transaction(async (tx) => {
      // Delete all related data (cascading should handle this, but being explicit)

      await tx.bPANovel.delete({
        where: { id: novelId },
      });
    });

    revalidatePath("/admin/bpa");
    revalidatePath(`/admin/bpa/${novelToDelete.bpaLevelId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete BPA novel:", error);
    return {
      error: "Failed to delete BPA novel. Please try again.",
    };
  }
};
