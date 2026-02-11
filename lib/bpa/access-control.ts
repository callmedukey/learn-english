"server only";

import { toZonedTime } from "date-fns-tz";

import { getCurrentBPAContext } from "@/actions/bpa/get-current-bpa-context";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { isSuperUser } from "@/lib/utils/super-user";
import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * Helper to check if a user is a super user by their ID
 */
async function isUserSuperUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return isSuperUser(user?.email);
}

/**
 * Check if a user is assigned to a specific level for the current semester
 */
export async function isUserAssignedToLevel(
  userId: string,
  levelId: string,
  timeframeId?: string,
  season?: BPASeason
): Promise<boolean> {
  try {
    // Super users have access to all levels
    if (await isUserSuperUser(userId)) {
      return true;
    }

    // If timeframe/season not provided, get current semester
    let semesterInfo = { timeframeId, season };
    if (!timeframeId || !season) {
      const current = await getCurrentBPAContext();
      if (!current.timeframeId || !current.season) return false;
      semesterInfo = {
        timeframeId: current.timeframeId,
        season: current.season,
      };
    }

    const assignment = await prisma.bPAUserLevelAssignment.findFirst({
      where: {
        userId,
        bpaLevelId: levelId,
        timeframeId: semesterInfo.timeframeId,
        season: semesterInfo.season,
      },
    });

    return !!assignment;
  } catch (error) {
    console.error("Error checking user level assignment:", error);
    return false;
  }
}

/**
 * Check if a novel is assigned to a specific semester
 */
export async function isNovelAssignedToSemester(
  novelId: string,
  timeframeId?: string,
  season?: BPASeason
): Promise<boolean> {
  try {
    // If timeframe/season not provided, get current semester
    let semesterInfo = { timeframeId, season };
    if (!timeframeId || !season) {
      const current = await getCurrentBPAContext();
      if (!current.timeframeId || !current.season) return false;
      semesterInfo = {
        timeframeId: current.timeframeId,
        season: current.season,
      };
    }

    const assignment = await prisma.bPANovelSemesterAssignment.findFirst({
      where: {
        novelId,
        timeframeId: semesterInfo.timeframeId,
        season: semesterInfo.season,
      },
    });

    return !!assignment;
  } catch (error) {
    console.error("Error checking novel semester assignment:", error);
    return false;
  }
}

/**
 * Check if a user can access a novel (both user assigned to level AND novel assigned to semester)
 *
 * This function handles overlapping semester date ranges correctly by checking if the user
 * is assigned to ANY currently active semester (by date range) where the novel is also assigned,
 * rather than relying on a system-wide "current" semester.
 */
export async function canUserAccessNovel(
  userId: string,
  novelId: string
): Promise<boolean> {
  try {
    // Super users have access to all novels
    if (await isUserSuperUser(userId)) {
      return true;
    }

    // Get novel's level
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { bpaLevelId: true },
    });

    if (!novel) return false;

    const now = new Date();
    const koreaTime = toZonedTime(now, APP_TIMEZONE);

    // Find ALL user's assignments for this level where the semester is currently active
    // This handles overlapping semesters correctly - if user is assigned to ANY active semester,
    // we check if the novel is assigned to that semester
    const userAssignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        userId,
        bpaLevelId: novel.bpaLevelId,
        semester: {
          startDate: { lte: koreaTime },
          endDate: { gte: koreaTime },
        },
      },
      select: {
        timeframeId: true,
        season: true,
      },
    });

    if (userAssignments.length === 0) return false;

    // Check if novel is assigned to ANY of the user's active semesters
    const novelAssignment = await prisma.bPANovelSemesterAssignment.findFirst({
      where: {
        novelId,
        OR: userAssignments.map((a) => ({
          timeframeId: a.timeframeId,
          season: a.season,
        })),
      },
    });

    return !!novelAssignment;
  } catch (error) {
    console.error("Error checking novel access:", error);
    return false;
  }
}

/**
 * Get all novels accessible by a user in a specific level.
 * Returns novels from ALL currently active semesters the user is assigned to.
 */
export async function getUserAccessibleNovels(
  userId: string,
  levelId: string
): Promise<string[]> {
  try {
    // Super users have access to ALL novels in the level
    if (await isUserSuperUser(userId)) {
      const allNovels = await prisma.bPANovel.findMany({
        where: {
          bpaLevelId: levelId,
          hidden: false,
        },
        select: { id: true },
      });
      return allNovels.map((n) => n.id);
    }

    const now = new Date();
    const koreaTime = toZonedTime(now, APP_TIMEZONE);

    // Get all user's assignments for this level
    const userAssignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        userId,
        bpaLevelId: levelId,
      },
      include: {
        semester: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (userAssignments.length === 0) return [];

    // Filter to only currently active semesters (date range contains today)
    const activeAssignments = userAssignments.filter((assignment) => {
      if (!assignment.semester) return false;
      return (
        koreaTime >= assignment.semester.startDate &&
        koreaTime <= assignment.semester.endDate
      );
    });

    if (activeAssignments.length === 0) return [];

    // Get novels for ALL active semesters the user is assigned to
    const novelAssignments = await prisma.bPANovelSemesterAssignment.findMany({
      where: {
        OR: activeAssignments.map((a) => ({
          timeframeId: a.timeframeId,
          season: a.season,
        })),
        novel: {
          bpaLevelId: levelId,
          hidden: false,
        },
      },
      select: {
        novelId: true,
      },
      distinct: ["novelId"], // Avoid duplicates if novel is assigned to multiple semesters
    });

    return novelAssignments.map((a) => a.novelId);
  } catch (error) {
    console.error("Error getting accessible novels:", error);
    return [];
  }
}
