#!/usr/bin/env tsx
/**
 * Test script for subscription expiration job
 * Run with: npx tsx scripts/test-subscription-expiration.ts
 */

import { runSubscriptionExpirationJob } from "../lib/jobs/subscription-expiration";
import { prisma } from "../prisma/prisma-client";

async function main() {
  console.log("🧪 Testing Subscription Expiration Job...\n");
  
  try {
    // Run the job
    const result = await runSubscriptionExpirationJob();
    
    console.log("\n✅ Test completed successfully!");
    console.log("Results:", result);
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();