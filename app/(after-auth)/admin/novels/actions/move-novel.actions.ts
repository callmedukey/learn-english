"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export async function moveNovelToARLevel(novelId: string, newARId: string) {
  try {
    // Get the current novel with its AR level
    const currentNovel = await prisma.novel.findUnique({
      where: {
        id: novelId,
      },
      select: {
        ARId: true,
      },
    });

    if (!currentNovel) {
      return { success: false, error: "Novel not found" };
    }

    // Update the novel's AR level
    const updatedNovel = await prisma.novel.update({
      where: {
        id: novelId,
      },
      data: {
        ARId: newARId,
      },
      include: {
        AR: true,
      },
    });

    // Revalidate both the old and new AR level pages
    if (currentNovel.ARId) {
      revalidatePath(`/admin/novels/${currentNovel.ARId}`);
    }
    revalidatePath(`/admin/novels/${newARId}`);
    revalidatePath("/admin/novels");

    return { success: true, novel: updatedNovel };
  } catch (error) {
    console.error("Failed to move novel:", error);
    return { success: false, error: "Failed to move novel" };
  }
}
