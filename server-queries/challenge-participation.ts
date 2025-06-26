import "server-only";

import { prisma } from "@/prisma/prisma-client";
import { LevelType } from "@/prisma/generated/prisma";
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
 * Check if a user is attempting challenge content and their participation status
 */
export async function checkChallengeParticipation(
  userId: string,
  levelType: LevelType,
  levelId: string,
  contentId: string // novelId or keywordId
) {
  try {
    const { year, month } = getCurrentKoreaYearMonth();

    // Find active challenge for this level
    const challenge = await prisma.monthlyChallenge.findUnique({
      where: {
        year_month_levelType_levelId: {
          year,
          month,
          levelType,
          levelId,
        },
      },
      select: {
        id: true,
        active: true,
        novelIds: true,
        keywordIds: true,
      },
    });

    // Check if this content is part of the challenge
    const isChallengeContent = (() => {
      if (!challenge || !challenge.active) return false;
      
      if (levelType === "AR") {
        return challenge.novelIds.includes(contentId);
      } else {
        return challenge.keywordIds.includes(contentId);
      }
    })();

    // Check if user has joined the challenge (has level lock)
    const userLevelLock = await prisma.userLevelLock.findUnique({
      where: {
        userId_levelType_year_month: {
          userId,
          levelType,
          year,
          month,
        },
      },
      select: {
        levelId: true,
      },
    });

    const hasJoinedChallenge = userLevelLock?.levelId === levelId;
    const isLockedToDifferentLevel = !!(userLevelLock && userLevelLock.levelId !== levelId);

    // Get challenge details if content is part of challenge
    let challengeDetails = null;
    if (isChallengeContent && challenge) {
      const totalContent = levelType === "AR" 
        ? challenge.novelIds.length 
        : challenge.keywordIds.length;

      // Get level name
      const levelInfo = levelType === "AR"
        ? await prisma.aR.findUnique({
            where: { id: levelId },
            select: { level: true },
          })
        : await prisma.rCLevel.findUnique({
            where: { id: levelId },
            select: { level: true },
          });

      challengeDetails = {
        year,
        month,
        totalContent,
        levelName: levelInfo?.level || levelType,
        challengeId: challenge.id,
      };
    }

    return {
      isChallengeContent,
      hasJoinedChallenge,
      isLockedToDifferentLevel,
      currentLockedLevelId: userLevelLock?.levelId || null,
      challengeDetails,
    };
  } catch (error) {
    console.error("Failed to check challenge participation:", error);
    throw new Error("Failed to check challenge participation");
  }
}

/**
 * Get content name for display in dialogs
 */
export async function getContentName(
  contentId: string,
  levelType: LevelType
) {
  try {
    if (levelType === "AR") {
      const novel = await prisma.novel.findUnique({
        where: { id: contentId },
        select: { title: true },
      });
      return novel?.title || "Novel";
    } else {
      const keyword = await prisma.rCKeyword.findUnique({
        where: { id: contentId },
        select: { name: true },
      });
      return keyword?.name || "Keyword";
    }
  } catch (error) {
    console.error("Failed to get content name:", error);
    return levelType === "AR" ? "Novel" : "Keyword";
  }
}