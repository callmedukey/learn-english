import { prisma } from "../prisma/prisma-client";

async function verifyBeginnerFreeKeywords() {
  try {
    console.log("🔍 Verifying Beginner level keywords free status...\n");

    // Find the Beginner level
    const beginnerLevel = await prisma.rCLevel.findFirst({
      where: {
        level: "Beginner",
      },
      include: {
        RCKeyword: {
          take: 10, // Show first 10 keywords as sample
          orderBy: {
            name: 'asc',
          },
        },
      },
    });

    if (!beginnerLevel) {
      console.log("❌ Beginner level not found");
      return;
    }

    console.log(`📚 Level: ${beginnerLevel.level}`);
    console.log(`📖 Grade: ${beginnerLevel.relevantGrade}`);
    console.log(`⭐ Stars: ${beginnerLevel.stars}`);
    console.log(`❓ Total Questions: ${beginnerLevel.numberOfQuestions}\n`);

    // Count free vs paid keywords
    const stats = await prisma.rCKeyword.groupBy({
      by: ['isFree'],
      where: {
        rcLevelId: beginnerLevel.id,
      },
      _count: true,
    });

    const freeCount = stats.find(s => s.isFree === true)?._count || 0;
    const paidCount = stats.find(s => s.isFree === false)?._count || 0;

    console.log("📊 Keyword Statistics:");
    console.log(`   🆓 Free: ${freeCount}`);
    console.log(`   💰 Paid: ${paidCount}`);
    console.log(`   📝 Total: ${freeCount + paidCount}\n`);

    console.log("🔍 Sample of keywords (first 10):");
    console.log("─".repeat(60));
    
    beginnerLevel.RCKeyword.forEach((keyword, index) => {
      const status = keyword.isFree ? "🆓 FREE" : "💰 PAID";
      const hidden = keyword.hidden ? "🔒" : "✅";
      const coming = keyword.comingSoon ? "🔜" : "✅";
      console.log(
        `${(index + 1).toString().padStart(2)}. ${keyword.name.padEnd(30)} ${status} ${hidden} ${coming}`
      );
    });

    console.log("─".repeat(60));
    console.log("\nLegend: 🔒 = Hidden, 🔜 = Coming Soon, ✅ = Available");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBeginnerFreeKeywords();