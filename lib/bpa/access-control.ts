"server only";

import { toZonedTime } from "date-fns-tz";

import { getCurrentBPAContext } from "@/actions/bpa/get-current-bpa-context";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

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
 */
export async function canUserAccessNovel(
  userId: string,
  novelId: string
): Promise<boolean> {
  try {
    const currentSemester = await getCurrentBPAContext();
    if (!currentSemester.timeframeId || !currentSemester.season) return false;

    // Get novel's level
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { bpaLevelId: true },
    });

    if (!novel) return false;

    // Check both conditions
    const [userAssigned, novelAssigned] = await Promise.all([
      isUserAssignedToLevel(
        userId,
        novel.bpaLevelId,
        currentSemester.timeframeId!,
        currentSemester.season!
      ),
      isNovelAssignedToSemester(
        novelId,
        currentSemester.timeframeId!,
        currentSemester.season!
      ),
    ]);

    return userAssigned && novelAssigned;
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
