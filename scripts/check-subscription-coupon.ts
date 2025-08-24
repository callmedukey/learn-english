#!/usr/bin/env tsx
/**
 * Diagnostic script to check subscription and coupon status
 * This helps identify why coupons might not be applying during billing
 * 
 * Run with: npx tsx scripts/check-subscription-coupon.ts [email]
 * Example: npx tsx scripts/check-subscription-coupon.ts test@readingchamp.com
 */

import { prisma } from "../prisma/prisma-client";
import { RecurringStatus } from "../prisma/generated/prisma";

const userEmail = process.argv[2] || "test@readingchamp.com";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  console.clear();
  log(`\n🔍 Checking Subscription & Coupon Status for: ${userEmail}\n`, colors.bright + colors.cyan);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { country: true },
    });

    if (!user) {
      log(`❌ User not found: ${userEmail}`, colors.red);
      process.exit(1);
    }

    log(`✓ User found:`, colors.green);
    log(`  ID: ${user.id}`, colors.cyan);
    log(`  Name: ${user.nickname || user.name || "N/A"}`, colors.cyan);
    log(`  Country: ${user.country?.name || "Not set"}`, colors.cyan);
    log(`  Has billing key: ${!!user.billingKey}`, colors.cyan);

    // Find active subscriptions
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        plan: true,
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (subscriptions.length === 0) {
      log(`\n⚠️  No active subscriptions found`, colors.yellow);
      process.exit(0);
    }

    log(`\n📋 Active Subscriptions: ${subscriptions.length}`, colors.bright);

    for (const subscription of subscriptions) {
      console.log("\n" + "=".repeat(60));
      log(`Subscription ID: ${subscription.id}`, colors.bright);
      log(`Plan: ${subscription.plan.name}`, colors.cyan);
      log(`Price: ₩${subscription.plan.price.toLocaleString()}`, colors.cyan);
      log(`Status: ${subscription.status}`, colors.cyan);
      log(`Auto-renew: ${subscription.autoRenew}`, colors.cyan);
      log(`Recurring Status: ${subscription.recurringStatus}`, colors.cyan);
      log(`Start Date: ${subscription.startDate.toLocaleDateString()}`, colors.cyan);
      log(`End Date: ${subscription.endDate.toLocaleDateString()}`, colors.cyan);
      
      if (subscription.nextBillingDate) {
        log(`Next Billing: ${subscription.nextBillingDate.toLocaleDateString()}`, colors.cyan);
      }

      // Check original payment
      if (subscription.payment) {
        log(`\n💳 Original Payment:`, colors.bright);
        log(`  Amount: ₩${subscription.payment.amount.toLocaleString()}`, colors.cyan);
        log(`  Coupon Used: ${subscription.payment.couponCode || "None"}`, colors.cyan);
        if (subscription.payment.discountAmount) {
          log(`  Discount: ₩${subscription.payment.discountAmount.toLocaleString()}`, colors.green);
        }
      }

      // Check coupon applications
      const couponApps = await prisma.couponApplication.findMany({
        where: {
          subscriptionId: subscription.id,
        },
        include: {
          coupon: true,
        },
      });

      if (couponApps.length === 0) {
        log(`\n❌ No coupon applications found for this subscription`, colors.red);
        log(`   This is why no discount is being applied!`, colors.yellow);
      } else {
        log(`\n🎟️  Coupon Applications: ${couponApps.length}`, colors.bright);
        
        for (const app of couponApps) {
          console.log("\n  " + "-".repeat(40));
          log(`  Coupon Code: ${app.coupon.code}`, colors.cyan);
          log(`  Coupon Type: ${app.coupon.recurringType}`, colors.cyan);
          log(`  Discount: ${app.coupon.discount}%`, colors.cyan);
          if (app.coupon.flatDiscount > 0) {
            log(`  Flat Discount: ₩${app.coupon.flatDiscount.toLocaleString()}`, colors.cyan);
          }
          log(`  Is Active: ${app.isActive}`, app.isActive ? colors.green : colors.red);
          log(`  Applied Count: ${app.appliedCount}`, colors.cyan);
          log(`  Remaining Months: ${app.remainingMonths ?? "Unlimited"}`, colors.cyan);
          
          // Calculate expected discount
          if (app.isActive && (app.remainingMonths === null || app.remainingMonths > 0)) {
            const discountAmount = app.coupon.discount > 0
              ? Math.floor((subscription.plan.price * app.coupon.discount) / 100)
              : Math.min(app.coupon.flatDiscount, subscription.plan.price);
            const expectedAmount = subscription.plan.price - discountAmount;
            
            log(`\n  💰 Expected next payment:`, colors.bright);
            log(`     Original: ₩${subscription.plan.price.toLocaleString()}`, colors.cyan);
            log(`     Discount: ₩${discountAmount.toLocaleString()}`, colors.green);
            log(`     Total: ₩${expectedAmount.toLocaleString()}`, colors.bright + colors.green);
          } else {
            log(`\n  ⚠️  This coupon will NOT be applied:`, colors.yellow);
            if (!app.isActive) {
              log(`     Reason: Coupon is not active`, colors.yellow);
            } else if (app.remainingMonths === 0) {
              log(`     Reason: No remaining months`, colors.yellow);
            }
          }
        }
      }

      // Check for recent billing history
      const recentBilling = await prisma.billingHistory.findMany({
        where: {
          subscriptionId: subscription.id,
        },
        orderBy: {
          processedAt: "desc",
        },
        take: 3,
      });

      if (recentBilling.length > 0) {
        log(`\n📊 Recent Billing History:`, colors.bright);
        for (const billing of recentBilling) {
          log(`  ${billing.processedAt.toLocaleDateString()} - ₩${billing.amount.toLocaleString()} - ${billing.status}`, 
            billing.status === "SUCCESS" ? colors.green : colors.red);
        }
      }
    }

    // Summary and recommendations
    console.log("\n" + "=".repeat(60));
    log(`📌 Summary & Recommendations:`, colors.bright + colors.yellow);
    
    const hasActiveCoupons = subscriptions.some(sub => 
      sub.id && prisma.couponApplication.findFirst({
        where: {
          subscriptionId: sub.id,
          isActive: true,
          OR: [
            { remainingMonths: null },
            { remainingMonths: { gt: 0 } }
          ]
        }
      })
    );

    if (!hasActiveCoupons) {
      log(`\n⚠️  No active coupons found for any subscription!`, colors.red);
      log(`   To apply a coupon, run:`, colors.yellow);
      log(`   npx tsx scripts/apply-test-coupon.ts ${userEmail}`, colors.cyan);
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