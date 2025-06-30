#!/usr/bin/env tsx
import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "../lib/constants/timezone";
import { runSubscriptionExpirationJob } from "../lib/jobs/subscription-expiration";
import { prisma } from "../prisma/prisma-client";

/**
 * Timezone-aware cron wrapper that ensures subscription expiration runs at 00:30 KST
 * This wrapper can be run hourly and will only execute the job at 00:30 Korean time
 * Running 30 minutes after medal assignment to avoid conflicts
 */
async function main() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const hour = koreaTime.getHours();
  const minute = koreaTime.getMinutes();

  console.log("\n========================================");
  console.log("Subscription Cron Wrapper Check");
  console.log(`UTC Time: ${now.toISOString()}`);
  console.log(`Korea Time: ${koreaTime.toISOString()}`);
  console.log(`Korea Hour: ${hour}:${minute.toString().padStart(2, "0")}`);
  console.log("========================================\n");

  // Only run at 00:30 KST (30 minutes after medal job)
  if (hour === 0 && minute >= 30 && minute < 59) {
    console.log("✅ Running subscription expiration job...");
    try {
      const result = await runSubscriptionExpirationJob();
      console.log("\n✅ Subscription job completed successfully!");
      console.log(`  - Expired: ${result.expiredSubscriptions} subscriptions`);
      console.log(`  - Notifications sent: ${result.notificationsSent}`);
      process.exit(0);
    } catch (error) {
      console.error("\n❌ Subscription job failed:", error);
      process.exit(1);
    }
  } else {
    console.log(`⏭️  Skipping: Current KST time is ${hour}:${minute.toString().padStart(2, "0")}, not 00:30`);
    if (hour === 0 && minute < 30) {
      console.log(`   Job will run in ${30 - minute} minutes`);
    } else {
      const hoursUntil = hour === 0 ? 0 : 24 - hour;
      const minutesUntil = hour === 0 ? 30 - minute : 30;
      console.log(`   Job will run in ${hoursUntil} hours and ${minutesUntil} minutes`);
    }
  }

  process.exit(0);
}

// Run the main function
main()
  .catch(async (error) => {
    console.error("❌ Unexpected error in subscription cron wrapper:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });