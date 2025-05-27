"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const createNovel = async (formData: FormData) => {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const level = formData.get("level") as string;

  if (!title || !level) {
    return {
      error: "Title, description, and level are required",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newNovel = await tx.novel.create({
        data: {
          title,
          description,
          AR: {
            connect: {
              id: level,
            },
          },
        },
      });

      return newNovel;
    });

    revalidatePath(`/admin/novels/${level}`);
    revalidatePath(`/admin/novels/${level}/create`);
    return { success: true, novel: result };
  } catch (error) {
    console.error("Failed to create novel:", error);

    return {
      error: "Failed to create novel. Please try again.",
    };
  }
};

export const updateNovel = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!novelId || !title || !description) {
    return {
      error: "Novel ID, title, and description are required for update",
    };
  }

  try {
    const existingNovel = await prisma.novel.findUnique({
      where: { id: novelId },
    });

    if (!existingNovel) {
      return { error: "Novel not found" };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.novel.update({
        where: { id: novelId },
        data: { title, description },
      });

      const finalUpdatedNovel = await tx.novel.findUnique({
        where: { id: novelId },
        include: { AR: true },
      });
      return finalUpdatedNovel;
    });

    revalidatePath(`/admin/novels`);
    revalidatePath(
      `/admin/novels/${encodeURIComponent(result?.AR?.level ?? "")}`,
      "layout",
    );
    revalidatePath(
      `/admin/novels/${encodeURIComponent(result?.AR?.level ?? "")}/${novelId}`,
      "layout",
    );
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
    });

    if (!novelToDelete) {
      return { error: "Novel not found. Cannot delete." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.novel.delete({
        where: { id: novelId },
      });
    });

    revalidatePath("/admin/novels");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete novel:", error);
    return {
      error: "Failed to delete novel. Please try again.",
    };
  }
};
