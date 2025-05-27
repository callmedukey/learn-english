"use server";

import console from "console";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const updateNovelAction = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const arId = formData.get("arId") as string;

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
        },
      });

      const finalUpdatedNovel = await tx.novel.findUnique({
        where: { id: novelId },
        include: { AR: true },
      });
      return finalUpdatedNovel;
    });

    revalidatePath(`/admin/novels`);
    revalidatePath(`/admin/novels/${arId}`);
    revalidatePath(`/admin/novels/${arId}/${novelId}/edit`);
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
