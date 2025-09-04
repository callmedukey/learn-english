"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canLockNovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function toggleNovelLock(novelId: string) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!canLockNovel(userRole)) {
    return { error: "You don't have permission to lock/unlock novels" };
  }

  try {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      select: { locked: true, ARId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    const updatedNovel = await prisma.novel.update({
      where: { id: novelId },
      data: { locked: !novel.locked },
    });

    revalidatePath(`/admin/novels`);
    if (novel.ARId) {
      revalidatePath(`/admin/novels/${novel.ARId}`);
    }

    return { 
      success: true, 
      locked: updatedNovel.locked,
      message: updatedNovel.locked ? "Novel locked successfully" : "Novel unlocked successfully"
    };
  } catch (error) {
    console.error("Failed to toggle novel lock:", error);
    return { error: "Failed to update novel lock status" };
  }
}

export async function bulkToggleNovelLock(novelIds: string[], locked: boolean) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!canLockNovel(userRole)) {
    return { error: "You don't have permission to lock/unlock novels" };
  }

  try {
    await prisma.novel.updateMany({
      where: { id: { in: novelIds } },
      data: { locked },
    });

    revalidatePath(`/admin/novels`);

    return { 
      success: true, 
      message: locked 
        ? `${novelIds.length} novel(s) locked successfully` 
        : `${novelIds.length} novel(s) unlocked successfully`
    };
  } catch (error) {
    console.error("Failed to bulk toggle novel locks:", error);
    return { error: "Failed to update novel lock status" };
  }
}