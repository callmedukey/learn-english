"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";
import { revalidatePath } from "next/cache";

/**
 * Dismiss a popup - either just for now or for the entire month
 */
export async function dismissPopup(popupId: string, dismissForMonth: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    // Create or update dismissal record
    await prisma.userPopupDismissal.upsert({
      where: {
        userId_popupId: {
          userId: session.user.id,
          popupId,
        },
      },
      create: {
        userId: session.user.id,
        popupId,
        dismissedForMonth: dismissForMonth,
      },
      update: {
        dismissedForMonth: dismissForMonth,
      },
    });

    // Revalidate dashboard to refresh popup state
    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss popup:", error);
    throw new Error("Failed to dismiss popup");
  }
}