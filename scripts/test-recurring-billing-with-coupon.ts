#!/usr/bin/env tsx
/**
 * Test script for recurring billing with coupon expiration
 * 
 * This script tests the scenario where a coupon discount is applied for 3 months,
 * and the 4th payment should revert to the original price.
 * 
 * Run with: npx tsx scripts/test-recurring-billing-with-coupon.ts
 * Dry run: npx tsx scripts/test-recurring-billing-with-coupon.ts --dry-run
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
const isDryRun = args.includes("--dry-run");
const skipConfirmation = args.includes("--yes") || args.includes("-y");
const useMockToss = args.includes("--mock-toss") || isDryRun;

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

function logPaymentResult(cycleNumber: number, amount: number, discountApplied: boolean, remainingMonths: number | null) {
  console.log("\n" + "-".repeat(50));
  log(`Payment Cycle #${cycleNumber}`, colors.bright);
  log(`Amount Charged: ₩${amount.toLocaleString()}`, discountApplied ? colors.green : colors.yellow);
  log(`Discount Applied: ${discountApplied ? "YES" : "NO"}`, discountApplied ? colors.green : colors.yellow);
  if (discountApplied && remainingMonths !== null) {
    log(`Remaining Discount Months: ${remainingMonths}`, colors.blue);
  }
  console.log("-".repeat(50));
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

// Mock billing service for dry-run
class MockBillingService extends BillingService {
  async executeBillingPayment(subscription: any): Promise<any> {
    log("\n[MOCK] Simulating TOSS payment API call...", colors.magenta);
    
    // Simulate the same logic as the real service
    const activeCouponApplications = await prisma.couponApplication.findMany({
      where: {
        subscriptionId: subscription.id,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    let finalAmount = subscription.plan.price;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (activeCouponApplications.length > 0) {
      const couponApp = activeCouponApplications[0];
      const { coupon } = couponApp;

      if (couponApp.remainingMonths === null || couponApp.remainingMonths > 0) {
        if (coupon.discount > 0) {
          discountAmount = Math.floor((subscription.plan.price * coupon.discount) / 100);
        }
        finalAmount = Math.max(0, subscription.plan.price - discountAmount);
        appliedCoupon = couponApp;
      }
    }

    log(`[MOCK] Original amount: ₩${subscription.plan.price.toLocaleString()}`, colors.magenta);
    log(`[MOCK] Discount amount: ₩${discountAmount.toLocaleString()}`, colors.magenta);
    log(`[MOCK] Final amount: ₩${finalAmount.toLocaleString()}`, colors.magenta);
    
    // Simulate successful payment
    const mockPaymentResult = {
      paymentKey: `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      orderId: `ORDER_${Date.now()}`,
      orderName: `${subscription.plan.name} - Mock Payment`,
      amount: finalAmount,
      method: "CARD",
      approvedAt: new Date().toISOString(),
    };

    // Call the parent's handlePaymentSuccess to update records
    // @ts-ignore - accessing private method for testing
    await this.handlePaymentSuccess(subscription, mockPaymentResult, appliedCoupon, discountAmount);

    return { success: true, payment: mockPaymentResult };
  }
}

async function setupTestData() {
  logSection("Setting Up Test Data");

  // 1. Find or create test user
  log("\n1. Finding test user...", colors.blue);
  let user = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL },
    include: { country: true },
  });

  if (!user) {
    log("User not found. Please create test@readingchamp.com user first.", colors.red);
    throw new Error("Test user not found");
  }

  log(`✓ Found user: ${user.email} (${user.nickname})`, colors.green);

  // 2. Check if user has billing key
  if (!user.billingKey) {
    log("\n⚠️  User does not have a billing key set up.", colors.yellow);
    
    if (isDryRun || useMockToss) {
      // Create a mock billing key for testing
      const mockBillingKey = crypto.randomBytes(16).toString("hex");
      const encryptedKey = encryptBillingKey(mockBillingKey);
      
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          billingKey: encryptedKey,
          billingKeyIssuedAt: new Date(),
          billingMethod: "CARD",
          cardInfo: {
            last4: "1234",
            issuer: "TEST_BANK",
            cardType: "CREDIT",
          },
        },
        include: { country: true },
      });
      
      log("✓ Created mock billing key for testing", colors.green);
    } else {
      throw new Error("User must have a billing key for real API testing");
    }
  } else {
    log("✓ User has billing key", colors.green);
  }

  // 3. Find or create test plan
  log("\n2. Finding test plan...", colors.blue);
  let plan = await prisma.plan.findFirst({
    where: { name: "1 Month Plan", isActive: true },
  });

  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: "1 Month Plan",
        price: 10000, // ₩10,000 for easy calculation
        priceUSD: 10,
        duration: 30,
        description: "Test plan for billing",
        isActive: true,
        sortOrder: 1,
      },
    });
    log("✓ Created test plan", colors.green);
  } else {
    log(`✓ Found plan: ${plan.name} (₩${plan.price.toLocaleString()})`, colors.green);
  }

  // 4. Create or update test coupon
  log("\n3. Setting up test coupon...", colors.blue);
  let coupon = await prisma.discountCoupon.findUnique({
    where: { code: TEST_COUPON_CODE },
  });

  if (coupon) {
    // Update existing coupon to ensure correct settings
    coupon = await prisma.discountCoupon.update({
      where: { id: coupon.id },
      data: {
        discount: COUPON_DISCOUNT_PERCENTAGE,
        flatDiscount: 0,
        active: true,
        recurringType: CouponRecurringType.RECURRING,
        recurringMonths: COUPON_DURATION_MONTHS,
        oneTimeUse: false,
      },
    });
    log("✓ Updated existing test coupon", colors.green);
  } else {
    coupon = await prisma.discountCoupon.create({
      data: {
        code: TEST_COUPON_CODE,
        discount: COUPON_DISCOUNT_PERCENTAGE,
        flatDiscount: 0,
        active: true,
        recurringType: CouponRecurringType.RECURRING,
        recurringMonths: COUPON_DURATION_MONTHS,
        oneTimeUse: false,
      },
    });
    log("✓ Created test coupon", colors.green);
  }

  log(`  Code: ${coupon.code}`, colors.cyan);
  log(`  Discount: ${coupon.discount}%`, colors.cyan);
  log(`  Duration: ${coupon.recurringMonths} months`, colors.cyan);

  // 5. Clean up existing test subscription if any
  log("\n4. Cleaning up existing subscriptions...", colors.blue);
  const existingSubscriptions = await prisma.userSubscription.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
    },
  });

  for (const sub of existingSubscriptions) {
    await prisma.userSubscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        recurringStatus: RecurringStatus.CANCELLED,
      },
    });
  }
  log(`✓ Cleaned up ${existingSubscriptions.length} existing subscriptions`, colors.green);

  // 6. Create new test subscription
  log("\n5. Creating test subscription...", colors.blue);
  
  // First create a payment record
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
      nextBillingDate: now, // Set to now so it's immediately due for billing
    },
  });

  log(`✓ Created subscription ID: ${subscription.id}`, colors.green);

  // 7. Create coupon application
  log("\n6. Applying coupon to subscription...", colors.blue);
  
  // Check if application already exists
  const existingApplication = await prisma.couponApplication.findUnique({
    where: {
      subscriptionId_couponId: {
        subscriptionId: subscription.id,
        couponId: coupon.id,
      },
    },
  });

  if (existingApplication) {
    await prisma.couponApplication.update({
      where: { id: existingApplication.id },
      data: {
        appliedCount: 0,
        remainingMonths: COUPON_DURATION_MONTHS,
        isActive: true,
      },
    });
    log("✓ Updated existing coupon application", colors.green);
  } else {
    await prisma.couponApplication.create({
      data: {
        subscriptionId: subscription.id,
        couponId: coupon.id,
        appliedCount: 0,
        remainingMonths: COUPON_DURATION_MONTHS,
        isActive: true,
        discountPercentage: coupon.discount,
      },
    });
    log("✓ Created coupon application", colors.green);
  }

  return { user, plan, coupon, subscription };
}

// Helper function to encrypt billing key (matching the service implementation)
function encryptBillingKey(text: string): string {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(process.env.BILLING_KEY_ENCRYPTION_KEY || "0000000000000000000000000000000000000000000000000000000000000000", "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

async function runBillingCycles(subscription: any) {
  logSection("Running Billing Cycles");

  const billingService = useMockToss ? new MockBillingService() : new BillingService();
  const results = [];

  for (let cycle = 1; cycle <= BILLING_CYCLES_TO_TEST; cycle++) {
    log(`\n🔄 Starting Billing Cycle #${cycle}`, colors.bright + colors.yellow);

    // Fetch fresh subscription data with all relations
    const currentSubscription = await prisma.userSubscription.findUnique({
      where: { id: subscription.id },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!currentSubscription) {
      throw new Error("Subscription not found");
    }

    // Check current coupon application status
    const couponApp = await prisma.couponApplication.findFirst({
      where: {
        subscriptionId: subscription.id,
        couponId: subscription.couponId,
      },
      include: {
        coupon: true,
      },
    });

    log(`\nPre-payment coupon status:`, colors.cyan);
    if (couponApp) {
      log(`  Active: ${couponApp.isActive}`, colors.cyan);
      log(`  Applied Count: ${couponApp.appliedCount}`, colors.cyan);
      log(`  Remaining Months: ${couponApp.remainingMonths}`, colors.cyan);
    }

    try {
      // Execute billing
      const result = await billingService.executeBillingPayment(currentSubscription);
      
      console.log(`DEBUG: Result structure:`, {
        success: result.success,
        hasPayment: !!result.payment,
        paymentKeys: result.payment ? Object.keys(result.payment).slice(0, 10) : [],
        amount: result.payment?.amount,
        totalAmount: result.payment?.totalAmount,
      });

      if (result.success && result.payment) {
        const payment = result.payment;
        const paymentAmount = payment.amount || payment.totalAmount || 0;
        const discountApplied = paymentAmount < currentSubscription.plan.price;
        
        // Fetch updated coupon application
        const updatedCouponApp = await prisma.couponApplication.findFirst({
          where: {
            subscriptionId: subscription.id,
          },
        });

        results.push({
          cycle,
          amount: paymentAmount,
          originalAmount: currentSubscription.plan.price,
          discountApplied,
          remainingMonths: updatedCouponApp?.remainingMonths,
          success: true,
        });

        logPaymentResult(
          cycle,
          paymentAmount,
          discountApplied,
          updatedCouponApp?.remainingMonths || null
        );

        // If not the last cycle, advance the billing date for next test
        if (cycle < BILLING_CYCLES_TO_TEST) {
          const nextBillingDate = addDays(new Date(), 30);
          await prisma.userSubscription.update({
            where: { id: subscription.id },
            data: {
              nextBillingDate: new Date(), // Reset to now for immediate next billing
            },
          });
          log(`\n⏰ Advanced billing date for next cycle`, colors.blue);
        }
      } else {
        log(`\n❌ Payment failed: ${result.error?.message}`, colors.red);
        results.push({
          cycle,
          amount: 0,
          originalAmount: currentSubscription.plan.price,
          discountApplied: false,
          remainingMonths: null,
          success: false,
          error: result.error,
        });
      }
    } catch (error: any) {
      log(`\n❌ Error in cycle ${cycle}: ${error.message}`, colors.red);
      results.push({
        cycle,
        amount: 0,
        originalAmount: currentSubscription.plan.price,
        discountApplied: false,
        remainingMonths: null,
        success: false,
        error: error.message,
      });
    }

    // Small delay between cycles
    if (cycle < BILLING_CYCLES_TO_TEST) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

function displaySummary(results: any[], plan: any) {
  logSection("Test Summary");

  console.log("\n" + "━".repeat(70));
  console.log(
    "Cycle".padEnd(10) +
    "Amount".padEnd(15) +
    "Discount".padEnd(15) +
    "Remaining".padEnd(15) +
    "Status".padEnd(15)
  );
  console.log("━".repeat(70));

  let totalCharged = 0;
  let totalDiscount = 0;

  results.forEach((result) => {
    if (!result.success || result.amount === undefined || result.amount === null) {
      // Skip failed results in calculation
      return;
    }
    
    const discountAmount = result.originalAmount - result.amount;
    totalCharged += result.amount;
    totalDiscount += discountAmount;

    const amountStr = `₩${result.amount.toLocaleString()}`;
    const discountStr = result.discountApplied ? `₩${discountAmount.toLocaleString()}` : "-";
    const remainingStr = result.remainingMonths !== null ? `${result.remainingMonths} months` : "-";
    const statusStr = result.success ? "✓ Success" : "✗ Failed";
    const statusColor = result.success ? colors.green : colors.red;

    console.log(
      `#${result.cycle}`.padEnd(10) +
      amountStr.padEnd(15) +
      discountStr.padEnd(15) +
      remainingStr.padEnd(15) +
      `${statusColor}${statusStr}${colors.reset}`.padEnd(15 + statusColor.length + colors.reset.length)
    );
  });

  console.log("━".repeat(70));

  // Summary statistics
  console.log("\n📊 Statistics:");
  log(`Total Amount Charged: ₩${totalCharged.toLocaleString()}`, colors.bright);
  log(`Total Discount Given: ₩${totalDiscount.toLocaleString()}`, colors.green);
  log(`Expected Total (4 months): ₩${(plan.price * 4).toLocaleString()}`, colors.blue);
  log(`Actual Savings: ${((totalDiscount / (plan.price * 4)) * 100).toFixed(1)}%`, colors.green);

  // Verification
  console.log("\n✅ Verification:");
  const expectedResults = [
    { cycle: 1, shouldHaveDiscount: true },
    { cycle: 2, shouldHaveDiscount: true },
    { cycle: 3, shouldHaveDiscount: true },
    { cycle: 4, shouldHaveDiscount: false },
  ];

  let allCorrect = true;
  expectedResults.forEach(({ cycle, shouldHaveDiscount }) => {
    const result = results[cycle - 1];
    const correct = result.success && result.discountApplied === shouldHaveDiscount;
    const icon = correct ? "✓" : "✗";
    const color = correct ? colors.green : colors.red;
    
    log(
      `${color}${icon} Cycle ${cycle}: Discount ${shouldHaveDiscount ? "applied" : "not applied"} - ${correct ? "CORRECT" : "INCORRECT"}${colors.reset}`,
      ""
    );
    
    if (!correct) allCorrect = false;
  });

  console.log("\n" + "=".repeat(60));
  if (allCorrect) {
    log("🎉 ALL TESTS PASSED! Coupon expiration works correctly.", colors.bright + colors.green);
  } else {
    log("❌ TESTS FAILED! Coupon expiration not working as expected.", colors.bright + colors.red);
  }
  console.log("=".repeat(60));
}

async function main() {
  console.clear();
  log("🧪 Recurring Billing with Coupon Expiration Test", colors.bright + colors.cyan);
  log("================================================\n", colors.cyan);

  if (isDryRun) {
    log("🏃 Running in DRY-RUN mode (no real API calls)", colors.yellow);
  }
  if (useMockToss) {
    log("🎭 Using MOCK TOSS payments", colors.magenta);
  }

  try {
    // Confirm execution
    const confirmMessage = isDryRun
      ? "This will run a simulated test. Continue?"
      : "⚠️  This will execute REAL payments via TOSS API. Continue?";

    const confirmed = await askConfirmation(confirmMessage);
    if (!confirmed) {
      log("\n❌ Test cancelled by user", colors.yellow);
      process.exit(0);
    }

    // Setup test data
    const { user, plan, coupon, subscription } = await setupTestData();

    // Run billing cycles
    const results = await runBillingCycles(subscription);

    // Display summary
    displaySummary(results, plan);

    // Cleanup option
    if (!isDryRun) {
      const cleanup = await askConfirmation("\nDo you want to cleanup test data?");
      if (cleanup) {
        await prisma.userSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            recurringStatus: RecurringStatus.CANCELLED,
          },
        });
        log("\n✓ Test data cleaned up", colors.green);
      }
    }

  } catch (error: any) {
    log(`\n❌ Test failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
main();