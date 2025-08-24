"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canDeleteNovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const deleteNovel = async (novelId: string) => {
  // Check permissions
  const session = await auth();
  if (!canDeleteNovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete novels" };
  }

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
