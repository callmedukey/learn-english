import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

/**
 * Migration script to create default units for existing BPA novels
 * and assign all existing chapters to these units.
 *
 * Run with: tsx prisma/migrations/create-default-bpa-units.ts
 */
async function main() {
  console.log("Starting BPA Units migration...");

  // Get all BPA novels
  const novels = await prisma.bPANovel.findMany({
    include: {
      chapters: {
        orderBy: { orderNumber: "asc" },
      },
    },
  });

  console.log(`Found ${novels.length} novels to process`);

  let createdUnits = 0;
  let updatedChapters = 0;

  for (const novel of novels) {
    console.log(`\nProcessing novel: ${novel.title}`);

    // Check if novel already has units
    const existingUnits = await prisma.bPAUnit.findMany({
      where: { novelId: novel.id },
    });

    if (existingUnits.length > 0) {
      console.log(`  Novel already has ${existingUnits.length} unit(s), skipping`);
      continue;
    }

    // Check if novel has chapters without units
    const chaptersWithoutUnits = novel.chapters.filter(
      (chapter) => !chapter.unitId
    );

    if (chaptersWithoutUnits.length === 0) {
      console.log(`  No chapters without units, skipping`);
      continue;
    }

    // Create a default unit for this novel
    console.log(`  Creating default unit for ${chaptersWithoutUnits.length} chapters`);
    const unit = await prisma.bPAUnit.create({
      data: {
        novelId: novel.id,
        name: "Unit 1",
        description: "Default unit created during migration",
        orderNumber: 1,
      },
    });

    createdUnits++;
    console.log(`  Created unit: ${unit.name} (ID: ${unit.id})`);

    // Assign all chapters to this unit
    const chapterIds = chaptersWithoutUnits.map((chapter) => chapter.id);

    const updateResult = await prisma.bPAChapter.updateMany({
      where: {
        id: { in: chapterIds },
      },
      data: {
        unitId: unit.id,
      },
    });

    updatedChapters += updateResult.count;
    console.log(`  Updated ${updateResult.count} chapters`);
  }

  console.log("\n=== Migration Summary ===");
  console.log(`Created ${createdUnits} default units`);
  console.log(`Updated ${updatedChapters} chapters`);
  console.log("Migration completed successfully!");
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
