#!/usr/bin/env tsx
/**
 * Test script to verify CouponApplication creation fix
 * This simulates the payment confirmation flow to test the updated logic
 * 
 * Run with: npx tsx scripts/test-coupon-application-fix.ts
 */

import { prisma } from "../prisma/prisma-client";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  console.clear();
  log("\n🧪 Testing CouponApplication Creation Fix\n", colors.bright + colors.cyan);

  try {
    // Find test user
    const testUser = await prisma.user.findUnique({
      where: { email: "test@readingchamp.com" },
      include: {
        country: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            payment: {
              include: {
                coupon: true,
              },
            },
            couponApplications: true,
          },
        },
      },
    });

    if (!testUser) {
      log("❌ Test user not found!", colors.red);
      return;
    }

    log("👤 Test User Details:", colors.bright);
    log(`  Email: ${testUser.email}`, colors.cyan);
    log(`  Country: ${testUser.country?.name || "Not set"}`, colors.cyan);
    log(`  Is Korean: ${testUser.country?.name === "South Korea"}`, colors.cyan);

    const latestSub = testUser.subscriptions[0];
    if (!latestSub) {
      log("\n❌ No subscription found for test user", colors.red);
      return;
    }

    log("\n📊 Latest Subscription:", colors.bright);
    log(`  ID: ${latestSub.id}`, colors.cyan);
    log(`  Status: ${latestSub.status}`, colors.cyan);
    log(`  Auto-renew: ${latestSub.autoRenew}`, colors.cyan);
    log(`  Billing Key: ${latestSub.billingKey || "None"}`, colors.cyan);
    
    if (latestSub.payment?.couponCode) {
      log(`  Coupon used: ${latestSub.payment.couponCode}`, colors.cyan);
      log(`  Coupon type: ${latestSub.payment.coupon?.recurringType || "Unknown"}`, colors.cyan);
    }

    log(`  CouponApplications: ${latestSub.couponApplications.length}`, 
      latestSub.couponApplications.length > 0 ? colors.green : colors.yellow);

    // Simulate the fixed logic
    log("\n🔧 Testing Fixed Logic:", colors.bright);
    const isKoreanUser = testUser.country?.name === "South Korea";
    const hasBillingKey = !!latestSub.billingKey;
    const isRecurringSetup = isKoreanUser || hasBillingKey;
    
    log(`  Is Korean user: ${isKoreanUser}`, colors.cyan);
    log(`  Has billing key: ${hasBillingKey}`, colors.cyan);
    log(`  Is recurring setup (fixed logic): ${isRecurringSetup}`, 
      isRecurringSetup ? colors.green : colors.yellow);

    if (latestSub.payment?.coupon) {
      const shouldCreateApp = !!(
        latestSub.payment.coupon.recurringType === "RECURRING" &&
        isRecurringSetup
      );
      log(`  Should create CouponApplication: ${shouldCreateApp}`,
        shouldCreateApp ? colors.green : colors.yellow);

      if (shouldCreateApp && latestSub.couponApplications.length === 0) {
        log("\n⚠️  CouponApplication should exist but doesn't!", colors.yellow);
        log("  The fix should resolve this for new payments.", colors.cyan);
      } else if (shouldCreateApp && latestSub.couponApplications.length > 0) {
        log("\n✅ CouponApplication exists as expected!", colors.green);
      }
    }

    // Check if we need to retroactively fix
    if (latestSub.payment?.coupon?.recurringType === "RECURRING" && 
        latestSub.billingKey && 
        latestSub.couponApplications.length === 0) {
      log("\n💡 Recommendation:", colors.bright);
      log("  Run the fix script to create missing CouponApplication:", colors.yellow);
      log("  npx tsx scripts/fix-missing-coupon-application.ts test@readingchamp.com", colors.cyan);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();