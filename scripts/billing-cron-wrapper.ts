#!/usr/bin/env tsx
import { toZonedTime } from "date-fns-tz";

import { processRecurringBilling } from "../jobs/subscription-billing.job";
import { APP_TIMEZONE } from "../lib/constants/timezone";
import { prisma } from "../prisma/prisma-client";

/**
 * Billing cron wrapper that processes recurring payments daily
 * Runs at 10:00 AM KST to charge subscriptions due for renewal
 * 
 * Note: Toss Payments does NOT automatically handle recurring payments.
 * We must actively check for due subscriptions and charge them using the stored billing keys.
 */
async function main() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  
  console.log("\n========================================");
  console.log("Billing Cron Job");
  console.log(`UTC Time: ${now.toISOString()}`);
  console.log(`Korea Time: ${koreaTime.toISOString()}`);
  console.log("========================================\n");

  try {
    console.log("🔄 Processing recurring billing payments...");
    
    await processRecurringBilling();
    
    console.log("\n✅ Billing job completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Billing job failed:", error);
    
    // TODO: Send alert notification to admin
    // This is critical - failed billing means lost revenue
    
    process.exit(1);
  }
}

// Run the main function
main()
  .catch(async (error) => {
    console.error("❌ Unexpected error in billing cron wrapper:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });