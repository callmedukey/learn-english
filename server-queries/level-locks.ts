import "server-only";
import { prisma } from "@/prisma/prisma-client";
import { LevelType, ChangeRequestStatus } from "@/prisma/generated/prisma";
import { toZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/constants/timezone";

/**
 * Get the current Korea year and month
 */
function getCurrentKoreaYearMonth() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  return {
    year: koreaTime.getFullYear(),
    month: koreaTime.getMonth() + 1,
  };
}

/**
 * Get user's current level lock for a specific level type
 */
export async function getUserLevelLock(
  userId: string,
  levelType: LevelType
) {
  const { year, month } = getCurrentKoreaYearMonth();

  const levelLock = await prisma.userLevelLock.findUnique({
    where: {
      userId_levelType_year_month: {
        userId,
        levelType,
        year,
        month,
      },
    },
  });

  return levelLock;
}

/**
 * Check if a user can access a specific level
 */
export async function checkLevelLockPermission(
  userId: string,
  levelType: LevelType,
  levelId: string
) {
  const { year, month } = getCurrentKoreaYearMonth();

  const levelLock = await getUserLevelLock(userId, levelType);

  // If no lock exists, user can access any level (and will create lock on first score)
  if (!levelLock) {
    return {
      allowed: true,
      shouldCreateLock: true,
      currentLevel: null,
    };
  }

  // Check if trying to access the locked level
  if (levelLock.levelId === levelId) {
    return {
      allowed: true,
      shouldCreateLock: false,
      currentLevel: levelLock.levelId,
    };
  }

  // User is locked to a different level
  return {
    allowed: false,
    shouldCreateLock: false,
    currentLevel: levelLock.levelId,
  };
}

/**
 * Get all level change requests (for admin)
 */
export async function getLevelChangeRequests(
  filters?: {
    status?: ChangeRequestStatus;
    userId?: string;
    year?: number;
    month?: number;
  }
) {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }
  if (filters?.userId) {
    where.userId = filters.userId;
  }
  if (filters?.year !== undefined) {
    where.year = filters.year;
  }
  if (filters?.month !== undefined) {
    where.month = filters.month;
  }

  const requests = await prisma.levelChangeRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          email: true,
        },
      },
      reviewer: {
        select: {
          id: true,
          nickname: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
}

/**
 * Get system configuration value
 */
export async function getSystemConfig(key: string) {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    return null;
  }

  try {
    return JSON.parse(config.value);
  } catch {
    return config.value;
  }
}

/**
 * Get multiple system configuration values
 */
export async function getSystemConfigs(keys: string[]) {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: keys,
      },
    },
  });

  const result: Record<string, any> = {};
  for (const config of configs) {
    try {
      result[config.key] = JSON.parse(config.value);
    } catch {
      result[config.key] = config.value;
    }
  }

  return result;
}

/**
 * Get user's level change requests for current month
 */
export async function getUserLevelChangeRequests(userId: string) {
  const { year, month } = getCurrentKoreaYearMonth();

  const requests = await prisma.levelChangeRequest.findMany({
    where: {
      userId,
      year,
      month,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests;
}

/**
 * Count approved level changes for a user in current month
 */
export async function countUserApprovedChanges(
  userId: string,
  levelType: LevelType
) {
  const { year, month } = getCurrentKoreaYearMonth();

  const levelLock = await prisma.userLevelLock.findUnique({
    where: {
      userId_levelType_year_month: {
        userId,
        levelType,
        year,
        month,
      },
    },
  });

  return levelLock?.changesUsed || 0;
}