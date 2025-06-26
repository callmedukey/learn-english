import { addMonths, startOfMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { PopupType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getCurrentKoreaYearMonth } from "@/server-queries/medals";

/**
 * Main job function that orchestrates all medal-related tasks
 * Should be run daily at midnight Korean time
 */
export async function runMedalAssignmentJob() {
  console.log("=== Starting Medal Assignment Job ===");
  console.log(`Job started at: ${new Date().toISOString()}`);
  
  try {
    // 1. Finalize medals for challenges that ended
    const medalResults = await finalizeEndedChallenges();
    console.log(`Finalized ${medalResults.length} challenges`);

    // 2. Create winner popups for last month if medals were assigned
    if (medalResults.length > 0) {
      const popupResults = await createMonthlyWinnerPopups();
      console.log(`Created ${popupResults.globalPopups} global and ${popupResults.personalPopups} personal popups`);
    }

    // 3. Activate scheduled challenges for current month
    const activatedCount = await activateScheduledChallenges();
    console.log(`Activated ${activatedCount} scheduled challenges`);

    console.log("=== Medal Assignment Job Completed Successfully ===");
    return {
      success: true,
      medalizedChallenges: medalResults.length,
      activatedChallenges: activatedCount,
    };
  } catch (error) {
    console.error("Medal Assignment Job failed:", error);
    throw error;
  }
}

/**
 * Find and finalize all challenges that have ended but haven't been finalized
 */
async function finalizeEndedChallenges() {
  const now = new Date();
  
  // Find challenges from previous months that haven't been finalized
  const unfinishedChallenges = await prisma.monthlyChallenge.findMany({
    where: {
      active: true,
      endDate: { lt: now },
      OR: [
        { leaderboard: { finalized: false } },
        { leaderboard: null }
      ]
    },
    include: {
      leaderboard: true
    }
  });

  console.log(`Found ${unfinishedChallenges.length} unfinished challenges to process`);

  const results = [];

  for (const challenge of unfinishedChallenges) {
    try {
      console.log(`Processing challenge for ${challenge.levelType} ${challenge.levelId} (${challenge.year}-${challenge.month})`);
      
      // Get top 3 scorers
      let topScorers;
      if (challenge.levelType === "AR") {
        topScorers = await prisma.monthlyARScore.findMany({
          where: {
            ARId: challenge.levelId,
            year: challenge.year,
            month: challenge.month,
            challengeId: challenge.id,
            score: { gt: 0 } // Only consider users with scores
          },
          orderBy: { score: "desc" },
          take: 3,
          include: {
            user: {
              select: { id: true, nickname: true }
            }
          }
        });
      } else {
        topScorers = await prisma.monthlyRCScore.findMany({
          where: {
            RCLevelId: challenge.levelId,
            year: challenge.year,
            month: challenge.month,
            challengeId: challenge.id,
            score: { gt: 0 } // Only consider users with scores
          },
          orderBy: { score: "desc" },
          take: 3,
          include: {
            user: {
              select: { id: true, nickname: true }
            }
          }
        });
      }

      if (topScorers.length === 0) {
        console.log(`No participants found for challenge ${challenge.id}`);
        continue;
      }

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Create or update leaderboard
        const leaderboard = await tx.monthlyLeaderboard.upsert({
          where: { challengeId: challenge.id },
          update: {
            goldUserId: topScorers[0]?.userId,
            goldScore: topScorers[0]?.score,
            silverUserId: topScorers[1]?.userId,
            silverScore: topScorers[1]?.score,
            bronzeUserId: topScorers[2]?.userId,
            bronzeScore: topScorers[2]?.score,
            finalized: true
          },
          create: {
            challengeId: challenge.id,
            year: challenge.year,
            month: challenge.month,
            levelType: challenge.levelType,
            levelId: challenge.levelId,
            goldUserId: topScorers[0]?.userId,
            goldScore: topScorers[0]?.score,
            silverUserId: topScorers[1]?.userId,
            silverScore: topScorers[1]?.score,
            bronzeUserId: topScorers[2]?.userId,
            bronzeScore: topScorers[2]?.score,
            finalized: true
          }
        });

        // Create medal records
        const medals = [];
        
        // Gold medal
        if (topScorers[0]) {
          medals.push(
            await tx.medal.create({
              data: {
                userId: topScorers[0].userId,
                medalType: "GOLD",
                levelType: challenge.levelType,
                levelId: challenge.levelId,
                year: challenge.year,
                month: challenge.month,
                score: topScorers[0].score,
                challengeId: challenge.id
              }
            })
          );
          console.log(`Awarded GOLD medal to ${topScorers[0].user.nickname}`);
        }

        // Silver medal
        if (topScorers[1]) {
          medals.push(
            await tx.medal.create({
              data: {
                userId: topScorers[1].userId,
                medalType: "SILVER",
                levelType: challenge.levelType,
                levelId: challenge.levelId,
                year: challenge.year,
                month: challenge.month,
                score: topScorers[1].score,
                challengeId: challenge.id
              }
            })
          );
          console.log(`Awarded SILVER medal to ${topScorers[1].user.nickname}`);
        }

        // Bronze medal
        if (topScorers[2]) {
          medals.push(
            await tx.medal.create({
              data: {
                userId: topScorers[2].userId,
                medalType: "BRONZE",
                levelType: challenge.levelType,
                levelId: challenge.levelId,
                year: challenge.year,
                month: challenge.month,
                score: topScorers[2].score,
                challengeId: challenge.id
              }
            })
          );
          console.log(`Awarded BRONZE medal to ${topScorers[2].user.nickname}`);
        }

        return { leaderboard, medals };
      });

      results.push(result);
      console.log(`Successfully finalized challenge ${challenge.id}`);
    } catch (error) {
      console.error(`Failed to finalize challenge ${challenge.id}:`, error);
    }
  }

  return results;
}

/**
 * Create winner announcement popups for the previous month
 */
async function createMonthlyWinnerPopups() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  
  // Calculate last month
  const lastMonthDate = addMonths(koreaTime, -1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();
  
  console.log(`Creating popups for ${lastMonthYear}-${lastMonth}`);

  // Check if popups already exist for last month
  const existingPopups = await prisma.monthlyPopup.findMany({
    where: {
      year: lastMonthYear,
      month: lastMonth
    }
  });

  if (existingPopups.length > 0) {
    console.log(`Popups already exist for ${lastMonthYear}-${lastMonth}`);
    return { globalPopups: 0, personalPopups: 0 };
  }

  // Get the start of current month in Korea time
  const displayFromDate = startOfMonth(koreaTime);
  
  // Display for 7 days
  const displayUntilDate = new Date(displayFromDate);
  displayUntilDate.setDate(displayUntilDate.getDate() + 7);

  let globalPopupsCreated = 0;
  let personalPopupsCreated = 0;

  try {
    // Create global winners popup
    const globalPopup = await prisma.monthlyPopup.create({
      data: {
        year: lastMonthYear,
        month: lastMonth,
        type: PopupType.GLOBAL_WINNERS,
        title: `${lastMonthYear}년 ${lastMonth}월 월간 챌린지 우승자`,
        content: "전체 등급별 우승자가 발표되었습니다!",
        displayFrom: displayFromDate,
        displayUntil: displayUntilDate,
        active: true
      }
    });
    globalPopupsCreated++;
    console.log(`Created global winners popup: ${globalPopup.id}`);

    // Create personal achievement popup
    const personalPopup = await prisma.monthlyPopup.create({
      data: {
        year: lastMonthYear,
        month: lastMonth,
        type: PopupType.PERSONAL_ACHIEVEMENT,
        title: `${lastMonthYear}년 ${lastMonth}월 개인 성과`,
        content: "월간 챌린지에서의 당신의 성과를 확인하세요!",
        displayFrom: displayFromDate,
        displayUntil: displayUntilDate,
        active: true
      }
    });
    personalPopupsCreated++;
    console.log(`Created personal achievement popup: ${personalPopup.id}`);

  } catch (error) {
    console.error("Failed to create winner popups:", error);
  }

  return {
    globalPopups: globalPopupsCreated,
    personalPopups: personalPopupsCreated
  };
}

/**
 * Activate challenges scheduled for the current month
 */
async function activateScheduledChallenges() {
  const { year, month } = getCurrentKoreaYearMonth();
  
  console.log(`Checking for scheduled challenges for ${year}-${month}`);
  
  // Find scheduled challenges for current month that are not yet active
  const toActivate = await prisma.monthlyChallenge.findMany({
    where: {
      year,
      month,
      scheduledActive: true,
      active: false
    }
  });
  
  if (toActivate.length === 0) {
    console.log("No scheduled challenges to activate");
    return 0;
  }

  // Activate them
  const result = await prisma.monthlyChallenge.updateMany({
    where: { 
      id: { in: toActivate.map(c => c.id) } 
    },
    data: { 
      active: true 
    }
  });
  
  console.log(`Activated ${result.count} scheduled challenges`);
  
  // Log details of activated challenges
  for (const challenge of toActivate) {
    console.log(`- Activated ${challenge.levelType} ${challenge.levelId} challenge`);
  }
  
  return result.count;
}