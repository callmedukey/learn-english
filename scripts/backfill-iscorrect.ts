import { prisma } from "@/prisma/prisma-client";

async function backfillIsCorrect() {
  console.log("Starting backfill of isCorrect field for old records...\n");

  try {
    // Update NovelQuestionCompleted records
    console.log("Updating NovelQuestionCompleted records...");
    const novelResult = await prisma.$executeRaw`
      UPDATE "NovelQuestionCompleted"
      SET "isCorrect" = true
      WHERE "score" > 0
        AND "selectedAnswer" IS NULL
    `;
    console.log(`✓ Updated ${novelResult} NovelQuestionCompleted records\n`);

    // Update RCQuestionCompleted records
    console.log("Updating RCQuestionCompleted records...");
    const rcResult = await prisma.$executeRaw`
      UPDATE "RCQuestionCompleted"
      SET "isCorrect" = true
      WHERE "score" > 0
        AND "selectedAnswer" IS NULL
    `;
    console.log(`✓ Updated ${rcResult} RCQuestionCompleted records\n`);

    // Verify the updates
    console.log("Verifying updates...");
    const verification = await prisma.$queryRaw<
      Array<{ table_name: string; updated_count: bigint }>
    >`
      SELECT
        'NovelQuestionCompleted' as table_name,
        COUNT(*) as updated_count
      FROM "NovelQuestionCompleted"
      WHERE "isCorrect" = true
        AND "selectedAnswer" IS NULL

      UNION ALL

      SELECT
        'RCQuestionCompleted' as table_name,
        COUNT(*) as updated_count
      FROM "RCQuestionCompleted"
      WHERE "isCorrect" = true
        AND "selectedAnswer" IS NULL
    `;

    console.log("\nVerification Results:");
    verification.forEach((row) => {
      console.log(`  ${row.table_name}: ${row.updated_count} records marked as correct`);
    });

    console.log("\n✅ Backfill completed successfully!");
  } catch (error) {
    console.error("❌ Error during backfill:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillIsCorrect()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
