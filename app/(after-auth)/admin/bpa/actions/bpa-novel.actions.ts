"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canDeleteBPANovel, canLockBPANovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function toggleBPANovelsHiddenStatus(
  novelIds: string[],
  setHidden: boolean,
) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to modify BPA novels" };
  }

  try {
    await prisma.bPANovel.updateMany({
      where: {
        id: {
          in: novelIds,
        },
      },
      data: {
        hidden: setHidden,
      },
    });

    revalidatePath("/admin/bpa");

    return {
      success: true,
      message: `Successfully ${setHidden ? "hidden" : "shown"} ${
        novelIds.length
      } novel${novelIds.length !== 1 ? "s" : ""}`,
    };
  } catch (error) {
    console.error("Error updating BPA novels:", error);
    return {
      success: false,
      message: "Failed to update novels",
    };
  }
}

export async function toggleBPANovelsComingSoonStatus(
  novelIds: string[],
  setComingSoon: boolean,
) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to modify BPA novels" };
  }

  try {
    await prisma.bPANovel.updateMany({
      where: {
        id: {
          in: novelIds,
        },
      },
      data: {
        comingSoon: setComingSoon,
      },
    });

    revalidatePath("/admin/bpa");

    return {
      success: true,
      message: `Successfully ${setComingSoon ? "marked" : "unmarked"} ${
        novelIds.length
      } novel${novelIds.length !== 1 ? "s" : ""} as coming soon`,
    };
  } catch (error) {
    console.error("Error updating BPA novels:", error);
    return {
      success: false,
      message: "Failed to update novels",
    };
  }
}

export async function moveBPANovelToLevel(novelId: string, newLevelId: string) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to move BPA novels" };
  }

  try {
    const currentNovel = await prisma.bPANovel.findUnique({
      where: {
        id: novelId,
      },
      select: {
        bpaLevelId: true,
      },
    });

    if (!currentNovel) {
      return { success: false, error: "Novel not found" };
    }

    const updatedNovel = await prisma.bPANovel.update({
      where: {
        id: novelId,
      },
      data: {
        bpaLevelId: newLevelId,
      },
      include: {
        bpaLevel: true,
      },
    });

    // Revalidate both the old and new level pages
    if (currentNovel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${currentNovel.bpaLevelId}`);
    }
    revalidatePath(`/admin/bpa/${newLevelId}`);
    revalidatePath("/admin/bpa");

    return { success: true, novel: updatedNovel };
  } catch (error) {
    console.error("Failed to move BPA novel:", error);
    return { success: false, error: "Failed to move novel" };
  }
}

export async function toggleBPANovelLock(novelId: string) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!canLockBPANovel(userRole)) {
    return { error: "You don't have permission to lock/unlock BPA novels" };
  }

  try {
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { locked: true, bpaLevelId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    const updatedNovel = await prisma.bPANovel.update({
      where: { id: novelId },
      data: { locked: !novel.locked },
    });

    revalidatePath(`/admin/bpa`);
    if (novel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${novel.bpaLevelId}`);
    }

    return {
      success: true,
      locked: updatedNovel.locked,
      message: updatedNovel.locked
        ? "Novel locked successfully"
        : "Novel unlocked successfully",
    };
  } catch (error) {
    console.error("Failed to toggle BPA novel lock:", error);
    return { error: "Failed to update novel lock status" };
  }
}

export async function deleteBPANovel(novelId: string) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete BPA novels" };
  }

  try {
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { bpaLevelId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    await prisma.bPANovel.delete({
      where: { id: novelId },
    });

    revalidatePath(`/admin/bpa`);
    if (novel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${novel.bpaLevelId}`);
    }

    return { success: true, message: "Novel deleted successfully" };
  } catch (error) {
    console.error("Failed to delete BPA novel:", error);
    return { error: "Failed to delete novel" };
  }
}
