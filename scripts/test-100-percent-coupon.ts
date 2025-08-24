#!/usr/bin/env tsx
import { prisma } from "../prisma/prisma-client";
import { BillingService } from "../lib/services/billing.service";

/**
 * Test script to verify 100% discount coupon handling in recurring billing
 * 
 * This script:
 * 1. Creates a test user with a subscription
 * 2. Applies a 100% discount coupon valid for 3 months
 * 3. Simulates the billing process to ensure no actual payment is attempted
 */

async function test100PercentCoupon() {
  console.log("🧪 Testing 100% discount coupon handling...\n");

  try {
    // Find a test user (or use an existing one)
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: "test" },
        country: { name: "South Korea" },
        billingKey: { not: null },
      },
    });

    if (!testUser) {
      console.error("❌ No test user found with billing key. Please set up a test user first.");
      return;
    }

    console.log(`✅ Found test user: ${testUser.email}`);

    // Find or create a monthly plan
    let monthlyPlan = await prisma.plan.findFirst({
      where: { duration: 30, isActive: true },
    });

    if (!monthlyPlan) {
      monthlyPlan = await prisma.plan.create({
        data: {
          name: "Monthly Test Plan",
          price: 9900,
          priceUSD: 9.99,
          duration: 30,
          description: "Test plan for coupon testing",
          isActive: true,
        },
      });
      console.log("✅ Created test monthly plan");
    }

    // Create a 100% discount coupon valid for 3 months
    const coupon = await prisma.discountCoupon.create({
      data: {
        code: `TEST100_${Date.now()}`,
        discount: 100, // 100% discount
        flatDiscount: 0,
        active: true,
        oneTimeUse: false,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
        recurringType: "RECURRING",
        recurringMonths: 3, // Valid for 3 months
        maxRecurringUses: 1,
      },
    });
    console.log(`✅ Created 100% discount coupon: ${coupon.code}`);

    // Create or update subscription
    let subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: testUser.id,
        recurringStatus: "ACTIVE",
      },
    });

    if (!subscription) {
      // Create a dummy payment for the subscription
      const dummyPayment = await prisma.payment.create({
        data: {
          userId: testUser.id,
          planId: monthlyPlan.id,
          paymentKey: `DUMMY_${Date.now()}`,
          orderId: `DUMMY_ORDER_${Date.now()}`,
          orderName: `Test subscription payment`,
          amount: 0,
          originalAmount: monthlyPlan.price,
          discountAmount: monthlyPlan.price,
          currency: "KRW",
          status: "PAID",
          paymentType: "INITIAL_SUBSCRIPTION",
        },
      });

      subscription = await prisma.userSubscription.create({
        data: {
          userId: testUser.id,
          planId: monthlyPlan.id,
          paymentId: dummyPayment.id,
          startDate: new Date(),
          endDate: new Date(),
          nextBillingDate: new Date(), // Due immediately for testing
          autoRenew: true,
          recurringStatus: "ACTIVE",
        },
      });
      console.log("✅ Created test subscription");
    } else {
      // Update to be due for billing
      subscription = await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          nextBillingDate: new Date(),
          recurringStatus: "ACTIVE",
        },
      });
      console.log("✅ Updated existing subscription to be due for billing");
    }

    // Apply the coupon to the subscription
    const couponApplication = await prisma.couponApplication.create({
      data: {
        couponId: coupon.id,
        subscriptionId: subscription.id,
        isActive: true,
        appliedCount: 0,
        remainingMonths: 3,
      },
    });
    console.log("✅ Applied 100% discount coupon to subscription");

    // Now test the billing process
    console.log("\n🔄 Simulating billing process...\n");

    const billingService = new BillingService();
    
    // Fetch the subscription with all relations
    const subscriptionWithRelations = await prisma.userSubscription.findUnique({
      where: { id: subscription.id },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!subscriptionWithRelations) {
      throw new Error("Subscription not found");
    }

    // Execute the billing
    const result = await billingService.executeBillingPayment(subscriptionWithRelations);

    if (result.success) {
      console.log("✅ Billing completed successfully!");
      console.log(`   Payment Status: ${result.payment.status}`);
      console.log(`   Payment Key: ${result.payment.paymentKey}`);
      console.log(`   Amount: ₩${result.payment.amount}`);
      
      // Verify the payment record
      const payment = await prisma.payment.findUnique({
        where: { paymentKey: result.payment.paymentKey },
      });
      
      if (payment) {
        console.log("\n📋 Payment Record:");
        console.log(`   Status: ${payment.status}`);
        console.log(`   Original Amount: ₩${payment.originalAmount}`);
        console.log(`   Discount Amount: ₩${payment.discountAmount}`);
        console.log(`   Final Amount: ₩${payment.amount}`);
        console.log(`   Coupon Code: ${payment.couponCode}`);
      }
      
      // Check coupon application status
      const updatedCouponApp = await prisma.couponApplication.findUnique({
        where: { id: couponApplication.id },
      });
      
      if (updatedCouponApp) {
        console.log("\n🎟️ Coupon Application Status:");
        console.log(`   Applied Count: ${updatedCouponApp.appliedCount}`);
        console.log(`   Remaining Months: ${updatedCouponApp.remainingMonths}`);
        console.log(`   Is Active: ${updatedCouponApp.isActive}`);
      }
      
      // Check subscription status
      const updatedSubscription = await prisma.userSubscription.findUnique({
        where: { id: subscription.id },
      });
      
      if (updatedSubscription) {
        console.log("\n📅 Subscription Status:");
        console.log(`   Next Billing Date: ${updatedSubscription.nextBillingDate?.toLocaleDateString()}`);
        console.log(`   End Date: ${updatedSubscription.endDate.toLocaleDateString()}`);
      }
      
    } else {
      console.error("❌ Billing failed:", result.error);
    }

    // Cleanup test data
    console.log("\n🧹 Cleaning up test data...");
    await prisma.couponApplication.delete({ where: { id: couponApplication.id } });
    await prisma.discountCoupon.delete({ where: { id: coupon.id } });
    console.log("✅ Test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
test100PercentCoupon();