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

export async function updateRCLevelDefaults(prevState: any, formData: FormData) {
  try {
    const levelId = formData.get("levelId") as string;
    const defaultTimer = parseInt(formData.get("defaultTimer") as string);
    const defaultScore = parseInt(formData.get("defaultScore") as string);

    // Validate inputs
    if (isNaN(defaultTimer) || isNaN(defaultScore)) {
      return { success: false, error: "Invalid input values" };
    }

    if (defaultTimer < 0 || defaultScore < 0) {
      return { success: false, error: "Values cannot be negative" };
    }

    if (!levelId) {
      return { success: false, error: "Level ID is required" };
    }

    // Check if settings exist
    const existingSettings = await prisma.rCLevelSettings.findUnique({
      where: { RCLevelId: levelId },
    });

    if (existingSettings) {
      // Update existing settings
      await prisma.rCLevelSettings.update({
        where: { RCLevelId: levelId },
        data: { defaultTimer, defaultScore },
      });
    } else {
      // Create new settings
      await prisma.rCLevelSettings.create({
        data: {
          RCLevelId: levelId,
          defaultTimer,
          defaultScore,
        },
      });
    }

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating RC level defaults:", error);
    return { success: false, error: "Failed to update level defaults" };
  }
}

export async function updateARLevelDefaults(prevState: any, formData: FormData) {
  try {
    const levelId = formData.get("levelId") as string;
    const defaultTimer = parseInt(formData.get("defaultTimer") as string);
    const defaultScore = parseInt(formData.get("defaultScore") as string);

    // Validate inputs
    if (isNaN(defaultTimer) || isNaN(defaultScore)) {
      return { success: false, error: "Invalid input values" };
    }

    if (defaultTimer < 0 || defaultScore < 0) {
      return { success: false, error: "Values cannot be negative" };
    }

    if (!levelId) {
      return { success: false, error: "Level ID is required" };
    }

    // Check if settings exist
    const existingSettings = await prisma.aRSettings.findUnique({
      where: { ARId: levelId },
    });

    if (existingSettings) {
      // Update existing settings
      await prisma.aRSettings.update({
        where: { ARId: levelId },
        data: { defaultTimer, defaultScore },
      });
    } else {
      // Create new settings
      await prisma.aRSettings.create({
        data: {
          ARId: levelId,
          defaultTimer,
          defaultScore,
        },
      });
    }

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating AR level defaults:", error);
    return { success: false, error: "Failed to update level defaults" };
  }
}

export async function updateBPASettings(prevState: any, formData: FormData) {
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
    await prisma.bPASettings.update({
      where: { id: settingsId },
      data: { defaultTimer, defaultScore },
    });

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating BPA settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function updateBPALevelDefaults(prevState: any, formData: FormData) {
  try {
    const levelId = formData.get("levelId") as string;
    const defaultTimer = parseInt(formData.get("defaultTimer") as string);
    const defaultScore = parseInt(formData.get("defaultScore") as string);

    // Validate inputs
    if (isNaN(defaultTimer) || isNaN(defaultScore)) {
      return { success: false, error: "Invalid input values" };
    }

    if (defaultTimer < 0 || defaultScore < 0) {
      return { success: false, error: "Values cannot be negative" };
    }

    if (!levelId) {
      return { success: false, error: "Level ID is required" };
    }

    // Check if settings exist
    const existingSettings = await prisma.bPALevelSettings.findUnique({
      where: { bpaLevelId: levelId },
    });

    if (existingSettings) {
      // Update existing settings
      await prisma.bPALevelSettings.update({
        where: { bpaLevelId: levelId },
        data: { defaultTimer, defaultScore },
      });
    } else {
      // Create new settings
      await prisma.bPALevelSettings.create({
        data: {
          bpaLevelId: levelId,
          defaultTimer,
          defaultScore,
        },
      });
    }

    // Revalidate the settings page
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating BPA level defaults:", error);
    return { success: false, error: "Failed to update level defaults" };
  }
}
