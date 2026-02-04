import path from "path";
import readline from "readline";

import * as dotenv from "dotenv";

import { prisma } from "@/prisma/prisma-client";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

async function clearAllPushNotificationData() {
  console.log(
    "\n⚠️  WARNING: This will delete ALL push notification data!",
  );
  console.log("This includes:");
  console.log("- All device tokens (FCM tokens for all users)");
  console.log("- All push campaigns");
  console.log("- All push send results");
  console.log("\nThis action cannot be undone!\n");

  const answer = await askQuestion(
    "Are you sure you want to continue? (yes/no): ",
  );

  if (answer.toLowerCase() !== "yes") {
    console.log("Operation cancelled.");
    rl.close();
    return;
  }

  const confirm = await askQuestion('Type "DELETE PUSH DATA" to confirm: ');

  if (confirm !== "DELETE PUSH DATA") {
    console.log("Confirmation text did not match. Operation cancelled.");
    rl.close();
    return;
  }

  console.log("\nStarting push notification data cleanup...\n");

  try {
    await prisma.$transaction(async (tx) => {
      // Delete push send results first (references PushCampaign)
      console.log("Deleting push send results...");
      const sendResults = await tx.pushSendResult.deleteMany({});
      console.log(`✓ Deleted ${sendResults.count} push send results`);

      // Delete push campaigns
      console.log("Deleting push campaigns...");
      const campaigns = await tx.pushCampaign.deleteMany({});
      console.log(`✓ Deleted ${campaigns.count} push campaigns`);

      // Delete device tokens
      console.log("Deleting device tokens...");
      const deviceTokens = await tx.deviceToken.deleteMany({});
      console.log(`✓ Deleted ${deviceTokens.count} device tokens`);
    });

    console.log(
      "\n✅ All push notification data has been successfully deleted!",
    );
    console.log("Users will need to re-register their devices for push notifications.\n");
  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
    console.error(
      "Some data may have been deleted. Please check the database.",
    );
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Execute the cleanup
clearAllPushNotificationData().catch((error) => {
  console.error("Fatal error:", error);
  rl.close();
  process.exit(1);
});
