#!/usr/bin/env tsx
/**
 * Script to fix ALL subscriptions that used coupons but don't have CouponApplications
 * This will scan all active subscriptions and fix any missing coupon applications
 * 
 * Run with: npx tsx scripts/fix-all-missing-coupons.ts [--auto-fix]
 */

import { prisma } from "../prisma/prisma-client";
import { CouponRecurringType } from "../prisma/generated/prisma";

const autoFix = process.argv.includes("--auto-fix");

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
  log(`\n🔧 Scanning for Missing Coupon Applications\n`, colors.bright + colors.cyan);
  
  if (autoFix) {
    log(`⚡ Auto-fix mode enabled - will automatically fix issues`, colors.yellow);
  } else {
    log(`👀 Running in scan mode - add --auto-fix to fix issues`, colors.blue);
  }

  try {
    // Find all active subscriptions with payments that used coupons
    const subscriptionsWithCoupons = await prisma.userSubscription.findMany({
      where: {
        status: "ACTIVE",
        payment: {
          couponCode: {
            not: null,
          },
        },
      },
      include: {
        user: {
          include: {
            country: true,
          },
        },
        payment: {
          include: {
            coupon: true,
          },
        },
        plan: true,
        couponApplications: {
          include: {
            coupon: true,
          },
        },
      },
    });

    log(`\nFound ${subscriptionsWithCoupons.length} active subscriptions that used coupons`, colors.cyan);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptionsWithCoupons) {
      console.log("\n" + "=".repeat(60));
      log(`\nUser: ${subscription.user.email}`, colors.bright);
      log(`Subscription ID: ${subscription.id}`, colors.cyan);
      log(`Plan: ${subscription.plan.name}`, colors.cyan);
      log(`Country: ${subscription.user.country?.name || "Unknown"}`, colors.cyan);
      log(`Auto-renew: ${subscription.autoRenew}`, colors.cyan);
      
      if (!subscription.payment.couponCode) {
        log(`⚠️  No coupon used (should not happen)`, colors.yellow);
        continue;
      }

      log(`\nPayment details:`, colors.bright);
      log(`  Coupon used: ${subscription.payment.couponCode}`, colors.cyan);
      log(`  Original amount: ₩${subscription.payment.originalAmount?.toLocaleString() || "Unknown"}`, colors.cyan);
      log(`  Discount: ₩${subscription.payment.discountAmount?.toLocaleString() || "Unknown"}`, colors.cyan);
      log(`  Paid: ₩${subscription.payment.amount.toLocaleString()}`, colors.cyan);

      // Check if CouponApplication exists
      const hasCouponApp = subscription.couponApplications.length > 0;
      
      if (hasCouponApp) {
        log(`\n✅ CouponApplication exists:`, colors.green);
        for (const app of subscription.couponApplications) {
          log(`  - ${app.coupon.code}: Active=${app.isActive}, Remaining=${app.remainingMonths}`, colors.cyan);
        }
        skippedCount++;
        continue;
      }

      log(`\n❌ No CouponApplication found!`, colors.red);

      // Check if we have the coupon in database
      const coupon = subscription.payment.coupon;
      
      if (!coupon) {
        log(`❌ Coupon "${subscription.payment.couponCode}" not found in database!`, colors.red);
        errorCount++;
        continue;
      }

      log(`\n📋 Coupon details:`, colors.bright);
      log(`  Code: ${coupon.code}`, colors.cyan);
      log(`  Type: ${coupon.recurringType}`, colors.cyan);
      log(`  Discount: ${coupon.discount}% + ₩${coupon.flatDiscount}`, colors.cyan);
      log(`  Duration: ${coupon.recurringMonths || "Unlimited"} months`, colors.cyan);

      // Only create CouponApplication for RECURRING coupons on auto-renew subscriptions
      if (coupon.recurringType !== CouponRecurringType.RECURRING) {
        log(`\n⚠️  Skipping: Coupon is ${coupon.recurringType} type (not RECURRING)`, colors.yellow);
        skippedCount++;
        continue;
      }

      if (!subscription.autoRenew) {
        log(`\n⚠️  Skipping: Subscription does not have auto-renewal enabled`, colors.yellow);
        skippedCount++;
        continue;
      }

      // Calculate how many months have passed
      const monthsPassed = Math.floor(
        (new Date().getTime() - subscription.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
      );
      
      const remainingMonths = coupon.recurringMonths 
        ? Math.max(0, coupon.recurringMonths - monthsPassed - 1) // -1 for initial payment
        : null;

      log(`\n📊 Calculated values:`, colors.bright);
      log(`  Months passed: ${monthsPassed}`, colors.cyan);
      log(`  Applied count: ${monthsPassed + 1} (including initial)`, colors.cyan);
      log(`  Remaining months: ${remainingMonths === null ? "Unlimited" : remainingMonths}`, colors.cyan);

      if (autoFix) {
        try {
          const couponApp = await prisma.couponApplication.create({
            data: {
              subscriptionId: subscription.id,
              couponId: coupon.id,
              isActive: remainingMonths === null || remainingMonths > 0,
              appliedCount: monthsPassed + 1,
              remainingMonths: remainingMonths,
              discountPercentage: coupon.discount > 0 ? coupon.discount : null,
              flatDiscountKRW: coupon.flatDiscount > 0 ? coupon.flatDiscount : null,
              flatDiscountUSD: coupon.flatDiscountUSD && coupon.flatDiscountUSD > 0 ? coupon.flatDiscountUSD : null,
            },
          });

          log(`\n✅ Fixed! Created CouponApplication`, colors.green);
          log(`  ID: ${couponApp.id}`, colors.cyan);
          log(`  Active: ${couponApp.isActive}`, colors.cyan);
          fixedCount++;
        } catch (error: any) {
          log(`\n❌ Failed to create CouponApplication: ${error.message}`, colors.red);
          errorCount++;
        }
      } else {
        log(`\n💡 Would create CouponApplication (run with --auto-fix to apply)`, colors.yellow);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    log(`\n📊 Summary:`, colors.bright + colors.cyan);
    log(`Total subscriptions scanned: ${subscriptionsWithCoupons.length}`, colors.cyan);
    log(`Already have CouponApplication: ${skippedCount}`, colors.green);
    
    if (autoFix) {
      log(`Fixed: ${fixedCount}`, colors.green);
      log(`Errors: ${errorCount}`, errorCount > 0 ? colors.red : colors.cyan);
    } else {
      const needsFix = subscriptionsWithCoupons.length - skippedCount - errorCount;
      log(`Need fixing: ${needsFix}`, needsFix > 0 ? colors.yellow : colors.green);
      if (needsFix > 0) {
        log(`\nRun with --auto-fix to fix these issues:`, colors.yellow);
        log(`npx tsx scripts/fix-all-missing-coupons.ts --auto-fix`, colors.cyan);
      }
    }

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();