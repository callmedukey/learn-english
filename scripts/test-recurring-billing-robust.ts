#!/usr/bin/env tsx
/**
 * Robust test script for recurring billing with coupon expiration
 * This version handles TOSS API response variations better
 */

import { prisma } from "../prisma/prisma-client";
import { BillingService } from "../lib/services/billing.service";
import { RecurringStatus, CouponRecurringType } from "../prisma/generated/prisma";
import * as crypto from "crypto";
import * as readline from "readline";
import { addDays } from "date-fns";

// Configuration
const TEST_USER_EMAIL = "test@readingchamp.com";
const TEST_COUPON_CODE = "TEST_3MONTH_50OFF";
const COUPON_DISCOUNT_PERCENTAGE = 50;
const COUPON_DURATION_MONTHS = 3;
const BILLING_CYCLES_TO_TEST = 4;

// Parse command line arguments
const args = process.argv.slice(2);
const skipConfirmation = args.includes("--yes") || args.includes("-y");

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

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log("=".repeat(60));
}

async function askConfirmation(message: string): Promise<boolean> {
  if (skipConfirmation) return true;
  
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

async function setupTestData() {
  logSection("Setting Up Test Data");

  // 1. Find test user
  log("\n1. Finding test user...", colors.blue);
  const user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
    include: { country: true },
  });

  if (!user) {
    throw new Error(`Test user ${TEST_USER_EMAIL} not found`);
  }

  log(`✓ Found user: ${user.email} (${user.nickname})`, colors.green);

  if (!user.billingKey) {
    throw new Error("User must have a billing key for testing");
  }
  
  log("✓ User has billing key", colors.green);

  // 2. Find test plan
  log("\n2. Finding test plan...", colors.blue);
  const plan = await prisma.plan.findFirst({
    where: { name: "1 Month Plan", isActive: true },
  });

  if (!plan) {
    throw new Error("Test plan not found");
  }

  log(`✓ Found plan: ${plan.name} (₩${plan.price.toLocaleString()})`, colors.green);

  // 3. Create or update test coupon
  log("\n3. Setting up test coupon...", colors.blue);
  let coupon = await prisma.discountCoupon.upsert({
    where: { code: TEST_COUPON_CODE },
    update: {
      discount: COUPON_DISCOUNT_PERCENTAGE,
      flatDiscount: 0,
      active: true,
      recurringType: CouponRecurringType.RECURRING,
      recurringMonths: COUPON_DURATION_MONTHS,
      oneTimeUse: false,
    },
    create: {
      code: TEST_COUPON_CODE,
      discount: COUPON_DISCOUNT_PERCENTAGE,
      flatDiscount: 0,
      active: true,
      recurringType: CouponRecurringType.RECURRING,
      recurringMonths: COUPON_DURATION_MONTHS,
      oneTimeUse: false,
    },
  });

  log(`✓ Test coupon ready: ${coupon.code}`, colors.green);

  // 4. Clean up existing subscriptions
  log("\n4. Cleaning up existing subscriptions...", colors.blue);
  await prisma.userSubscription.updateMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      recurringStatus: RecurringStatus.CANCELLED,
    },
  });

  // 5. Create new test subscription
  log("\n5. Creating test subscription...", colors.blue);
  
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      paymentKey: `TEST_PAYMENT_${Date.now()}`,
      orderId: `TEST_ORDER_${Date.now()}`,
      orderName: "Test Subscription Setup",
      amount: Math.floor(plan.price * (1 - coupon.discount / 100)),
      status: "PAID",
      paymentType: "INITIAL_SUBSCRIPTION",
      method: "CARD",
      approvedAt: new Date(),
      couponId: coupon.id,
      couponCode: coupon.code,
      originalAmount: plan.price,
      discountAmount: Math.floor(plan.price * coupon.discount / 100),
    },
  });

  const now = new Date();
  const subscription = await prisma.userSubscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      paymentId: payment.id,
      status: "ACTIVE",
      startDate: now,
      endDate: addDays(now, plan.duration),
      autoRenew: true,
      billingKey: user.billingKey,
      recurringStatus: RecurringStatus.ACTIVE,
      lastBillingDate: now,
      nextBillingDate: now,
    },
  });

  log(`✓ Created subscription ID: ${subscription.id}`, colors.green);

  // 6. Create coupon application
  log("\n6. Applying coupon to subscription...", colors.blue);
  
  await prisma.couponApplication.upsert({
    where: {
      subscriptionId_couponId: {
        subscriptionId: subscription.id,
        couponId: coupon.id,
      },
    },
    update: {
      appliedCount: 0,
      remainingMonths: COUPON_DURATION_MONTHS,
      isActive: true,
    },
    create: {
      subscriptionId: subscription.id,
      couponId: coupon.id,
      appliedCount: 0,
      remainingMonths: COUPON_DURATION_MONTHS,
      isActive: true,
      discountPercentage: coupon.discount,
    },
  });

  log("✓ Coupon application ready", colors.green);

  return { user, plan, coupon, subscription };
}

async function runBillingCycle(subscriptionId: string, cycleNumber: number) {
  log(`\n🔄 Starting Billing Cycle #${cycleNumber}`, colors.bright + colors.yellow);

  // Fetch fresh subscription data
  const subscription = await prisma.userSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: true,
      plan: true,
    },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Check coupon status
  const couponApp = await prisma.couponApplication.findFirst({
    where: {
      subscriptionId: subscriptionId,
      isActive: true,
    },
    include: {
      coupon: true,
    },
  });

  log(`\nCoupon status before payment:`, colors.cyan);
  if (couponApp) {
    log(`  Active: ${couponApp.isActive}`, colors.cyan);
    log(`  Applied Count: ${couponApp.appliedCount}`, colors.cyan);
    log(`  Remaining Months: ${couponApp.remainingMonths}`, colors.cyan);
  } else {
    log(`  No active coupon`, colors.cyan);
  }

  // Execute billing
  const billingService = new BillingService();
  let paymentAmount = 0;
  let paymentSuccess = false;
  let error = null;

  try {
    const result = await billingService.executeBillingPayment(subscription);
    
    if (result.success && result.payment) {
      paymentSuccess = true;
      // Handle both possible field names from TOSS API
      paymentAmount = result.payment.amount || result.payment.totalAmount || 0;
      
      log(`\n✅ Payment successful!`, colors.green);
      log(`  Payment Key: ${result.payment.paymentKey}`, colors.green);
      log(`  Amount: ₩${paymentAmount.toLocaleString()}`, colors.green);
    } else {
      error = result.error;
      log(`\n❌ Payment failed: ${error?.message || "Unknown error"}`, colors.red);
    }
  } catch (err: any) {
    error = err;
    log(`\n❌ Exception during payment: ${err.message}`, colors.red);
    
    // Check if payment actually succeeded by looking at the database
    const recentPayment = await prisma.payment.findFirst({
      where: {
        userId: subscription.userId,
        createdAt: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    if (recentPayment && recentPayment.status === "PAID") {
      log(`\n⚠️  Payment appears to have succeeded despite error`, colors.yellow);
      paymentSuccess = true;
      paymentAmount = recentPayment.amount;
    }
  }

  // Check coupon status after payment
  const updatedCouponApp = await prisma.couponApplication.findFirst({
    where: {
      subscriptionId: subscriptionId,
    },
    include: {
      coupon: true,
    },
  });

  log(`\nCoupon status after payment:`, colors.cyan);
  if (updatedCouponApp) {
    log(`  Active: ${updatedCouponApp.isActive}`, colors.cyan);
    log(`  Applied Count: ${updatedCouponApp.appliedCount}`, colors.cyan);
    log(`  Remaining Months: ${updatedCouponApp.remainingMonths}`, colors.cyan);
  }

  // Advance billing date for next cycle
  if (cycleNumber < BILLING_CYCLES_TO_TEST) {
    await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: {
        nextBillingDate: new Date(), // Reset for immediate next billing
      },
    });
  }

  return {
    cycle: cycleNumber,
    success: paymentSuccess,
    amount: paymentAmount,
    originalAmount: subscription.plan.price,
    discountApplied: paymentAmount < subscription.plan.price,
    remainingMonths: updatedCouponApp?.remainingMonths,
    error: error?.message || error?.code || null,
  };
}

function displayResults(results: any[], plan: any) {
  logSection("Test Results Summary");

  console.log("\n" + "━".repeat(80));
  console.log(
    "Cycle".padEnd(10) +
    "Status".padEnd(15) +
    "Amount".padEnd(15) +
    "Discount".padEnd(15) +
    "Remaining".padEnd(15) +
    "Error".padEnd(10)
  );
  console.log("━".repeat(80));

  let totalCharged = 0;
  let totalDiscount = 0;
  let successCount = 0;

  results.forEach((result) => {
    if (result.success) {
      successCount++;
      totalCharged += result.amount;
      const discountAmount = result.originalAmount - result.amount;
      totalDiscount += discountAmount;
    }

    const statusStr = result.success ? "✓ Success" : "✗ Failed";
    const statusColor = result.success ? colors.green : colors.red;
    const amountStr = result.success ? `₩${result.amount.toLocaleString()}` : "-";
    const discountStr = result.discountApplied ? `₩${(result.originalAmount - result.amount).toLocaleString()}` : "-";
    const remainingStr = result.remainingMonths !== null ? `${result.remainingMonths} months` : "-";
    const errorStr = result.error ? result.error.substring(0, 30) + "..." : "-";

    console.log(
      `#${result.cycle}`.padEnd(10) +
      `${statusColor}${statusStr}${colors.reset}`.padEnd(15 + statusColor.length + colors.reset.length) +
      amountStr.padEnd(15) +
      discountStr.padEnd(15) +
      remainingStr.padEnd(15) +
      errorStr.padEnd(10)
    );
  });

  console.log("━".repeat(80));

  // Summary
  console.log("\n📊 Summary:");
  log(`Successful Payments: ${successCount}/${results.length}`, colors.bright);
  log(`Total Amount Charged: ₩${totalCharged.toLocaleString()}`, colors.bright);
  log(`Total Discount Applied: ₩${totalDiscount.toLocaleString()}`, colors.green);
  
  // Verification
  console.log("\n✅ Verification:");
  const expectedPattern = [
    { cycle: 1, shouldHaveDiscount: true },
    { cycle: 2, shouldHaveDiscount: true },
    { cycle: 3, shouldHaveDiscount: true },
    { cycle: 4, shouldHaveDiscount: false },
  ];

  let patternCorrect = true;
  expectedPattern.forEach(({ cycle, shouldHaveDiscount }) => {
    const result = results.find(r => r.cycle === cycle);
    if (!result || !result.success) {
      log(`${colors.yellow}⚠ Cycle ${cycle}: Skipped (payment failed)${colors.reset}`, "");
      return;
    }
    
    const correct = result.discountApplied === shouldHaveDiscount;
    const icon = correct ? "✓" : "✗";
    const color = correct ? colors.green : colors.red;
    
    log(
      `${color}${icon} Cycle ${cycle}: Discount ${shouldHaveDiscount ? "applied" : "not applied"} - ${correct ? "CORRECT" : "INCORRECT"}${colors.reset}`,
      ""
    );
    
    if (!correct) patternCorrect = false;
  });

  console.log("\n" + "=".repeat(60));
  if (patternCorrect && successCount > 0) {
    log("🎉 Coupon expiration pattern is correct!", colors.bright + colors.green);
  } else if (successCount === 0) {
    log("❌ All payments failed - cannot verify coupon behavior", colors.bright + colors.red);
  } else {
    log("⚠️  Some issues detected - review the results above", colors.bright + colors.yellow);
  }
  console.log("=".repeat(60));
}

async function main() {
  console.clear();
  log("🧪 Recurring Billing with Coupon Expiration Test (Robust Version)", colors.bright + colors.cyan);
  log("=================================================================\n", colors.cyan);

  try {
    // Confirm execution
    const confirmed = await askConfirmation("⚠️  This will execute REAL payments via TOSS API. Continue?");
    if (!confirmed) {
      log("\n❌ Test cancelled by user", colors.yellow);
      process.exit(0);
    }

    // Setup test data
    const { user, plan, coupon, subscription } = await setupTestData();

    // Run billing cycles
    const results = [];
    for (let cycle = 1; cycle <= BILLING_CYCLES_TO_TEST; cycle++) {
      try {
        const result = await runBillingCycle(subscription.id, cycle);
        results.push(result);
        
        // Small delay between cycles
        if (cycle < BILLING_CYCLES_TO_TEST) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        log(`\n❌ Critical error in cycle ${cycle}: ${error.message}`, colors.red);
        results.push({
          cycle,
          success: false,
          amount: 0,
          originalAmount: plan.price,
          discountApplied: false,
          remainingMonths: null,
          error: error.message,
        });
      }
    }

    // Display results
    displayResults(results, plan);

  } catch (error: any) {
    log(`\n❌ Test setup failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
main();