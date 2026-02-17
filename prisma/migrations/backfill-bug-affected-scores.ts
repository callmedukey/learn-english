/**
 * Backfill Script: Fix Bug-Affected Score Records
 *
 * This script fixes records where users got 0 points on their FIRST attempt
 * due to the isCompleted bug that incorrectly marked questions as "retry".
 *
 * What it does:
 * 1. Updates completion records: sets correct score, isRetry=false
 * 2. Updates TotalScore: adds missing points
 * 3. Updates BPAScore/ARScore/RCScore: adds missing points
 * 4. Updates MonthlyBPAScore: adds missing points (using original completion month)
 * 5. Creates ScoreTransaction: with original completion timestamp
 *
 * Usage:
 *   DRY_RUN=true npx tsx prisma/migrations/backfill-bug-affected-scores.ts
 *   npx tsx prisma/migrations/backfill-bug-affected-scores.ts
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN === "true";

interface AffectedRecord {
  completionId: string;
  userId: string;
  questionId: string;
  correctScore: number;
  completedAt: Date;
  // Context for ScoreTransaction
  levelInfo: string | null;
  novelInfo: string | null;
  unitInfo: string | null;
  chapterInfo: string | null;
  keywordInfo: string | null;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  explanation: string;
}

async function getBPAAffectedRecords(): Promise<AffectedRecord[]> {
  const records = await prisma.$queryRaw<
    {
      completionId: string;
      userId: string;
      questionId: string;
      correctScore: number;
      completedAt: Date;
      levelName: string | null;
      novelTitle: string | null;
      unitName: string | null;
      chapterTitle: string | null;
      questionText: string;
      selectedAnswer: string | null;
      correctAnswer: string;
      explanation: string;
    }[]
  >`
    SELECT
      bqc.id as "completionId",
      bqc."userId",
      bqc."questionId",
      bq.score as "correctScore",
      bqc."createdAt" as "completedAt",
      bl.name as "levelName",
      bn.title as "novelTitle",
      bu.name as "unitName",
      bc.title as "chapterTitle",
      bq.question as "questionText",
      bqc."selectedAnswer",
      bq.answer as "correctAnswer",
      bq.explanation
    FROM "BPAQuestionCompleted" bqc
    JOIN "BPAQuestion" bq ON bq.id = bqc."questionId"
    JOIN "BPAQuestionSet" bqs ON bqs.id = bq."questionSetId"
    JOIN "BPAChapter" bc ON bc.id = bqs."chapterId"
    LEFT JOIN "BPAUnit" bu ON bu.id = bc."unitId"
    JOIN "BPANovel" bn ON bn.id = bc."novelId"
    JOIN "BPALevel" bl ON bl.id = bn."bpaLevelId"
    LEFT JOIN "BPAQuestionFirstTry" ft
      ON ft."questionSetId" = bqs.id AND ft."userId" = bqc."userId"
    WHERE
      bqc."selectedAnswer" IS NOT NULL
      AND bqc."isCorrect" = true
      AND bqc.score = 0
      AND bqc."isRetry" = true
      AND (ft.id IS NULL OR bqc."createdAt" < ft."createdAt")
  `;

  return records.map((r) => ({
    completionId: r.completionId,
    userId: r.userId,
    questionId: r.questionId,
    correctScore: r.correctScore,
    completedAt: r.completedAt,
    levelInfo: r.levelName,
    novelInfo: r.novelTitle,
    unitInfo: r.unitName,
    chapterInfo: r.chapterTitle,
    keywordInfo: null,
    questionText: r.questionText,
    selectedAnswer: r.selectedAnswer,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
  }));
}

async function getNovelAffectedRecords(): Promise<AffectedRecord[]> {
  const records = await prisma.$queryRaw<
    {
      completionId: string;
      userId: string;
      questionId: string;
      correctScore: number;
      completedAt: Date;
      arLevel: string | null;
      novelTitle: string | null;
      chapterTitle: string | null;
      questionText: string;
      selectedAnswer: string | null;
      correctAnswer: string;
      explanation: string;
    }[]
  >`
    SELECT
      nqc.id as "completionId",
      nqc."userId",
      nqc."novelQuestionId" as "questionId",
      nq.score as "correctScore",
      nqc."createdAt" as "completedAt",
      ar.level as "arLevel",
      n.title as "novelTitle",
      nc.title as "chapterTitle",
      nq.question as "questionText",
      nqc."selectedAnswer",
      nq.answer as "correctAnswer",
      nq.explanation
    FROM "NovelQuestionCompleted" nqc
    JOIN "NovelQuestion" nq ON nq.id = nqc."novelQuestionId"
    JOIN "NovelQuestionSet" nqs ON nqs.id = nq."novelQuestionSetId"
    JOIN "NovelChapter" nc ON nc.id = nqs."novelChapterId"
    JOIN "Novel" n ON n.id = nc."novelId"
    LEFT JOIN "AR" ar ON ar.id = n."ARId"
    LEFT JOIN "NovelQuestionFirstTry" ft
      ON ft."novelQuestionSetId" = nqs.id AND ft."userId" = nqc."userId"
    WHERE
      nqc."selectedAnswer" IS NOT NULL
      AND nqc."isCorrect" = true
      AND nqc.score = 0
      AND nqc."isRetry" = true
      AND (ft.id IS NULL OR nqc."createdAt" < ft."createdAt")
  `;

  return records.map((r) => ({
    completionId: r.completionId,
    userId: r.userId,
    questionId: r.questionId,
    correctScore: r.correctScore,
    completedAt: r.completedAt,
    levelInfo: r.arLevel ? `AR ${r.arLevel}` : null,
    novelInfo: r.novelTitle,
    unitInfo: null,
    chapterInfo: r.chapterTitle,
    keywordInfo: null,
    questionText: r.questionText,
    selectedAnswer: r.selectedAnswer,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
  }));
}

async function getRCAffectedRecords(): Promise<AffectedRecord[]> {
  const records = await prisma.$queryRaw<
    {
      completionId: string;
      userId: string;
      questionId: string;
      correctScore: number;
      completedAt: Date;
      rcLevel: string | null;
      keywordName: string | null;
      questionText: string;
      selectedAnswer: string | null;
      correctAnswer: string;
      explanation: string;
    }[]
  >`
    SELECT
      rqc.id as "completionId",
      rqc."userId",
      rqc."RCQuestionId" as "questionId",
      rq.score as "correctScore",
      rqc."createdAt" as "completedAt",
      rl.level as "rcLevel",
      rk.name as "keywordName",
      rq.question as "questionText",
      rqc."selectedAnswer",
      rq.answer as "correctAnswer",
      rq.explanation
    FROM "RCQuestionCompleted" rqc
    JOIN "RCQuestion" rq ON rq.id = rqc."RCQuestionId"
    JOIN "RCQuestionSet" rqs ON rqs.id = rq."RCQuestionSetId"
    JOIN "RCKeyword" rk ON rk.id = rqs."RCKeywordId"
    JOIN "RCLevel" rl ON rl.id = rk."rcLevelId"
    LEFT JOIN "RCQuestionFirstTry" ft
      ON ft."RCQuestionSetId" = rqs.id AND ft."userId" = rqc."userId"
    WHERE
      rqc."selectedAnswer" IS NOT NULL
      AND rqc."isCorrect" = true
      AND rqc.score = 0
      AND rqc."isRetry" = true
      AND (ft.id IS NULL OR rqc."createdAt" < ft."createdAt")
  `;

  return records.map((r) => ({
    completionId: r.completionId,
    userId: r.userId,
    questionId: r.questionId,
    correctScore: r.correctScore,
    completedAt: r.completedAt,
    levelInfo: r.rcLevel ? `RC ${r.rcLevel}` : null,
    novelInfo: null,
    unitInfo: null,
    chapterInfo: null,
    keywordInfo: r.keywordName,
    questionText: r.questionText,
    selectedAnswer: r.selectedAnswer,
    correctAnswer: r.correctAnswer,
    explanation: r.explanation,
  }));
}

async function backfillBPA(records: AffectedRecord[]) {
  console.log(`\n=== Processing ${records.length} BPA records ===`);

  // Group by user for efficient score updates
  const userScores = new Map<string, number>();
  const userMonthlyScores = new Map<string, Map<string, number>>(); // userId -> "YYYY-MM" -> score

  for (const record of records) {
    // Accumulate total score per user
    userScores.set(
      record.userId,
      (userScores.get(record.userId) || 0) + record.correctScore
    );

    // Accumulate monthly scores (using original completion date)
    const monthKey = `${record.completedAt.getFullYear()}-${String(record.completedAt.getMonth() + 1).padStart(2, "0")}`;
    if (!userMonthlyScores.has(record.userId)) {
      userMonthlyScores.set(record.userId, new Map());
    }
    const userMonthly = userMonthlyScores.get(record.userId)!;
    userMonthly.set(monthKey, (userMonthly.get(monthKey) || 0) + record.correctScore);
  }

  if (DRY_RUN) {
    console.log("DRY RUN - Would update:");
    console.log(`  - ${records.length} BPAQuestionCompleted records`);
    console.log(`  - ${userScores.size} users' TotalScore`);
    console.log(`  - Create ${records.length} ScoreTransaction records`);

    // Show sample
    const sample = records.slice(0, 3);
    for (const r of sample) {
      console.log(`  Sample: User ${r.userId.slice(0, 8)}... gets +${r.correctScore} points`);
    }
    return;
  }

  let processed = 0;
  const batchSize = 100;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        // 1. Update completion record
        await tx.bPAQuestionCompleted.update({
          where: { id: record.completionId },
          data: {
            score: record.correctScore,
            isRetry: false,
          },
        });

        // 2. Create ScoreTransaction with original timestamp
        const existingTx = await tx.scoreTransaction.findFirst({
          where: {
            source: "BPA",
            sourceId: record.completionId,
          },
        });

        if (existingTx) {
          // Update existing transaction
          await tx.scoreTransaction.update({
            where: { id: existingTx.id },
            data: {
              score: record.correctScore,
              isRetry: false,
            },
          });
        } else {
          // Create new transaction with original timestamp
          await tx.$executeRaw`
            INSERT INTO "ScoreTransaction" (
              id, "userId", source, "sourceId", score,
              "levelInfo", "novelInfo", "unitInfo", "chapterInfo", "keywordInfo",
              "questionText", "selectedAnswer", "correctAnswer", "isCorrect", "isRetry", "isTimedOut",
              explanation, "createdAt"
            ) VALUES (
              gen_random_uuid(), ${record.userId}, 'BPA', ${record.completionId}, ${record.correctScore},
              ${record.levelInfo}, ${record.novelInfo}, ${record.unitInfo}, ${record.chapterInfo}, ${record.keywordInfo},
              ${record.questionText}, ${record.selectedAnswer}, ${record.correctAnswer}, true, false, false,
              ${record.explanation}, ${record.completedAt}
            )
          `;
        }
      }
    });

    processed += batch.length;
    console.log(`  Processed ${processed}/${records.length} completions`);
  }

  // 3. Update TotalScore for each user
  console.log(`  Updating TotalScore for ${userScores.size} users...`);
  for (const [userId, totalPoints] of userScores) {
    await prisma.totalScore.upsert({
      where: { userId },
      update: { score: { increment: totalPoints } },
      create: { userId, score: totalPoints },
    });
  }

  // 4. Update BPAScore (need to look up user's level assignment)
  console.log(`  Updating BPAScore...`);
  for (const record of records) {
    // Get the question's level
    const question = await prisma.bPAQuestion.findUnique({
      where: { id: record.questionId },
      include: {
        questionSet: {
          include: {
            chapter: {
              include: {
                novel: true,
              },
            },
          },
        },
      },
    });

    if (!question?.questionSet?.chapter?.novel) continue;

    const levelId = question.questionSet.chapter.novel.bpaLevelId;

    // Get user's level assignment
    const assignment = await prisma.bPAUserLevelAssignment.findFirst({
      where: { userId: record.userId, bpaLevelId: levelId },
      orderBy: { assignedAt: "desc" },
    });

    if (!assignment) continue;

    // Update or create BPAScore
    const existingScore = await prisma.bPAScore.findFirst({
      where: {
        userId: record.userId,
        bpaLevelId: levelId,
        timeframeId: assignment.timeframeId,
        season: assignment.season,
      },
    });

    if (existingScore) {
      await prisma.bPAScore.update({
        where: { id: existingScore.id },
        data: { score: { increment: record.correctScore } },
      });
    } else {
      await prisma.bPAScore.create({
        data: {
          userId: record.userId,
          bpaLevelId: levelId,
          timeframeId: assignment.timeframeId,
          season: assignment.season,
          semesterId: assignment.semesterId,
          score: record.correctScore,
        },
      });
    }

    // 5. Update MonthlyBPAScore using original completion month
    const year = record.completedAt.getFullYear();
    const month = record.completedAt.getMonth() + 1;

    await prisma.monthlyBPAScore.upsert({
      where: {
        userId_bpaLevelId_year_month: {
          userId: record.userId,
          bpaLevelId: levelId,
          year,
          month,
        },
      },
      update: { score: { increment: record.correctScore } },
      create: {
        userId: record.userId,
        bpaLevelId: levelId,
        year,
        month,
        score: record.correctScore,
      },
    });
  }

  console.log(`  BPA backfill complete!`);
}

async function backfillNovel(records: AffectedRecord[]) {
  console.log(`\n=== Processing ${records.length} Novel records ===`);

  const userScores = new Map<string, number>();

  for (const record of records) {
    userScores.set(
      record.userId,
      (userScores.get(record.userId) || 0) + record.correctScore
    );
  }

  if (DRY_RUN) {
    console.log("DRY RUN - Would update:");
    console.log(`  - ${records.length} NovelQuestionCompleted records`);
    console.log(`  - ${userScores.size} users' TotalScore`);
    console.log(`  - Create ${records.length} ScoreTransaction records`);
    return;
  }

  let processed = 0;
  const batchSize = 100;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        // 1. Update completion record
        await tx.novelQuestionCompleted.update({
          where: { id: record.completionId },
          data: {
            score: record.correctScore,
            isRetry: false,
          },
        });

        // 2. Create/update ScoreTransaction
        const existingTx = await tx.scoreTransaction.findFirst({
          where: {
            source: "Novel",
            sourceId: record.completionId,
          },
        });

        if (existingTx) {
          await tx.scoreTransaction.update({
            where: { id: existingTx.id },
            data: {
              score: record.correctScore,
              isRetry: false,
            },
          });
        } else {
          await tx.$executeRaw`
            INSERT INTO "ScoreTransaction" (
              id, "userId", source, "sourceId", score,
              "levelInfo", "novelInfo", "unitInfo", "chapterInfo", "keywordInfo",
              "questionText", "selectedAnswer", "correctAnswer", "isCorrect", "isRetry", "isTimedOut",
              explanation, "createdAt"
            ) VALUES (
              gen_random_uuid(), ${record.userId}, 'Novel', ${record.completionId}, ${record.correctScore},
              ${record.levelInfo}, ${record.novelInfo}, ${record.unitInfo}, ${record.chapterInfo}, ${record.keywordInfo},
              ${record.questionText}, ${record.selectedAnswer}, ${record.correctAnswer}, true, false, false,
              ${record.explanation}, ${record.completedAt}
            )
          `;
        }
      }
    });

    processed += batch.length;
    console.log(`  Processed ${processed}/${records.length} completions`);
  }

  // 3. Update TotalScore
  console.log(`  Updating TotalScore for ${userScores.size} users...`);
  for (const [userId, totalPoints] of userScores) {
    await prisma.totalScore.upsert({
      where: { userId },
      update: { score: { increment: totalPoints } },
      create: { userId, score: totalPoints },
    });
  }

  // 4. Update ARScore
  console.log(`  Updating ARScore...`);
  for (const record of records) {
    const question = await prisma.novelQuestion.findUnique({
      where: { id: record.questionId },
      include: {
        novelQuestionSet: {
          include: {
            novelChapter: {
              include: {
                novel: true,
              },
            },
          },
        },
      },
    });

    if (!question?.novelQuestionSet?.novelChapter?.novel?.ARId) continue;

    const arId = question.novelQuestionSet.novelChapter.novel.ARId;

    const existingScore = await prisma.aRScore.findFirst({
      where: { userId: record.userId, ARId: arId },
    });

    if (existingScore) {
      await prisma.aRScore.update({
        where: { id: existingScore.id },
        data: { score: { increment: record.correctScore } },
      });
    } else {
      await prisma.aRScore.create({
        data: {
          userId: record.userId,
          ARId: arId,
          score: record.correctScore,
        },
      });
    }
  }

  console.log(`  Novel backfill complete!`);
}

async function backfillRC(records: AffectedRecord[]) {
  console.log(`\n=== Processing ${records.length} RC records ===`);

  const userScores = new Map<string, number>();

  for (const record of records) {
    userScores.set(
      record.userId,
      (userScores.get(record.userId) || 0) + record.correctScore
    );
  }

  if (DRY_RUN) {
    console.log("DRY RUN - Would update:");
    console.log(`  - ${records.length} RCQuestionCompleted records`);
    console.log(`  - ${userScores.size} users' TotalScore`);
    console.log(`  - Create ${records.length} ScoreTransaction records`);
    return;
  }

  let processed = 0;
  const batchSize = 100;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        // 1. Update completion record
        await tx.rCQuestionCompleted.update({
          where: { id: record.completionId },
          data: {
            score: record.correctScore,
            isRetry: false,
          },
        });

        // 2. Create/update ScoreTransaction
        const existingTx = await tx.scoreTransaction.findFirst({
          where: {
            source: "RC",
            sourceId: record.completionId,
          },
        });

        if (existingTx) {
          await tx.scoreTransaction.update({
            where: { id: existingTx.id },
            data: {
              score: record.correctScore,
              isRetry: false,
            },
          });
        } else {
          await tx.$executeRaw`
            INSERT INTO "ScoreTransaction" (
              id, "userId", source, "sourceId", score,
              "levelInfo", "novelInfo", "unitInfo", "chapterInfo", "keywordInfo",
              "questionText", "selectedAnswer", "correctAnswer", "isCorrect", "isRetry", "isTimedOut",
              explanation, "createdAt"
            ) VALUES (
              gen_random_uuid(), ${record.userId}, 'RC', ${record.completionId}, ${record.correctScore},
              ${record.levelInfo}, ${record.novelInfo}, ${record.unitInfo}, ${record.chapterInfo}, ${record.keywordInfo},
              ${record.questionText}, ${record.selectedAnswer}, ${record.correctAnswer}, true, false, false,
              ${record.explanation}, ${record.completedAt}
            )
          `;
        }
      }
    });

    processed += batch.length;
    console.log(`  Processed ${processed}/${records.length} completions`);
  }

  // 3. Update TotalScore
  console.log(`  Updating TotalScore for ${userScores.size} users...`);
  for (const [userId, totalPoints] of userScores) {
    await prisma.totalScore.upsert({
      where: { userId },
      update: { score: { increment: totalPoints } },
      create: { userId, score: totalPoints },
    });
  }

  // 4. Update RCScore
  console.log(`  Updating RCScore...`);
  for (const record of records) {
    const question = await prisma.rCQuestion.findUnique({
      where: { id: record.questionId },
      include: {
        RCQuestionSet: {
          include: {
            RCKeyword: true,
          },
        },
      },
    });

    if (!question?.RCQuestionSet?.RCKeyword?.rcLevelId) continue;

    const rcLevelId = question.RCQuestionSet.RCKeyword.rcLevelId;

    const existingScore = await prisma.rCScore.findFirst({
      where: { userId: record.userId, RCLevelId: rcLevelId },
    });

    if (existingScore) {
      await prisma.rCScore.update({
        where: { id: existingScore.id },
        data: { score: { increment: record.correctScore } },
      });
    } else {
      await prisma.rCScore.create({
        data: {
          userId: record.userId,
          RCLevelId: rcLevelId,
          score: record.correctScore,
        },
      });
    }
  }

  console.log(`  RC backfill complete!`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Bug-Affected Score Backfill Script");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE (will modify data)"}`);
  console.log("=".repeat(60));

  try {
    // Fetch all affected records
    console.log("\nFetching affected records...");

    const bpaRecords = await getBPAAffectedRecords();
    console.log(`  BPA: ${bpaRecords.length} records`);

    const novelRecords = await getNovelAffectedRecords();
    console.log(`  Novel: ${novelRecords.length} records`);

    const rcRecords = await getRCAffectedRecords();
    console.log(`  RC: ${rcRecords.length} records`);

    const totalRecords = bpaRecords.length + novelRecords.length + rcRecords.length;
    const totalPoints =
      bpaRecords.reduce((sum, r) => sum + r.correctScore, 0) +
      novelRecords.reduce((sum, r) => sum + r.correctScore, 0) +
      rcRecords.reduce((sum, r) => sum + r.correctScore, 0);

    console.log(`\nTotal: ${totalRecords} records, ${totalPoints} points to restore`);

    if (totalRecords === 0) {
      console.log("\nNo affected records found. Nothing to do!");
      return;
    }

    // Process each type
    await backfillBPA(bpaRecords);
    await backfillNovel(novelRecords);
    await backfillRC(rcRecords);

    console.log("\n" + "=".repeat(60));
    console.log(DRY_RUN ? "DRY RUN COMPLETE" : "BACKFILL COMPLETE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\nError during backfill:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
