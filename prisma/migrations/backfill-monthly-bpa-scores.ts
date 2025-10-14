/**
 * Backfill MonthlyBPAScore records from existing BPAQuestionCompleted records
 * This script should be run once after adding MonthlyBPAScore support
 */

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "../../lib/constants/timezone";
import { prisma } from "../prisma-client";

async function backfillMonthlyBPAScores() {
  console.log("=== Starting MonthlyBPAScore Backfill ===");

  try {
    // Get all BPA question completions with scores > 0
    const completions = await prisma.bPAQuestionCompleted.findMany({
      where: {
        score: { gt: 0 },
      },
      include: {
        question: {
          include: {
            questionSet: {
              include: {
                chapter: {
                  include: {
                    novel: {
                      select: {
                        bpaLevelId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`Found ${completions.length} BPA completions to backfill`);

    // Group completions by user, level, year, and month
    const monthlyScores = new Map<string, {
      userId: string;
      bpaLevelId: string;
      year: number;
      month: number;
      totalScore: number;
    }>();

    for (const completion of completions) {
      const bpaLevelId = completion.question.questionSet?.chapter?.novel.bpaLevelId;

      if (!bpaLevelId) {
        console.warn(`Skipping completion ${completion.id} - no bpaLevelId found`);
        continue;
      }

      // Convert completion date to Korea timezone
      const koreaTime = toZonedTime(completion.createdAt, APP_TIMEZONE);
      const year = koreaTime.getFullYear();
      const month = koreaTime.getMonth() + 1;

      // Create a unique key for this user/level/month combination
      const key = `${completion.userId}-${bpaLevelId}-${year}-${month}`;

      if (monthlyScores.has(key)) {
        // Add to existing score
        const existing = monthlyScores.get(key)!;
        existing.totalScore += completion.score;
      } else {
        // Create new entry
        monthlyScores.set(key, {
          userId: completion.userId,
          bpaLevelId,
          year,
          month,
          totalScore: completion.score,
        });
      }
    }

    console.log(`Aggregated into ${monthlyScores.size} monthly score records`);

    // Insert or update MonthlyBPAScore records
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const scoreData of monthlyScores.values()) {
      const existing = await prisma.monthlyBPAScore.findUnique({
        where: {
          userId_bpaLevelId_year_month: {
            userId: scoreData.userId,
            bpaLevelId: scoreData.bpaLevelId,
            year: scoreData.year,
            month: scoreData.month,
          },
        },
      });

      if (existing) {
        if (existing.score === scoreData.totalScore) {
          console.log(`Skipping ${scoreData.userId} (${scoreData.year}-${scoreData.month}) - already correct`);
          skippedCount++;
        } else {
          await prisma.monthlyBPAScore.update({
            where: { id: existing.id },
            data: { score: scoreData.totalScore },
          });
          console.log(`Updated ${scoreData.userId} (${scoreData.year}-${scoreData.month}): ${existing.score} → ${scoreData.totalScore}`);
          updatedCount++;
        }
      } else {
        await prisma.monthlyBPAScore.create({
          data: {
            userId: scoreData.userId,
            bpaLevelId: scoreData.bpaLevelId,
            year: scoreData.year,
            month: scoreData.month,
            score: scoreData.totalScore,
          },
        });
        console.log(`Created ${scoreData.userId} (${scoreData.year}-${scoreData.month}): ${scoreData.totalScore} points`);
        createdCount++;
      }
    }

    console.log("=== Backfill Complete ===");
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${monthlyScores.size}`);
  } catch (error) {
    console.error("Backfill failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillMonthlyBPAScores()
  .then(() => {
    console.log("Backfill script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Backfill script failed:", error);
    process.exit(1);
  });
