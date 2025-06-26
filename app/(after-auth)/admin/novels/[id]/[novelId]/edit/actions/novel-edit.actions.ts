"use server";

import console from "console";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const updateNovelAction = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const arId = formData.get("arId") as string;
  const hidden = formData.get("hidden") === "on";
  const comingSoon = formData.get("comingSoon") === "on";
  
  // Challenge update fields
  const updateChallenge = formData.get("updateChallenge") === "true";
  const challengeId = formData.get("challengeId") as string;
  const includeInChallenge = formData.get("includeInChallenge") === "true";

  if (!novelId || !title || !arId) {
    return {
      error: "Novel ID, title, and AR level are required",
    };
  }

  try {
    const existingNovel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: { AR: true },
    });

    if (!existingNovel) {
      return { error: "Novel not found" };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update novel basic info
      await tx.novel.update({
        where: { id: novelId },
        data: {
          title,
          description: description || null,
          ARId: arId,
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

      const finalUpdatedNovel = await tx.novel.findUnique({
        where: { id: novelId },
        include: { AR: true },
      });
      return finalUpdatedNovel;
    });

    revalidatePath(`/admin/novels`);
    revalidatePath(`/admin/novels/${arId}`);
    revalidatePath(`/admin/novels/${arId}/${novelId}/edit`);
    revalidatePath("/admin/challenges");
    return { success: true, novel: result };
  } catch (error) {
    console.error("Failed to update novel:", error);

    return {
      error: "Failed to update novel. Please try again.",
    };
  }
};

export const deleteNovelAction = async (novelId: string) => {
  if (!novelId) {
    return { error: "Novel ID is required for deletion" };
  }

  try {
    const novelToDelete = await prisma.novel.findUnique({
      where: { id: novelId },
      include: { AR: true },
    });

    if (!novelToDelete) {
      return { error: "Novel not found. Cannot delete." };
    }

    await prisma.$transaction(async (tx) => {
      // Delete all related data (cascading should handle this, but being explicit)

      await tx.novel.delete({
        where: { id: novelId },
      });
    });

    revalidatePath("/admin/novels");
    revalidatePath(`/admin/novels/${novelToDelete.ARId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete novel:", error);
    return {
      error: "Failed to delete novel. Please try again.",
    };
  }
};
