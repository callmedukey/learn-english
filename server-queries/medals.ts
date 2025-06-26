import "server-only";

import { auth } from "@/auth";
import { MedalType, LevelType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { toZonedTime } from "date-fns-tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import calculateGrade from "@/lib/utils/calculate-grade";

// Helper function to get month boundaries in UTC
export function getMonthBoundariesInUTC(year: number, month: number) {
  // Create date in Korea timezone (month is 0-indexed in JS Date)
  const koreaDate = new Date(year, month - 1, 1);
  
  // Get start and end of month in Korea time
  const startInKorea = startOfMonth(koreaDate);
  const endInKorea = endOfMonth(koreaDate);
  
  // Convert to UTC for database storage
  return {
    startDate: fromZonedTime(startInKorea, APP_TIMEZONE),
    endDate: fromZonedTime(endInKorea, APP_TIMEZONE)
  };
}

// Helper function to get current year/month in Korea timezone
export function getCurrentKoreaYearMonth() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  return {
    year: koreaTime.getFullYear(),
    month: koreaTime.getMonth() + 1 // Convert to 1-indexed
  };
}

export async function getUserMedals(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      throw new Error("User not found");
    }

    const medals = await prisma.medal.findMany({
      where: { userId: targetUserId },
      orderBy: [{ year: "desc" }, { month: "desc" }, { medalType: "asc" }],
      include: {
        challenge: true,
      },
    });

    // Get medal counts
    const medalCounts = medals.reduce(
      (acc, medal) => {
        acc[medal.medalType] = (acc[medal.medalType] || 0) + 1;
        return acc;
      },
      {} as Record<MedalType, number>,
    );

    return {
      medals,
      counts: {
        gold: medalCounts.GOLD || 0,
        silver: medalCounts.SILVER || 0,
        bronze: medalCounts.BRONZE || 0,
        total: medals.length,
      },
    };
  } catch (error) {
    console.error("Failed to get user medals:", error);
    throw new Error("Failed to get user medals");
  }
}

export async function getCurrentLeaderboard(
  levelType: LevelType,
  levelId: string,
) {
  try {
    const now = new Date();
    const { year, month } = getCurrentKoreaYearMonth();

    // Find active challenge
    const challenge = await prisma.monthlyChallenge.findUnique({
      where: {
        year_month_levelType_levelId: {
          year,
          month,
          levelType,
          levelId,
        },
      },
    });

    if (!challenge || !challenge.active) {
      return null;
    }

    // Get top scores based on level type
    let topScores;
    if (levelType === "AR") {
      topScores = await prisma.monthlyARScore.findMany({
        where: {
          ARId: levelId,
          year,
          month,
          challengeId: challenge.id,
        },
        orderBy: { score: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              image: true,
            },
          },
        },
      });
    } else {
      topScores = await prisma.monthlyRCScore.findMany({
        where: {
          RCLevelId: levelId,
          year,
          month,
          challengeId: challenge.id,
        },
        orderBy: { score: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              image: true,
            },
          },
        },
      });
    }

    // Get existing leaderboard if finalized
    const leaderboard = await prisma.monthlyLeaderboard.findUnique({
      where: { challengeId: challenge.id },
      include: {
        goldUser: {
          select: { id: true, nickname: true, image: true },
        },
        silverUser: {
          select: { id: true, nickname: true, image: true },
        },
        bronzeUser: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });

    return {
      challenge,
      topScores,
      leaderboard,
      daysRemaining: Math.ceil(
        (challenge.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    };
  } catch (error) {
    console.error("Failed to get current leaderboard:", error);
    throw new Error("Failed to get current leaderboard");
  }
}

export async function getActivePopups(userId?: string) {
  try {
    const now = new Date();
    
    // Get all active popups within display period
    const activePopups = await prisma.monthlyPopup.findMany({
      where: {
        active: true,
        displayFrom: { lte: now },
        displayUntil: { gte: now },
      },
      include: {
        dismissals: userId ? {
          where: { userId }
        } : false,
      },
      orderBy: [
        { type: 'asc' }, // GLOBAL_WINNERS first
        { createdAt: 'desc' }
      ],
    });

    // Filter out popups that user has dismissed for the month
    if (userId) {
      return activePopups.filter(popup => {
        const dismissal = popup.dismissals?.[0];
        return !dismissal || !dismissal.dismissedForMonth;
      });
    }

    return activePopups;
  } catch (error) {
    console.error("Failed to get active popups:", error);
    return [];
  }
}

export async function getUserMonthlyRankings(userId: string, year: number, month: number) {
  try {
    // Get user's level locks for the specified month
    const levelLocks = await prisma.userLevelLock.findMany({
      where: { userId, year, month },
    });
    
    // Get user details separately
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nickname: true,
        birthday: true,
      },
    });

    const rankings: Array<{
      levelType: LevelType;
      levelId: string;
      levelName: string;
      rank: number;
      totalParticipants: number;
      score: number;
      grade: string;
    }> = [];

    for (const lock of levelLocks) {
      if (lock.levelType === "AR") {
        // Get AR level details
        const arLevel = await prisma.aR.findUnique({
          where: { id: lock.levelId },
          select: { level: true },
        });

        // Get user's monthly score and rank
        const userScore = await prisma.monthlyARScore.findUnique({
          where: {
            userId_ARId_year_month: {
              userId,
              ARId: lock.levelId,
              year,
              month,
            },
          },
          select: { score: true },
        });

        if (userScore && arLevel) {
          // Count how many users scored higher
          const higherScorers = await prisma.monthlyARScore.count({
            where: {
              ARId: lock.levelId,
              year,
              month,
              score: { gt: userScore.score },
            },
          });

          // Total participants
          const totalParticipants = await prisma.monthlyARScore.count({
            where: {
              ARId: lock.levelId,
              year,
              month,
              score: { gt: 0 },
            },
          });

          rankings.push({
            levelType: "AR",
            levelId: lock.levelId,
            levelName: arLevel.level,
            rank: higherScorers + 1,
            totalParticipants,
            score: userScore.score,
            grade: calculateGrade(user?.birthday || null),
          });
        }
      } else {
        // Get RC level details
        const rcLevel = await prisma.rCLevel.findUnique({
          where: { id: lock.levelId },
          select: { level: true },
        });

        // Get user's monthly score and rank
        const userScore = await prisma.monthlyRCScore.findUnique({
          where: {
            userId_RCLevelId_year_month: {
              userId,
              RCLevelId: lock.levelId,
              year,
              month,
            },
          },
          select: { score: true },
        });

        if (userScore && rcLevel) {
          // Count how many users scored higher
          const higherScorers = await prisma.monthlyRCScore.count({
            where: {
              RCLevelId: lock.levelId,
              year,
              month,
              score: { gt: userScore.score },
            },
          });

          // Total participants
          const totalParticipants = await prisma.monthlyRCScore.count({
            where: {
              RCLevelId: lock.levelId,
              year,
              month,
              score: { gt: 0 },
            },
          });

          rankings.push({
            levelType: "RC",
            levelId: lock.levelId,
            levelName: rcLevel.level,
            rank: higherScorers + 1,
            totalParticipants,
            score: userScore.score,
            grade: calculateGrade(user?.birthday || null),
          });
        }
      }
    }

    return rankings;
  } catch (error) {
    console.error("Failed to get user monthly rankings:", error);
    return [];
  }
}

export async function getMedalImages(levelType: LevelType, levelId: string) {
  try {
    const images = await prisma.medalImage.findMany({
      where: {
        levelType,
        levelId,
      },
    });

    return images.reduce(
      (acc, img) => {
        acc[img.medalType] = img.imageUrl;
        return acc;
      },
      {} as Record<MedalType, string>,
    );
  } catch (error) {
    console.error("Failed to get medal images:", error);
    return null;
  }
}

export async function getActiveChallenges() {
  try {
    const now = new Date();

    const challenges = await prisma.monthlyChallenge.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        _count: {
          select: {
            medals: true,
            monthlyARScores: true,
            monthlyRCScores: true,
          },
        },
      },
    });

    // Get level details for each challenge
    const challengesWithDetails = await Promise.all(
      challenges.map(async (challenge) => {
        if (challenge.levelType === "AR") {
          const ar = await prisma.aR.findUnique({
            where: { id: challenge.levelId },
            include: {
              novels: {
                where: { id: { in: challenge.novelIds } },
                select: { id: true, title: true },
              },
            },
          });
          return { ...challenge, levelDetails: ar };
        } else {
          const rcLevel = await prisma.rCLevel.findUnique({
            where: { id: challenge.levelId },
            include: {
              RCKeyword: {
                where: { id: { in: challenge.keywordIds } },
                select: { id: true, name: true },
              },
            },
          });
          return { ...challenge, levelDetails: rcLevel };
        }
      }),
    );

    return challengesWithDetails;
  } catch (error) {
    console.error("Failed to get active challenges:", error);
    throw new Error("Failed to get active challenges");
  }
}

export async function getActiveChallengeItems(
  levelType: LevelType,
  levelId: string
) {
  try {
    const { year, month } = getCurrentKoreaYearMonth();

    // Find active challenge for the specified level
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
        active: true,
        novelIds: true,
        keywordIds: true,
      },
    });

    // Return null if no challenge exists or if it's not active
    if (!challenge || !challenge.active) {
      return null;
    }

    // Return the appropriate IDs based on level type
    if (levelType === "AR") {
      return challenge.novelIds;
    } else {
      return challenge.keywordIds;
    }
  } catch (error) {
    console.error("Failed to get active challenge items:", error);
    throw new Error("Failed to get active challenge items");
  }
}

export async function getHistoricalLeaderboard(
  year: number,
  month: number,
  levelType?: LevelType,
  levelId?: string,
) {
  try {
    const where: any = { year, month };
    if (levelType) where.levelType = levelType;
    if (levelId) where.levelId = levelId;

    const leaderboards = await prisma.monthlyLeaderboard.findMany({
      where,
      include: {
        challenge: true,
        goldUser: {
          select: { id: true, nickname: true, image: true },
        },
        silverUser: {
          select: { id: true, nickname: true, image: true },
        },
        bronzeUser: {
          select: { id: true, nickname: true, image: true },
        },
      },
    });

    return leaderboards;
  } catch (error) {
    console.error("Failed to get historical leaderboard:", error);
    throw new Error("Failed to get historical leaderboard");
  }
}

export async function getGlobalWinnersData(year: number, month: number) {
  try {
    const leaderboards = await prisma.monthlyLeaderboard.findMany({
      where: { year, month, finalized: true },
      include: {
        goldUser: {
          select: { nickname: true, image: true, birthday: true },
        },
        silverUser: {
          select: { nickname: true, image: true, birthday: true },
        },
        bronzeUser: {
          select: { nickname: true, image: true, birthday: true },
        },
      },
    });

    // Get level details and organize by grade
    const enrichedLeaderboards = await Promise.all(
      leaderboards.map(async (lb) => {
        let levelName = "";
        let grade = "";
        
        if (lb.levelType === "AR") {
          const ar = await prisma.aR.findUnique({
            where: { id: lb.levelId },
            select: { level: true },
          });
          levelName = ar?.level || "";
          // Calculate grade from the gold winner's birthday, or fallback to others
          const winnerBirthday = lb.goldUser?.birthday || lb.silverUser?.birthday || lb.bronzeUser?.birthday;
          grade = calculateGrade(winnerBirthday || null);
        } else {
          const rc = await prisma.rCLevel.findUnique({
            where: { id: lb.levelId },
            select: { level: true, relevantGrade: true },
          });
          levelName = rc?.level || "";
          // Calculate grade from the gold winner's birthday, or fallback to others
          const winnerBirthday = lb.goldUser?.birthday || lb.silverUser?.birthday || lb.bronzeUser?.birthday;
          grade = calculateGrade(winnerBirthday || null);
        }

        return {
          levelType: lb.levelType,
          levelId: lb.levelId,
          levelName,
          grade,
          goldUser: lb.goldUser ? { nickname: lb.goldUser.nickname, image: lb.goldUser.image } : null,
          goldScore: lb.goldScore,
          silverUser: lb.silverUser ? { nickname: lb.silverUser.nickname, image: lb.silverUser.image } : null,
          silverScore: lb.silverScore,
          bronzeUser: lb.bronzeUser ? { nickname: lb.bronzeUser.nickname, image: lb.bronzeUser.image } : null,
          bronzeScore: lb.bronzeScore,
        };
      })
    );

    return enrichedLeaderboards;
  } catch (error) {
    console.error("Failed to get global winners data:", error);
    return [];
  }
}