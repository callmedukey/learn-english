"server only";

import { prisma } from "@/prisma/prisma-client";

export async function getRCSettings() {
  try {
    let settings = await prisma.rCSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.rCSettings.create({
        data: {
          defaultTimer: 0,
          defaultScore: 0,
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching RC settings:", error);
    return null;
  }
}

export async function getNovelSettings() {
  try {
    let settings = await prisma.novelSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.novelSettings.create({
        data: {
          defaultTimer: 0,
          defaultScore: 0,
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching Novel settings:", error);
    return null;
  }
}
