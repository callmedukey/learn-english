"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const deleteNovel = async (novelId: string) => {
  try {
    const novel = await prisma.novel.delete({
      where: {
        id: novelId,
      },
      include: {
        AR: true,
      },
    });

    revalidatePath(`/admin/novels/${novel.AR?.id}`);
    revalidatePath(`/admin/novels/${novel.AR?.id}/novels`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete novel:", error);
    return {
      error: "Failed to delete novel. Please try again.",
    };
  }
};
