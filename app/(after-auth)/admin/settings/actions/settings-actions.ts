"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export async function updateRCSettings(prevState: any, formData: FormData) {
  try {
    const settingsId = formData.get("settingsId") as string;
    const defaultTimer = parseInt(formData.get("defaultTimer") as string);
    const defaultScore = parseInt(formData.get("defaultScore") as string);

    // Validate inputs
    if (isNaN(defaultTimer) || isNaN(defaultScore)) {
      return { success: false, error: "Invalid input values" };
    }

    if (defaultTimer < 0 || defaultScore < 0) {
      return { success: false, error: "Values cannot be negative" };
    }

    if (!settingsId) {
      return { success: false, error: "Settings ID is required" };
    }

    // Update settings
    await prisma.rCSettings.update({
      where: { id: settingsId },
      data: { defaultTimer, defaultScore },
    });

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating RC settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function updateNovelSettings(prevState: any, formData: FormData) {
  try {
    const settingsId = formData.get("settingsId") as string;
    const defaultTimer = parseInt(formData.get("defaultTimer") as string);
    const defaultScore = parseInt(formData.get("defaultScore") as string);

    // Validate inputs
    if (isNaN(defaultTimer) || isNaN(defaultScore)) {
      return { success: false, error: "Invalid input values" };
    }

    if (defaultTimer < 0 || defaultScore < 0) {
      return { success: false, error: "Values cannot be negative" };
    }

    if (!settingsId) {
      return { success: false, error: "Settings ID is required" };
    }

    // Update settings
    await prisma.novelSettings.update({
      where: { id: settingsId },
      data: { defaultTimer, defaultScore },
    });

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating Novel settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
