#!/usr/bin/env tsx
import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "../lib/constants/timezone";
import { runMedalAssignmentJob } from "../lib/jobs/medal-assignment";
import { prisma } from "../prisma/prisma-client";

/**
 * Timezone-aware cron wrapper that ensures medal assignment runs at 00:00 KST
 * This wrapper can be run hourly and will only execute the job at midnight Korean time
 */
async function main() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const hour = koreaTime.getHours();
  const minute = koreaTime.getMinutes();

  console.log("\n========================================");
  console.log("Cron Wrapper Check");
  console.log(`UTC Time: ${now.toISOString()}`);
  console.log(`Korea Time: ${koreaTime.toISOString()}`);
  console.log(`Korea Hour: ${hour}:${minute.toString().padStart(2, "0")}`);
  console.log("========================================\n");

  // Only run between 00:00-00:59 KST
  if (hour === 0) {
    console.log("✅ It is midnight in Korea! Running medal assignment job...");
    try {
      const result = await runMedalAssignmentJob();
      console.log("\n✅ Medal job completed successfully!");
      process.exit(0);
    } catch (error) {
      console.error("\n❌ Medal job failed:", error);
      process.exit(1);
    }
  } else {
    console.log(`⏭️  Skipping: Current KST hour is ${hour}, not midnight (0)`);
    console.log(`   Job will run in ${24 - hour} hours`);
  }

  process.exit(0);
}

// Run the main function
main()
  .catch(async (error) => {
    console.error("❌ Unexpected error in cron wrapper:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });