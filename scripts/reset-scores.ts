import readline from "readline";

import { prisma } from "@/prisma/prisma-client";

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

async function resetAllScoresAndNotifications() {
  console.log(
    "\n⚠️  WARNING: This will delete ALL scores, notifications, and related data!",
  );
  console.log("This includes:");
  console.log("- All user scores (Total, AR, RC, Monthly)");
  console.log("- All question completion records");
  console.log("- All notifications and popup dismissals");
  console.log("- All medals and leaderboard records");
  console.log("- All level locks and change requests");
  console.log("\nThis action cannot be undone!\n");

  const answer = await askQuestion(
    "Are you sure you want to continue? (yes/no): ",
  );

  if (answer.toLowerCase() !== "yes") {
    console.log("Operation cancelled.");
    rl.close();
    return;
  }

  const confirm = await askQuestion('Type "DELETE ALL DATA" to confirm: ');

  if (confirm !== "DELETE ALL DATA") {
    console.log("Confirmation text did not match. Operation cancelled.");
    rl.close();
    return;
  }

  console.log("\nStarting complete data reset...\n");

  try {
    await prisma.$transaction(async (tx) => {
      // Delete all notifications and popup dismissals
      console.log("Deleting notifications...");
      const notifications = await tx.notification.deleteMany({});
      console.log(`✓ Deleted ${notifications.count} notifications`);

      console.log("Deleting popup dismissals...");
      const popupDismissals = await tx.userPopupDismissal.deleteMany({});
      console.log(`✓ Deleted ${popupDismissals.count} popup dismissals`);

      // Delete all medals and leaderboard records
      console.log("Deleting medals...");
      const medals = await tx.medal.deleteMany({});
      console.log(`✓ Deleted ${medals.count} medals`);

      console.log("Deleting monthly leaderboards...");
      const leaderboards = await tx.monthlyLeaderboard.deleteMany({});
      console.log(`✓ Deleted ${leaderboards.count} leaderboard records`);

      // Delete level locks and change requests
      console.log("Deleting level change requests...");
      const changeRequests = await tx.levelChangeRequest.deleteMany({});
      console.log(`✓ Deleted ${changeRequests.count} level change requests`);

      console.log("Deleting user level locks...");
      const levelLocks = await tx.userLevelLock.deleteMany({});
      console.log(`✓ Deleted ${levelLocks.count} level locks`);

      // Delete all question completion records
      console.log("Deleting novel question completions...");
      const novelCompletions = await tx.novelQuestionCompleted.deleteMany({});
      console.log(
        `✓ Deleted ${novelCompletions.count} novel question completions`,
      );

      console.log("Deleting RC question completions...");
      const rcCompletions = await tx.rCQuestionCompleted.deleteMany({});
      console.log(`✓ Deleted ${rcCompletions.count} RC question completions`);

      console.log("Deleting novel first tries...");
      const novelFirst = await tx.novelQuestionFirstTry.deleteMany({});
      console.log(`✓ Deleted ${novelFirst.count} novel first tries`);

      console.log("Deleting novel second tries...");
      const novelSecond = await tx.novelQuestionSecondTry.deleteMany({});
      console.log(`✓ Deleted ${novelSecond.count} novel second tries`);

      console.log("Deleting RC first tries...");
      const rcFirst = await tx.rCQuestionFirstTry.deleteMany({});
      console.log(`✓ Deleted ${rcFirst.count} RC first tries`);

      console.log("Deleting RC second tries...");
      const rcSecond = await tx.rCQuestionSecondTry.deleteMany({});
      console.log(`✓ Deleted ${rcSecond.count} RC second tries`);

      // Delete all scores
      console.log("Deleting monthly AR scores...");
      const monthlyAR = await tx.monthlyARScore.deleteMany({});
      console.log(`✓ Deleted ${monthlyAR.count} monthly AR scores`);

      console.log("Deleting monthly RC scores...");
      const monthlyRC = await tx.monthlyRCScore.deleteMany({});
      console.log(`✓ Deleted ${monthlyRC.count} monthly RC scores`);

      console.log("Deleting AR scores...");
      const arScores = await tx.aRScore.deleteMany({});
      console.log(`✓ Deleted ${arScores.count} AR scores`);

      console.log("Deleting RC scores...");
      const rcScores = await tx.rCScore.deleteMany({});
      console.log(`✓ Deleted ${rcScores.count} RC scores`);

      console.log("Deleting total scores...");
      const totalScores = await tx.totalScore.deleteMany({});
      console.log(`✓ Deleted ${totalScores.count} total scores`);
    });

    console.log(
      "\n✅ All scores, notifications, and related data have been successfully deleted!",
    );
    console.log("The database is now clean of all user progress data.\n");
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
resetAllScoresAndNotifications().catch((error) => {
  console.error("Fatal error:", error);
  rl.close();
  process.exit(1);
});
