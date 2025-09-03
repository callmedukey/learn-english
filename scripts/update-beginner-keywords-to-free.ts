import { prisma } from "../prisma/prisma-client";

async function updateBeginnerKeywordsToFree() {
  try {
    console.log("🔄 Starting update of Beginner level keywords to free access...");

    // Find the Beginner level
    const beginnerLevel = await prisma.rCLevel.findFirst({
      where: {
        level: "Beginner",
      },
    });

    if (!beginnerLevel) {
      console.log("❌ Beginner level not found in the database");
      return;
    }

    console.log(`✅ Found Beginner level: ${beginnerLevel.level} (${beginnerLevel.relevantGrade})`);

    // Count existing keywords for this level
    const totalKeywords = await prisma.rCKeyword.count({
      where: {
        rcLevelId: beginnerLevel.id,
      },
    });

    console.log(`📊 Total keywords in Beginner level: ${totalKeywords}`);

    // Count how many are already free
    const alreadyFreeCount = await prisma.rCKeyword.count({
      where: {
        rcLevelId: beginnerLevel.id,
        isFree: true,
      },
    });

    console.log(`🆓 Keywords already free: ${alreadyFreeCount}`);

    // Update all keywords for Beginner level to be free
    const updateResult = await prisma.rCKeyword.updateMany({
      where: {
        rcLevelId: beginnerLevel.id,
        isFree: false, // Only update those that aren't already free
      },
      data: {
        isFree: true,
      },
    });

    console.log(`\n✨ Update complete!`);
    console.log(`📝 Keywords updated: ${updateResult.count}`);
    console.log(`✅ All ${totalKeywords} Beginner level keywords are now free access`);

    // Verify the update
    const verificationCount = await prisma.rCKeyword.count({
      where: {
        rcLevelId: beginnerLevel.id,
        isFree: true,
      },
    });

    if (verificationCount === totalKeywords) {
      console.log(`\n🎉 Verification successful! All Beginner keywords are now free.`);
    } else {
      console.log(`\n⚠️  Verification found ${verificationCount} free keywords out of ${totalKeywords} total.`);
    }

  } catch (error) {
    console.error("❌ Error updating keywords:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateBeginnerKeywordsToFree()
  .then(() => {
    console.log("\n🚀 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });