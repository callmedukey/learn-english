import path from 'path';
import readline from "readline";

import * as dotenv from 'dotenv';

import { prisma } from "@/prisma/prisma-client";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function resetUserScores() {
  console.log("\n🔄 User Score Reset Tool\n");
  
  // Get email address
  const email = await askQuestion("Enter the user's email address: ");
  
  if (!email) {
    console.log("No email provided. Operation cancelled.");
    rl.close();
    return;
  }

  try {
    // Find user
    console.log(`\nSearching for user with email: ${email}...`);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        totalScore: true,
        arScores: true,
        rcScores: true,
        monthlyARScores: true,
        monthlyRCScores: true,
        medals: true,
      }
    });

    if (!user) {
      console.log(`\n❌ No user found with email: ${email}`);
      rl.close();
      return;
    }

    // Display user information
    console.log(`\n✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    
    console.log(`\n📊 Current Score Statistics:`);
    console.log(`   Total Score: ${user.totalScore?.score || 0}`);
    console.log(`   AR Levels with scores: ${user.arScores.length}`);
    console.log(`   RC Levels with scores: ${user.rcScores.length}`);
    console.log(`   Monthly AR Records: ${user.monthlyARScores.length}`);
    console.log(`   Monthly RC Records: ${user.monthlyRCScores.length}`);
    console.log(`   Medals Earned: ${user.medals.length}`);

    // Get additional counts
    const novelCompletions = await prisma.novelQuestionCompleted.count({
      where: { userId: user.id }
    });
    const rcCompletions = await prisma.rCQuestionCompleted.count({
      where: { userId: user.id }
    });

    console.log(`   Novel Questions Completed: ${novelCompletions}`);
    console.log(`   RC Questions Completed: ${rcCompletions}`);

    console.log(
      "\n⚠️  WARNING: This will delete ALL scores and progress data for this user!",
    );
    console.log("This includes:");
    console.log("- All scores (Total, AR, RC, Monthly)");
    console.log("- All question completion records");
    console.log("- All quiz attempts (first/second tries)");
    console.log("- All medals earned");
    console.log("- All level locks and change requests");
    console.log("- All notifications");
    console.log("- All popup dismissals");
    console.log("\nThis action cannot be undone!\n");

    const answer = await askQuestion(
      "Are you sure you want to continue? (yes/no): ",
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("Operation cancelled.");
      rl.close();
      return;
    }

    const confirm = await askQuestion(`Type "${user.email}" to confirm: `);

    if (confirm !== user.email) {
      console.log("Email did not match. Operation cancelled.");
      rl.close();
      return;
    }

    console.log(`\nStarting data reset for user ${user.email}...\n`);

    await prisma.$transaction(async (tx) => {
      // Delete notifications
      console.log("Deleting notifications...");
      const notifications = await tx.notification.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${notifications.count} notifications`);

      // Delete popup dismissals
      console.log("Deleting popup dismissals...");
      const popupDismissals = await tx.userPopupDismissal.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${popupDismissals.count} popup dismissals`);

      // Delete medals
      console.log("Deleting medals...");
      const medals = await tx.medal.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${medals.count} medals`);

      // Delete level change requests
      console.log("Deleting level change requests...");
      const changeRequests = await tx.levelChangeRequest.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${changeRequests.count} level change requests`);

      // Delete level locks
      console.log("Deleting user level locks...");
      const levelLocks = await tx.userLevelLock.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${levelLocks.count} level locks`);

      // Delete novel question completions
      console.log("Deleting novel question completions...");
      const novelCompletions = await tx.novelQuestionCompleted.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${novelCompletions.count} novel question completions`);

      // Delete RC question completions
      console.log("Deleting RC question completions...");
      const rcCompletions = await tx.rCQuestionCompleted.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${rcCompletions.count} RC question completions`);

      // Delete novel first tries
      console.log("Deleting novel first tries...");
      const novelFirst = await tx.novelQuestionFirstTry.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${novelFirst.count} novel first tries`);

      // Delete novel second tries
      console.log("Deleting novel second tries...");
      const novelSecond = await tx.novelQuestionSecondTry.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${novelSecond.count} novel second tries`);

      // Delete RC first tries
      console.log("Deleting RC first tries...");
      const rcFirst = await tx.rCQuestionFirstTry.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${rcFirst.count} RC first tries`);

      // Delete RC second tries
      console.log("Deleting RC second tries...");
      const rcSecond = await tx.rCQuestionSecondTry.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${rcSecond.count} RC second tries`);

      // Delete monthly scores
      console.log("Deleting monthly AR scores...");
      const monthlyAR = await tx.monthlyARScore.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${monthlyAR.count} monthly AR scores`);

      console.log("Deleting monthly RC scores...");
      const monthlyRC = await tx.monthlyRCScore.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${monthlyRC.count} monthly RC scores`);

      // Delete AR scores
      console.log("Deleting AR scores...");
      const arScores = await tx.aRScore.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${arScores.count} AR scores`);

      // Delete RC scores
      console.log("Deleting RC scores...");
      const rcScores = await tx.rCScore.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${rcScores.count} RC scores`);

      // Delete total score
      console.log("Deleting total score...");
      const totalScore = await tx.totalScore.deleteMany({
        where: { userId: user.id }
      });
      console.log(`✓ Deleted ${totalScore.count} total score`);
    });

    console.log(
      `\n✅ All scores and progress data for user ${user.email} have been successfully deleted!`,
    );
    console.log("The user can now start fresh.\n");
  } catch (error) {
    console.error("\n❌ Error during reset:", error);
    console.error(
      "Some data may have been deleted. Please check the database.",
    );
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Execute the reset
resetUserScores().catch((error) => {
  console.error("Fatal error:", error);
  rl.close();
  process.exit(1);
});