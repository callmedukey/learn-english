import "server-only";

import { prisma } from "@/prisma/prisma-client";

interface UserMedalCounts {
  totalGold: number;
  totalSilver: number;
  totalBronze: number;
}

export async function getUserMedalCounts(userId: string): Promise<UserMedalCounts> {
  const medals = await prisma.medal.groupBy({
    by: ["medalType"],
    where: {
      userId,
    },
    _count: {
      medalType: true,
    },
  });

  const counts = {
    totalGold: 0,
    totalSilver: 0,
    totalBronze: 0,
  };

  medals.forEach((medal) => {
    switch (medal.medalType) {
      case "GOLD":
        counts.totalGold = medal._count.medalType;
        break;
      case "SILVER":
        counts.totalSilver = medal._count.medalType;
        break;
      case "BRONZE":
        counts.totalBronze = medal._count.medalType;
        break;
    }
  });

  return counts;
}

// Get a representative medal image for each type (using the most recent medal)
export async function getUserMedalImages(userId: string) {
  const recentMedals = await prisma.medal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    distinct: ["medalType"],
    select: {
      medalType: true,
      levelType: true,
      levelId: true,
    },
  });

  const medalImages = await Promise.all(
    recentMedals.map(async (medal) => {
      const image = await prisma.medalImage.findFirst({
        where: {
          levelType: medal.levelType,
          levelId: medal.levelId,
          medalType: medal.medalType,
        },
        select: {
          imageUrl: true,
          width: true,
          height: true,
        },
      });

      return {
        medalType: medal.medalType,
        imageUrl: image?.imageUrl || null,
        width: image?.width || 40,
        height: image?.height || 40,
      };
    })
  );

  // Create a map for easy access
  const imageMap = new Map(
    medalImages.map((img) => [img.medalType, img])
  );

  return {
    gold: imageMap.get("GOLD") || { medalType: "GOLD", imageUrl: null, width: 40, height: 40 },
    silver: imageMap.get("SILVER") || { medalType: "SILVER", imageUrl: null, width: 40, height: 40 },
    bronze: imageMap.get("BRONZE") || { medalType: "BRONZE", imageUrl: null, width: 40, height: 40 },
  };
}

// Get detailed medal information for the popover
export async function getUserMedalDetails(userId: string) {
  const medals = await prisma.medal.findMany({
    where: { userId },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
      { medalType: "asc" },
    ],
    select: {
      id: true,
      medalType: true,
      levelType: true,
      levelId: true,
      year: true,
      month: true,
      score: true,
    },
    take: 10, // Show last 10 medals in the popover
  });

  // Get level names for display
  const arLevelIds = medals.filter(m => m.levelType === "AR").map(m => m.levelId);
  const rcLevelIds = medals.filter(m => m.levelType === "RC").map(m => m.levelId);

  const [arLevels, rcLevels] = await Promise.all([
    arLevelIds.length > 0
      ? prisma.aR.findMany({
          where: { id: { in: arLevelIds } },
          select: { id: true, level: true },
        })
      : [],
    rcLevelIds.length > 0
      ? prisma.rCLevel.findMany({
          where: { id: { in: rcLevelIds } },
          select: { id: true, level: true },
        })
      : [],
  ]);

  const levelMap = new Map([
    ...arLevels.map(l => [`AR-${l.id}`, l.level] as [string, string]),
    ...rcLevels.map(l => [`RC-${l.id}`, l.level] as [string, string]),
  ]);

  return medals.map(medal => ({
    ...medal,
    levelName: levelMap.get(`${medal.levelType}-${medal.levelId}`) || "Unknown Level",
  }));
}

// Get user medals for compact display (shows unique medal images)
export async function getUserMedalsForDisplay(userId: string) {
  // Get all medals with their counts
  const medals = await prisma.medal.groupBy({
    by: ["levelType", "levelId", "medalType"],
    where: { userId },
    _count: {
      medalType: true,
    },
  });

  if (medals.length === 0) {
    return [];
  }

  // Get level names and medal images
  const arLevelIds = medals.filter(m => m.levelType === "AR").map(m => m.levelId);
  const rcLevelIds = medals.filter(m => m.levelType === "RC").map(m => m.levelId);

  const [arLevels, rcLevels, medalImages] = await Promise.all([
    arLevelIds.length > 0
      ? prisma.aR.findMany({
          where: { id: { in: arLevelIds } },
          select: { id: true, level: true },
        })
      : [],
    rcLevelIds.length > 0
      ? prisma.rCLevel.findMany({
          where: { id: { in: rcLevelIds } },
          select: { id: true, level: true },
        })
      : [],
    prisma.medalImage.findMany({
      where: {
        OR: medals.map(m => ({
          levelType: m.levelType,
          levelId: m.levelId,
          medalType: m.medalType,
        })),
      },
      select: {
        levelType: true,
        levelId: true,
        medalType: true,
        imageUrl: true,
      },
    }),
  ]);

  const levelMap = new Map([
    ...arLevels.map(l => [`AR-${l.id}`, l.level] as [string, string]),
    ...rcLevels.map(l => [`RC-${l.id}`, l.level] as [string, string]),
  ]);

  const imageMap = new Map(
    medalImages.map(img => [
      `${img.levelType}-${img.levelId}-${img.medalType}`,
      img.imageUrl,
    ])
  );

  // Sort medals by level type, level name, then medal type
  const medalTypeOrder = { GOLD: 0, SILVER: 1, BRONZE: 2 };
  
  return medals
    .map(medal => ({
      levelType: medal.levelType,
      levelId: medal.levelId,
      levelName: levelMap.get(`${medal.levelType}-${medal.levelId}`) || "Unknown Level",
      medalType: medal.medalType,
      count: medal._count.medalType,
      imageUrl: imageMap.get(`${medal.levelType}-${medal.levelId}-${medal.medalType}`) || null,
    }))
    .sort((a, b) => {
      // First sort by level type (AR before RC)
      if (a.levelType !== b.levelType) {
        return a.levelType === "AR" ? -1 : 1;
      }
      // Then by level name
      if (a.levelName !== b.levelName) {
        return a.levelName.localeCompare(b.levelName);
      }
      // Finally by medal type
      return medalTypeOrder[a.medalType] - medalTypeOrder[b.medalType];
    });
}

// Get medals grouped by level for popover display
export async function getUserMedalsByLevel(userId: string) {
  const medals = await getUserMedalsForDisplay(userId);
  
  // Group medals by level
  const medalsByLevel = new Map<string, any>();
  
  medals.forEach(medal => {
    const key = `${medal.levelType}-${medal.levelId}`;
    if (!medalsByLevel.has(key)) {
      medalsByLevel.set(key, {
        levelType: medal.levelType,
        levelId: medal.levelId,
        levelName: medal.levelName,
        medals: {
          gold: { count: 0, imageUrl: "" },
          silver: { count: 0, imageUrl: "" },
          bronze: { count: 0, imageUrl: "" },
        }
      });
    }
    
    const level = medalsByLevel.get(key);
    const medalTypeKey = medal.medalType.toLowerCase() as 'gold' | 'silver' | 'bronze';
    level.medals[medalTypeKey] = {
      count: medal.count,
      imageUrl: medal.imageUrl || "",
    };
  });
  
  return Array.from(medalsByLevel.values());
}