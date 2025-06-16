"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export async function toggleKeywordsHiddenStatus(
  keywordIds: string[],
  setHidden: boolean,
) {
  try {
    await prisma.rCKeyword.updateMany({
      where: {
        id: {
          in: keywordIds,
        },
      },
      data: {
        hidden: setHidden,
      },
    });

    // Revalidate the page
    revalidatePath("/admin/reading");

    return {
      success: true,
      message: `Successfully ${setHidden ? "hidden" : "shown"} ${
        keywordIds.length
      } keyword${keywordIds.length !== 1 ? "s" : ""}`,
    };
  } catch (error) {
    console.error("Error updating keywords:", error);
    return {
      success: false,
      message: "Failed to update keywords",
    };
  }
}
