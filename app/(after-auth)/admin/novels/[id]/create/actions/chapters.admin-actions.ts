"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const createChapter = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string);
  const isFree = formData.get("isFree") === "on";

  if (!novelId || !title || isNaN(orderNumber)) {
    return {
      error: "Novel ID, title, description, and order number are required",
    };
  }

  try {
    // Check if novel exists
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        AR: true,
      },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    // Check if order number already exists for this novel
    const existingChapter = await prisma.novelChapter.findFirst({
      where: {
        novelId,
        orderNumber,
      },
    });

    if (existingChapter) {
      return {
        error: `Chapter with order number ${orderNumber} already exists`,
      };
    }

    const newChapter = await prisma.novelChapter.create({
      data: {
        novelId,
        title,
        description,
        orderNumber,
        isFree,
      },
    });

    revalidatePath(`/admin/novels`);
    revalidatePath(
      `/admin/novels/${encodeURIComponent(novel.AR?.level ?? "")}`,
      "layout",
    );
    revalidatePath(
      `/admin/novels/${encodeURIComponent(novel.AR?.level ?? "")}/${novelId}`,
      "layout",
    );
    return { success: true, chapter: newChapter };
  } catch (error) {
    console.error("Failed to create chapter:", error);
    return {
      error: "Failed to create chapter. Please try again.",
    };
  }
};

export const updateChapter = async (formData: FormData) => {
  const chapterId = formData.get("chapterId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string);
  const isFree = formData.get("isFree") === "on";

  if (!chapterId || !title || !description || isNaN(orderNumber)) {
    return {
      error: "Chapter ID, title, description, and order number are required",
    };
  }

  try {
    const existingChapter = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
    });

    if (!existingChapter) {
      return { error: "Chapter not found" };
    }

    // Check if order number conflicts with another chapter in the same novel
    const conflictingChapter = await prisma.novelChapter.findFirst({
      where: {
        novelId: existingChapter.novelId,
        orderNumber,
        id: { not: chapterId },
      },
    });

    if (conflictingChapter) {
      return {
        error: `Chapter with order number ${orderNumber} already exists`,
      };
    }

    const updatedChapter = await prisma.novelChapter.update({
      where: { id: chapterId },
      data: {
        title,
        description,
        orderNumber,
        isFree,
      },
    });

    revalidatePath(`/admin/novels`);
    revalidatePath(`/admin/novels/${existingChapter.novelId}`);
    return { success: true, chapter: updatedChapter };
  } catch (error) {
    console.error("Failed to update chapter:", error);
    return {
      error: "Failed to update chapter. Please try again.",
    };
  }
};

export const deleteChapterAction = async (chapterId: string) => {
  if (!chapterId) {
    return { error: "Chapter ID is required for deletion" };
  }

  try {
    const chapterToDelete = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapterToDelete) {
      return { error: "Chapter not found. Cannot delete." };
    }

    await prisma.novelChapter.delete({
      where: { id: chapterId },
    });

    revalidatePath(`/admin/novels`);
    revalidatePath(`/admin/novels/${chapterToDelete.novelId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete chapter:", error);
    return {
      error: "Failed to delete chapter. Please try again.",
    };
  }
};
