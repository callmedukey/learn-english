#!/usr/bin/env tsx
/**
 * Script to apply a test coupon to a user's active subscription
 * This ensures the billing service will apply discounts correctly
 * 
 * Run with: npx tsx scripts/apply-test-coupon.ts [email] [coupon-code]
 * Example: npx tsx scripts/apply-test-coupon.ts test@readingchamp.com TEST_3MONTH_50OFF
 */

import { prisma } from "../prisma/prisma-client";
import { CouponRecurringType } from "../prisma/generated/prisma";
import * as readline from "readline";

const userEmail = process.argv[2] || "test@readingchamp.com";
const couponCode = process.argv[3] || "TEST_3MONTH_50OFF";

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

async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
    });
  });
}

async function main() {
  console.clear();
  log(`\n🎟️  Apply Test Coupon to Subscription\n`, colors.bright + colors.cyan);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      log(`❌ User not found: ${userEmail}`, colors.red);
      process.exit(1);
    }

    log(`✓ Found user: ${user.email}`, colors.green);

    // Find active subscription
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        autoRenew: true,
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!subscription) {
      log(`\n❌ No active subscription found for this user`, colors.red);
      process.exit(1);
    }

    log(`\n📋 Found subscription:`, colors.bright);
    log(`  ID: ${subscription.id}`, colors.cyan);
    log(`  Plan: ${subscription.plan.name}`, colors.cyan);
    log(`  Price: ₩${subscription.plan.price.toLocaleString()}`, colors.cyan);

    // Find or create coupon
    let coupon = await prisma.discountCoupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      log(`\n⚠️  Coupon not found. Creating new coupon...`, colors.yellow);
      
      const discountPercentage = parseInt(couponCode.match(/\d+/)?.[0] || "50");
      const durationMonths = parseInt(couponCode.match(/(\d+)MONTH/)?.[1] || "3");
      
      coupon = await prisma.discountCoupon.create({
        data: {
          code: couponCode,
          discount: discountPercentage,
          flatDiscount: 0,
          active: true,
          recurringType: CouponRecurringType.RECURRING,
          recurringMonths: durationMonths,
          oneTimeUse: false,
        },
      });
      
      log(`✓ Created coupon: ${coupon.code}`, colors.green);
    }

    log(`\n🎟️  Coupon details:`, colors.bright);
    log(`  Code: ${coupon.code}`, colors.cyan);
    log(`  Type: ${coupon.recurringType}`, colors.cyan);
    log(`  Discount: ${coupon.discount}%`, colors.cyan);
    if (coupon.flatDiscount > 0) {
      log(`  Flat Discount: ₩${coupon.flatDiscount.toLocaleString()}`, colors.cyan);
    }
    log(`  Duration: ${coupon.recurringMonths} months`, colors.cyan);

    // Check existing coupon application
    const existingApp = await prisma.couponApplication.findUnique({
      where: {
        subscriptionId_couponId: {
          subscriptionId: subscription.id,
          couponId: coupon.id,
        },
      },
    });

    if (existingApp) {
      log(`\n⚠️  Coupon already applied to this subscription`, colors.yellow);
      log(`  Current status:`, colors.cyan);
      log(`    Active: ${existingApp.isActive}`, existingApp.isActive ? colors.green : colors.red);
      log(`    Applied Count: ${existingApp.appliedCount}`, colors.cyan);
      log(`    Remaining Months: ${existingApp.remainingMonths}`, colors.cyan);
      
      const update = await askConfirmation("\nDo you want to reset this coupon application?");
      if (!update) {
        log("\nCancelled.", colors.yellow);
        process.exit(0);
      }
    }

    // Calculate expected payment amounts
    const discountAmount = coupon.discount > 0
      ? Math.floor((subscription.plan.price * coupon.discount) / 100)
      : Math.min(coupon.flatDiscount, subscription.plan.price);
    const discountedPrice = subscription.plan.price - discountAmount;

    log(`\n💰 Payment calculation:`, colors.bright);
    log(`  Original price: ₩${subscription.plan.price.toLocaleString()}`, colors.cyan);
    log(`  Discount amount: ₩${discountAmount.toLocaleString()}`, colors.green);
    log(`  Discounted price: ₩${discountedPrice.toLocaleString()}`, colors.bright + colors.green);
    log(`  This discount will apply for ${coupon.recurringMonths} payments`, colors.cyan);

    const confirmed = await askConfirmation("\nApply this coupon to the subscription?");
    if (!confirmed) {
      log("\nCancelled.", colors.yellow);
      process.exit(0);
    }

    // Apply or update coupon application
    if (existingApp) {
      await prisma.couponApplication.update({
        where: { id: existingApp.id },
        data: {
          isActive: true,
          appliedCount: 0,
          remainingMonths: coupon.recurringMonths,
          discountPercentage: coupon.discount,
          flatDiscountKRW: coupon.flatDiscount,
        },
      });
      log(`\n✓ Coupon application reset successfully!`, colors.green);
    } else {
      await prisma.couponApplication.create({
        data: {
          subscriptionId: subscription.id,
          couponId: coupon.id,
          isActive: true,
          appliedCount: 0,
          remainingMonths: coupon.recurringMonths,
          discountPercentage: coupon.discount,
          flatDiscountKRW: coupon.flatDiscount,
        },
      });
      log(`\n✓ Coupon applied successfully!`, colors.green);
    }

    log(`\n📌 Next steps:`, colors.bright);
    log(`1. Run the billing test: npx tsx scripts/test-billing-single-user.ts ${userEmail}`, colors.cyan);
    log(`2. The payment should be ₩${discountedPrice.toLocaleString()} instead of ₩${subscription.plan.price.toLocaleString()}`, colors.cyan);
    log(`3. After ${coupon.recurringMonths} payments, the discount will expire`, colors.cyan);

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();