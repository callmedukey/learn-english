#!/usr/bin/env tsx
import { runMedalAssignmentJob } from "../lib/jobs/medal-assignment";
import { prisma } from "../prisma/prisma-client";

/**
 * Cron script for running medal assignment job
 * This script is designed to be run by cron or PM2
 */
async function main() {
  console.log("\n========================================");
  console.log("Medal Assignment Cron Job");
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("========================================\n");

  try {
    // Run the medal assignment job
    const result = await runMedalAssignmentJob();

    console.log("\n========================================");
    console.log("Job completed successfully!");
    console.log(`Medals awarded for ${result.medalizedChallenges} challenges`);
    console.log(`Activated ${result.activatedChallenges} new challenges`);
    console.log("========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n========================================");
    console.error("Job failed with error:");
    console.error(error);
    console.error("========================================\n");

    process.exit(1);
  } finally {
    // Ensure database connection is closed
    await prisma.$disconnect();
  }
}

// Run the main function
main().catch(async (error) => {
  console.error("Unexpected error:", error);
  await prisma.$disconnect();
  process.exit(1);
});
