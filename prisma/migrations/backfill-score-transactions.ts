/**
 * Migration Script: Backfill ScoreTransaction Table
 *
 * This script migrates historical RC and Novel completion data
 * into the new unified ScoreTransaction table for the admin score log.
 *
 * Usage: tsx prisma/migrations/backfill-score-transactions.ts
 */

import { prisma } from "../prisma-client";

const BATCH_SIZE = 500;

async function backfillRCTransactions() {
  console.log("Starting RC score transaction backfill...");

  let offset = 0;
  let totalProcessed = 0;
  let totalCreated = 0;

  while (true) {
    const rcCompletions = await prisma.rCQuestionCompleted.findMany({
      skip: offset,
      take: BATCH_SIZE,
      include: {
        RCQuestion: {
          include: {
            RCQuestionSet: {
              include: {
                RCKeyword: {
                  include: {
                    RCLevel: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (rcCompletions.length === 0) {
      break;
    }

    // Transform to ScoreTransaction format
    const transactions = rcCompletions
      .map((completion) => {
        // Skip if question or related data is missing
        if (!completion.RCQuestion) {
          console.warn(`Skipping RC completion ${completion.id} - missing question data`);
          return null;
        }

        const question = completion.RCQuestion;
        const keyword = question.RCQuestionSet?.RCKeyword;
        const level = keyword?.RCLevel;

        return {
          userId: completion.userId,
          source: "RC",
          sourceId: completion.id,
          score: completion.score,
          levelInfo: level?.level || null,
          novelInfo: null,
          unitInfo: null,
          chapterInfo: null,
          keywordInfo: keyword?.name || null,
          questionText: question.question,
          selectedAnswer: completion.selectedAnswer,
          correctAnswer: question.answer,
          isCorrect: completion.isCorrect,
          isRetry: completion.isRetry,
          isTimedOut: completion.isTimedOut,
          explanation: question.explanation,
          createdAt: completion.createdAt,
        };
      })
      .filter((t) => t !== null);

    // Insert batch
    if (transactions.length > 0) {
      await prisma.scoreTransaction.createMany({
        data: transactions,
        skipDuplicates: true,
      });
      totalCreated += transactions.length;
    }

    totalProcessed += rcCompletions.length;
    offset += BATCH_SIZE;

    console.log(`Processed ${totalProcessed} RC completions (${totalCreated} created)`);
  }

  console.log(`✓ RC backfill complete: ${totalCreated} transactions created`);
  return totalCreated;
}

async function backfillNovelTransactions() {
  console.log("\nStarting Novel score transaction backfill...");

  let offset = 0;
  let totalProcessed = 0;
  let totalCreated = 0;

  while (true) {
    const novelCompletions = await prisma.novelQuestionCompleted.findMany({
      skip: offset,
      take: BATCH_SIZE,
      include: {
        novelQuestion: {
          include: {
            novelQuestionSet: {
              include: {
                novelChapter: {
                  include: {
                    novel: {
                      include: {
                        AR: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (novelCompletions.length === 0) {
      break;
    }

    // Transform to ScoreTransaction format
    const transactions = novelCompletions
      .map((completion) => {
        // Skip if question or related data is missing
        if (!completion.novelQuestion) {
          console.warn(`Skipping Novel completion ${completion.id} - missing question data`);
          return null;
        }

        const question = completion.novelQuestion;
        const chapter = question.novelQuestionSet?.novelChapter;
        const novel = chapter?.novel;
        const ar = novel?.AR;

        return {
          userId: completion.userId,
          source: "Novel",
          sourceId: completion.id,
          score: completion.score,
          levelInfo: ar?.level || null,
          novelInfo: novel?.title || null,
          unitInfo: null,
          chapterInfo: chapter ? `Chapter ${chapter.orderNumber}` : null,
          keywordInfo: null,
          questionText: question.question,
          selectedAnswer: completion.selectedAnswer,
          correctAnswer: question.answer,
          isCorrect: completion.isCorrect,
          isRetry: completion.isRetry,
          isTimedOut: completion.isTimedOut,
          explanation: question.explanation,
          createdAt: completion.createdAt,
        };
      })
      .filter((t) => t !== null);

    // Insert batch
    if (transactions.length > 0) {
      await prisma.scoreTransaction.createMany({
        data: transactions,
        skipDuplicates: true,
      });
      totalCreated += transactions.length;
    }

    totalProcessed += novelCompletions.length;
    offset += BATCH_SIZE;

    console.log(`Processed ${totalProcessed} Novel completions (${totalCreated} created)`);
  }

  console.log(`✓ Novel backfill complete: ${totalCreated} transactions created`);
  return totalCreated;
}

async function main() {
  try {
    console.log("=== Score Transaction Backfill Migration ===\n");

    // Check current state
    const existingCount = await prisma.scoreTransaction.count();
    console.log(`Current ScoreTransaction count: ${existingCount}`);

    const rcCount = await prisma.rCQuestionCompleted.count();
    const novelCount = await prisma.novelQuestionCompleted.count();
    console.log(`RC completions to migrate: ${rcCount}`);
    console.log(`Novel completions to migrate: ${novelCount}`);
    console.log(`Total records to process: ${rcCount + novelCount}\n`);

    // Backfill RC transactions
    const rcCreated = await backfillRCTransactions();

    // Backfill Novel transactions
    const novelCreated = await backfillNovelTransactions();

    // Final verification
    const finalCount = await prisma.scoreTransaction.count();
    console.log(`\n=== Migration Complete ===`);
    console.log(`Total ScoreTransaction records: ${finalCount}`);
    console.log(`RC transactions created: ${rcCreated}`);
    console.log(`Novel transactions created: ${novelCreated}`);
    console.log(`Total created: ${rcCreated + novelCreated}`);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
