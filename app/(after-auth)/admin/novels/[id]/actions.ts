"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export async function toggleNovelsHiddenStatus(
  novelIds: string[],
  setHidden: boolean,
) {
  try {
    await prisma.novel.updateMany({
      where: {
        id: {
          in: novelIds,
        },
      },
      data: {
        hidden: setHidden,
      },
    });

    // Revalidate the page
    revalidatePath("/admin/novels");

    return {
      success: true,
      message: `Successfully ${setHidden ? "hidden" : "shown"} ${
        novelIds.length
      } novel${novelIds.length !== 1 ? "s" : ""}`,
    };
  } catch (error) {
    console.error("Error updating novels:", error);
    return {
      success: false,
      message: "Failed to update novels",
    };
  }
}

export async function toggleNovelsComingSoonStatus(
  novelIds: string[],
  setComingSoon: boolean,
) {
  try {
    await prisma.novel.updateMany({
      where: {
        id: {
          in: novelIds,
        },
      },
      data: {
        comingSoon: setComingSoon,
      },
    });

    // Revalidate the page
    revalidatePath("/admin/novels");

    return {
      success: true,
      message: `Successfully ${setComingSoon ? "marked" : "unmarked"} ${
        novelIds.length
      } novel${novelIds.length !== 1 ? "s" : ""} as coming soon`,
    };
  } catch (error) {
    console.error("Error updating novels:", error);
    return {
      success: false,
      message: "Failed to update novels",
    };
  }
}
