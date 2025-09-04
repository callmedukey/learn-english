"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canLockKeyword } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function toggleKeywordLock(keywordId: string) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!canLockKeyword(userRole)) {
    return { error: "You don't have permission to lock/unlock keywords" };
  }

  try {
    const keyword = await prisma.rCKeyword.findUnique({
      where: { id: keywordId },
      select: { locked: true, rcLevelId: true },
    });

    if (!keyword) {
      return { error: "Keyword not found" };
    }

    const updatedKeyword = await prisma.rCKeyword.update({
      where: { id: keywordId },
      data: { locked: !keyword.locked },
    });

    revalidatePath(`/admin/reading`);
    revalidatePath(`/admin/reading/${keyword.rcLevelId}`);

    return { 
      success: true, 
      locked: updatedKeyword.locked,
      message: updatedKeyword.locked ? "Keyword locked successfully" : "Keyword unlocked successfully"
    };
  } catch (error) {
    console.error("Failed to toggle keyword lock:", error);
    return { error: "Failed to update keyword lock status" };
  }
}

export async function bulkToggleKeywordLock(keywordIds: string[], locked: boolean) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!canLockKeyword(userRole)) {
    return { error: "You don't have permission to lock/unlock keywords" };
  }

  try {
    await prisma.rCKeyword.updateMany({
      where: { id: { in: keywordIds } },
      data: { locked },
    });

    revalidatePath(`/admin/reading`);

    return { 
      success: true, 
      message: locked 
        ? `${keywordIds.length} keyword(s) locked successfully` 
        : `${keywordIds.length} keyword(s) unlocked successfully`
    };
  } catch (error) {
    console.error("Failed to bulk toggle keyword locks:", error);
    return { error: "Failed to update keyword lock status" };
  }
}