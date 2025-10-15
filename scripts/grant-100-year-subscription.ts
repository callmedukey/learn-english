#!/usr/bin/env tsx
/**
 * Script to grant a 100-year free subscription to a specific user
 *
 * Usage: tsx scripts/grant-100-year-subscription.ts
 */

import { prisma } from "@/prisma/prisma-client";

const TARGET_EMAIL = "test@readingchamp.com";
const SUBSCRIPTION_YEARS = 100;
const SUBSCRIPTION_DAYS = SUBSCRIPTION_YEARS * 365;

async function grantLongTermSubscription() {
  console.log(`🎁 Granting ${SUBSCRIPTION_YEARS}-year free subscription to ${TARGET_EMAIL}...\n`);

  try {
    // 1. Find the user
    console.log("1️⃣ Finding user...");
    const user = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
    });

    if (!user) {
      console.error(`❌ User with email ${TARGET_EMAIL} not found`);
      process.exit(1);
    }
    console.log(`   ✅ Found user: ${user.email} (ID: ${user.id})`);

    // 2. Find or create a special plan
    console.log("\n2️⃣ Setting up subscription plan...");
    let plan = await prisma.plan.findFirst({
      where: {
        name: `${SUBSCRIPTION_YEARS} Year Free Subscription`,
        isActive: true,
      },
    });

    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: `${SUBSCRIPTION_YEARS} Year Free Subscription`,
          price: 0,
          priceUSD: 0,
          duration: SUBSCRIPTION_DAYS,
          description: `Special ${SUBSCRIPTION_YEARS}-year free subscription for testing and VIP users`,
          isActive: true,
          sortOrder: 999, // Put it at the end
        },
      });
      console.log(`   ✅ Created new plan: ${plan.name}`);
    } else {
      console.log(`   ✅ Using existing plan: ${plan.name}`);
    }

    // 3. Check for existing active subscriptions
    console.log("\n3️⃣ Checking for existing subscriptions...");
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      orderBy: {
        endDate: "desc",
      },
    });

    if (existingSubscription) {
      console.log(`   ⚠️  Found existing active subscription (ends: ${existingSubscription.endDate.toLocaleDateString()})`);
      console.log(`   Will create new subscription alongside existing one`);
    } else {
      console.log(`   ✅ No existing active subscriptions found`);
    }

    // 4. Create payment and subscription in a transaction
    console.log(`\n4️⃣ Creating payment record and subscription...`);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + SUBSCRIPTION_YEARS);

    const result = await prisma.$transaction(async (tx) => {
      // Create a payment record with WAIVED status
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          planId: plan.id,
          paymentKey: `ADMIN_GRANT_${Date.now()}`,
          orderId: `ADMIN_100Y_${Date.now()}`,
          orderName: `${SUBSCRIPTION_YEARS} Year Free Subscription - Admin Grant`,
          amount: 0,
          originalAmount: 0,
          discountAmount: 0,
          currency: "KRW",
          status: "WAIVED",
          paymentType: "ONE_TIME",
          method: "ADMIN_GRANT",
          approvedAt: startDate,
        },
      });

      // Create the subscription
      const subscription = await tx.userSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          paymentId: payment.id,
          status: "ACTIVE",
          startDate: startDate,
          endDate: endDate,
          autoRenew: false,
          recurringStatus: "INACTIVE",
        },
      });

      return { payment, subscription };
    });

    // 5. Display success message
    console.log("\n✅ Subscription granted successfully!\n");
    console.log("📋 Subscription Details:");
    console.log(`   User: ${user.email}`);
    console.log(`   Plan: ${plan.name}`);
    console.log(`   Status: ${result.subscription.status}`);
    console.log(`   Start Date: ${result.subscription.startDate.toLocaleDateString()}`);
    console.log(`   End Date: ${result.subscription.endDate.toLocaleDateString()}`);
    console.log(`   Duration: ${SUBSCRIPTION_YEARS} years (${SUBSCRIPTION_DAYS} days)`);
    console.log(`   Payment ID: ${result.payment.id}`);
    console.log(`   Payment Status: ${result.payment.status}`);

    console.log("\n🎉 Done! The user now has access for the next 100 years.");

  } catch (error) {
    console.error("\n❌ Error granting subscription:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
grantLongTermSubscription()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
