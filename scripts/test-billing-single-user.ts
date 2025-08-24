#!/usr/bin/env tsx
/**
 * Test script to run billing for a single user
 * This is useful for testing the actual billing job with a specific user
 *
 * Run with: npx tsx scripts/test-billing-single-user.ts [email]
 * Example: npx tsx scripts/test-billing-single-user.ts test@readingchamp.com
 */

import { BillingService } from "../lib/services/billing.service";
import { RecurringStatus } from "../prisma/generated/prisma";
import { prisma } from "../prisma/prisma-client";

const userEmail = process.argv[2] || "test@readingchamp.com";

async function main() {
  console.log(`\n🧪 Testing billing for user: ${userEmail}\n`);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { country: true },
    });

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.email} (${user.nickname})`);
    console.log(`  Country: ${user.country?.name || "Not set"}`);
    console.log(`  Has billing key: ${!!user.billingKey}`);

    if (!user.billingKey) {
      console.error("\n❌ User does not have a billing key set up");
      process.exit(1);
    }

    // Find active subscription due for billing
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        recurringStatus: RecurringStatus.ACTIVE,
        autoRenew: true,
        status: "ACTIVE",
      },
      include: {
        user: true,
        plan: true,
      },
      orderBy: {
        nextBillingDate: "asc",
      },
    });

    if (!subscription) {
      console.log("\n⚠️  No active subscription found for this user");
      process.exit(0);
    }

    console.log(`\n✓ Found subscription:`);
    console.log(`  ID: ${subscription.id}`);
    console.log(`  Plan: ${subscription.plan.name}`);
    console.log(`  Price: ₩${subscription.plan.price.toLocaleString()}`);
    console.log(
      `  Next billing date: ${subscription.nextBillingDate?.toLocaleDateString() || "Not set"}`,
    );

    // Check for active coupons
    const couponApp = await prisma.couponApplication.findFirst({
      where: {
        subscriptionId: subscription.id,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    let expectedAmount = subscription.plan.price;
    
    if (couponApp) {
      console.log(`\n📋 Active coupon:`);
      console.log(`  Code: ${couponApp.coupon.code}`);
      console.log(`  Discount: ${couponApp.coupon.discount}%`);
      console.log(
        `  Remaining months: ${couponApp.remainingMonths || "Unlimited"}`,
      );
      
      // Calculate expected payment
      if (couponApp.isActive && (couponApp.remainingMonths === null || couponApp.remainingMonths > 0)) {
        const discountAmount = couponApp.coupon.discount > 0
          ? Math.floor((subscription.plan.price * couponApp.coupon.discount) / 100)
          : Math.min(couponApp.coupon.flatDiscount, subscription.plan.price);
        expectedAmount = subscription.plan.price - discountAmount;
        
        console.log(`\n💰 Expected payment:`);
        console.log(`  Original: ₩${subscription.plan.price.toLocaleString()}`);
        console.log(`  Discount: ₩${discountAmount.toLocaleString()}`);
        console.log(`  Expected: ₩${expectedAmount.toLocaleString()}`);
      } else {
        console.log(`\n⚠️  Coupon will NOT be applied (inactive or expired)`);
      }
    } else {
      console.log(`\n⚠️  No active coupon found`);
    }

    // Ask for confirmation
    console.log("\n⚠️  This will execute a REAL payment via TOSS API!");
    console.log("Press Ctrl+C to cancel, or any key to continue...");

    await new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once("data", resolve);
    });

    console.log("\n🔄 Executing billing...");

    const billingService = new BillingService();
    const result = await billingService.executeBillingPayment(subscription);

    if (result.success) {
      console.log("\n✅ Payment successful!");
      console.log(`  Payment key: ${result.payment.paymentKey}`);
      const amount = result.payment.amount || result.payment.totalAmount;
      console.log(`  Amount: ₩${amount.toLocaleString()}`);
      console.log(`  Method: ${result.payment.method}`);
      
      // Verify if amount matches expectation
      if (amount === expectedAmount) {
        console.log(`\n✅ Amount matches expected value!`);
      } else {
        console.log(`\n⚠️  Amount mismatch!`);
        console.log(`  Expected: ₩${expectedAmount.toLocaleString()}`);
        console.log(`  Actual: ₩${amount.toLocaleString()}`);
        console.log(`  Difference: ₩${Math.abs(amount - expectedAmount).toLocaleString()}`);
      }
    } else {
      console.error("\n❌ Payment failed!");
      console.error(`  Error: ${result.error?.message || "Unknown error"}`);
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
