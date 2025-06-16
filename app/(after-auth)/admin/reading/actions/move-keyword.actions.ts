"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export async function moveKeywordToRCLevel(
  keywordId: string,
  newRCLevelId: string,
) {
  try {
    // Get the current keyword with its RC level
    const currentKeyword = await prisma.rCKeyword.findUnique({
      where: {
        id: keywordId,
      },
      select: {
        rcLevelId: true,
      },
    });

    if (!currentKeyword) {
      return { success: false, error: "Keyword not found" };
    }

    // Update the keyword's RC level
    const updatedKeyword = await prisma.rCKeyword.update({
      where: {
        id: keywordId,
      },
      data: {
        rcLevelId: newRCLevelId,
      },
      include: {
        RCLevel: true,
      },
    });

    // Revalidate both the old and new RC level pages
    if (currentKeyword.rcLevelId) {
      revalidatePath(`/admin/reading/${currentKeyword.rcLevelId}`);
    }
    revalidatePath(`/admin/reading/${newRCLevelId}`);
    revalidatePath("/admin/reading");

    return { success: true, keyword: updatedKeyword };
  } catch (error) {
    console.error("Failed to move keyword:", error);
    return { success: false, error: "Failed to move keyword" };
  }
}
