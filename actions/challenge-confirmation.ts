"use server";

import { toZonedTime } from "date-fns-tz";

import { auth } from "@/auth";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { LevelType } from "@/prisma/generated/prisma";
import { getUserLevelLock } from "@/server-queries/level-locks";

import { createUserLevelLock } from "./level-locks";

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

interface ConfirmChallengeResponse {
  success: boolean;
  message: string;
  alreadyConfirmed?: boolean;
  currentLockedLevel?: string;
  error?: string;
}

/**
 * Confirm challenge participation for a user
 * This will lock the user to the selected level for the current month
 */
export async function confirmChallengeParticipation(
  levelType: "AR" | "RC",
  levelId: string,
): Promise<ConfirmChallengeResponse> {
  try {
    // Get current session and validate user is logged in
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to participate in challenges",
        error: "UNAUTHORIZED",
      };
    }

    const userId = session.user.id;
    const { year, month } = getCurrentKoreaYearMonth();

    // Check if user already has a level lock for this month
    const existingLock = await getUserLevelLock(userId, levelType as LevelType);

    if (existingLock) {
      // User already has a lock for this level type
      if (existingLock.levelId === levelId) {
        // Already confirmed for the same level
        return {
          success: true,
          message: `You have already confirmed your participation in this level for ${month}/${year}`,
          alreadyConfirmed: true,
          currentLockedLevel: existingLock.levelId,
        };
      } else {
        // Locked to a different level
        return {
          success: false,
          message: `You are already participating in a different level (${existingLock.levelId}) for ${month}/${year}. You cannot change levels during the month.`,
          error: "ALREADY_LOCKED",
          currentLockedLevel: existingLock.levelId,
        };
      }
    }

    // No lock exists, create one
    await createUserLevelLock(userId, levelType as LevelType, levelId);

    return {
      success: true,
      message: `Successfully confirmed your participation in level ${levelId} for ${month}/${year}. You are now locked to this level for the month.`,
      alreadyConfirmed: false,
      currentLockedLevel: levelId,
    };
  } catch (error) {
    console.error("Error confirming challenge participation:", error);
    return {
      success: false,
      message:
        "An error occurred while confirming your participation. Please try again.",
      error: "INTERNAL_ERROR",
    };
  }
}

/**
 * Get user's current level lock status for a specific level type
 */
export async function getUserLevelLockStatus(levelType: "AR" | "RC") {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to check level lock status",
        error: "UNAUTHORIZED",
      };
    }

    const { year, month } = getCurrentKoreaYearMonth();
    const levelLock = await getUserLevelLock(
      session.user.id,
      levelType as LevelType,
    );

    if (!levelLock) {
      return {
        success: true,
        hasLock: false,
        year,
        month,
      };
    }

    return {
      success: true,
      hasLock: true,
      lockedLevelId: levelLock.levelId,
      changesUsed: levelLock.changesUsed,
      lastChangeAt: levelLock.lastChangeAt,
      year: levelLock.year,
      month: levelLock.month,
    };
  } catch (error) {
    console.error("Error getting level lock status:", error);
    return {
      success: false,
      message: "An error occurred while checking level lock status",
      error: "INTERNAL_ERROR",
    };
  }
}
