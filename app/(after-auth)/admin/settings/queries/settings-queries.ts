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

export async function getRCLevelDefaults() {
  try {
    const rcLevels = await prisma.rCLevel.findMany({
      include: {
        RCLevelSettings: true,
      },
      orderBy: {
        level: 'asc',
      },
    });

    // Create default settings for levels that don't have them
    for (const level of rcLevels) {
      if (!level.RCLevelSettings) {
        await prisma.rCLevelSettings.create({
          data: {
            RCLevelId: level.id,
            defaultTimer: 30,
            defaultScore: 100,
          },
        });
      }
    }

    // Fetch again with all settings created
    return await prisma.rCLevel.findMany({
      include: {
        RCLevelSettings: true,
      },
      orderBy: {
        level: 'asc',
      },
    });
  } catch (error) {
    console.error("Error fetching RC level defaults:", error);
    return [];
  }
}

export async function getARLevelDefaults() {
  try {
    const arLevels = await prisma.aR.findMany({
      include: {
        ARSettings: true,
      },
      orderBy: {
        level: 'asc',
      },
    });

    // Create default settings for levels that don't have them
    for (const level of arLevels) {
      if (!level.ARSettings) {
        await prisma.aRSettings.create({
          data: {
            ARId: level.id,
            defaultTimer: 30,
            defaultScore: 100,
          },
        });
      }
    }

    // Fetch again with all settings created
    return await prisma.aR.findMany({
      include: {
        ARSettings: true,
      },
      orderBy: {
        level: 'asc',
      },
    });
  } catch (error) {
    console.error("Error fetching AR level defaults:", error);
    return [];
  }
}

export async function getBPASettings() {
  try {
    let settings = await prisma.bPASettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.bPASettings.create({
        data: {
          defaultTimer: 0,
          defaultScore: 0,
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching BPA settings:", error);
    return null;
  }
}

export async function getBPALevelDefaults() {
  try {
    const bpaLevels = await prisma.bPALevel.findMany({
      include: {
        bpaLevelSettings: true,
      },
      orderBy: {
        orderNumber: 'asc',
      },
    });

    // Create default settings for levels that don't have them
    for (const level of bpaLevels) {
      if (!level.bpaLevelSettings) {
        await prisma.bPALevelSettings.create({
          data: {
            bpaLevelId: level.id,
            defaultTimer: 30,
            defaultScore: 100,
          },
        });
      }
    }

    // Fetch again with all settings created
    return await prisma.bPALevel.findMany({
      include: {
        bpaLevelSettings: true,
      },
      orderBy: {
        orderNumber: 'asc',
      },
    });
  } catch (error) {
    console.error("Error fetching BPA level defaults:", error);
    return [];
  }
}
