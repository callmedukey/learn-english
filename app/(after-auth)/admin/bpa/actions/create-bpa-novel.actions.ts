"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canCreateBPANovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const createBPANovelAction = async (formData: FormData) => {
  const session = await auth();
  if (!canCreateBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to create BPA novels" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const levelId = formData.get("levelId") as string;

  if (!title || !levelId) {
    return {
      error: "Title and level ID are required",
    };
  }

  try {
    // Verify the level exists
    const level = await prisma.bPALevel.findUnique({
      where: { id: levelId },
    });

    if (!level) {
      return { error: "BPA level not found" };
    }

    const novel = await prisma.bPANovel.create({
      data: {
        title,
        description,
        bpaLevelId: levelId,
      },
    });

    revalidatePath("/admin/bpa");
    revalidatePath(`/admin/bpa/${levelId}`);

    return { success: true, novelId: novel.id };
  } catch (error) {
    console.error("Failed to create BPA novel:", error);
    return { error: "Failed to create BPA novel. Please try again." };
  }
};
