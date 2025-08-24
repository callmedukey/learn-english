#!/usr/bin/env tsx
/**
 * Script to check coupon configuration
 * Useful for debugging why CouponApplications might not be created
 * 
 * Run with: npx tsx scripts/check-coupon-config.ts [coupon-code]
 */

import { prisma } from "../prisma/prisma-client";

const couponCode = process.argv[2] || "SAVE2";

async function main() {
  console.log(`\n🔍 Checking configuration for coupon: ${couponCode}\n`);

  try {
    const coupon = await prisma.discountCoupon.findUnique({
      where: { code: couponCode },
      include: {
        payments: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
          },
        },
        couponApplications: {
          take: 5,
          include: {
            subscription: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!coupon) {
      console.error(`❌ Coupon not found: ${couponCode}`);
      return;
    }

    console.log("📋 Coupon Details:");
    console.log(`  ID: ${coupon.id}`);
    console.log(`  Code: ${coupon.code}`);
    console.log(`  Active: ${coupon.active ? "✓ Yes" : "✗ No"}`);
    console.log(`  Type: ${coupon.recurringType}`);
    console.log(`  One-time use: ${coupon.oneTimeUse ? "Yes" : "No"}`);
    console.log(`  Discount: ${coupon.discount}%`);
    console.log(`  Flat discount: ₩${coupon.flatDiscount.toLocaleString()}`);
    console.log(`  Recurring months: ${coupon.recurringMonths || "Unlimited"}`);
    console.log(`  Max recurring uses: ${coupon.maxRecurringUses || "Unlimited"}`);
    
    if (coupon.deadline) {
      console.log(`  Expires: ${coupon.deadline.toLocaleDateString()}`);
    }

    console.log(`\n💳 Recent Payments (last 5):`);
    if (coupon.payments.length === 0) {
      console.log("  No payments found");
    } else {
      for (const payment of coupon.payments) {
        console.log(`  - ${payment.createdAt.toLocaleDateString()} | ${payment.user.email} | ₩${payment.amount.toLocaleString()} | Status: ${payment.status}`);
      }
    }

    console.log(`\n📊 Coupon Applications (last 5):`);
    if (coupon.couponApplications.length === 0) {
      console.log("  No applications found");
    } else {
      for (const app of coupon.couponApplications) {
        console.log(`  - ${app.subscription.user.email} | Active: ${app.isActive} | Remaining: ${app.remainingMonths || "∞"} | Applied: ${app.appliedCount}x`);
      }
    }

    // Check for issues
    console.log("\n🔍 Potential Issues:");
    let issueCount = 0;

    if (!coupon.active) {
      console.log("  ⚠️  Coupon is not active");
      issueCount++;
    }

    if (coupon.recurringType !== "RECURRING") {
      console.log(`  ⚠️  Coupon type is ${coupon.recurringType}, not RECURRING - won't create CouponApplication`);
      issueCount++;
    }

    if (coupon.oneTimeUse) {
      console.log("  ⚠️  Coupon is marked as one-time use");
      issueCount++;
    }

    // Check for payments without applications
    const recentPaymentsWithCoupon = await prisma.payment.findMany({
      where: {
        couponCode: couponCode,
        status: "PAID",
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        user: true,
        subscription: {
          include: {
            couponApplications: true,
          },
        },
      },
    });

    const paymentsWithoutApp = recentPaymentsWithCoupon.filter(
      p => p.subscription && p.subscription.couponApplications.length === 0
    );

    if (paymentsWithoutApp.length > 0) {
      console.log(`  ❌ ${paymentsWithoutApp.length} recent payments used this coupon but have no CouponApplication!`);
      for (const payment of paymentsWithoutApp) {
        console.log(`     - ${payment.user.email} | ${payment.createdAt.toLocaleDateString()} | Subscription: ${payment.subscription?.id}`);
      }
      issueCount++;
    }

    if (issueCount === 0) {
      console.log("  ✅ No issues found");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();