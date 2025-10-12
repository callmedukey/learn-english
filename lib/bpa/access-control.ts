"server only";

import { getCurrentBPAContext } from "@/actions/bpa/get-current-bpa-context";
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
 * Get all novels accessible by a user in a specific level for current semester
 */
export async function getUserAccessibleNovels(
  userId: string,
  levelId: string
): Promise<string[]> {
  try {
    const currentSemester = await getCurrentBPAContext();
    if (!currentSemester.timeframeId || !currentSemester.season) return [];

    // Check if user is assigned to this level for current semester
    const userAssigned = await isUserAssignedToLevel(
      userId,
      levelId,
      currentSemester.timeframeId!,
      currentSemester.season!
    );

    if (!userAssigned) return [];

    // Get all novels assigned to current semester in this level
    const assignments = await prisma.bPANovelSemesterAssignment.findMany({
      where: {
        timeframeId: currentSemester.timeframeId!,
        season: currentSemester.season!,
        novel: {
          bpaLevelId: levelId,
          hidden: false,
        },
      },
      select: {
        novelId: true,
      },
    });

    return assignments.map((a) => a.novelId);
  } catch (error) {
    console.error("Error getting accessible novels:", error);
    return [];
  }
}
