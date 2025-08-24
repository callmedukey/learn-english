#!/usr/bin/env tsx
/**
 * Test script to simulate the payment confirmation flow
 * This helps debug why CouponApplication might not be created
 * 
 * Run with: npx tsx scripts/test-payment-flow.ts
 */

import { prisma } from "../prisma/prisma-client";

async function main() {
  console.log("\n🧪 Testing Payment Confirmation Flow\n");

  try {
    // Find a recent payment that used a coupon
    const recentPayment = await prisma.payment.findFirst({
      where: {
        status: "PAID",
        couponCode: { not: null },
      },
      orderBy: { createdAt: "desc" },
      include: {
        plan: true,
        user: {
          include: {
            country: true,
          },
        },
        coupon: true,
        subscription: {
          include: {
            couponApplications: true,
          },
        },
      },
    });

    if (!recentPayment) {
      console.log("No recent payment with coupon found");
      return;
    }

    console.log("📋 Recent Payment:");
    console.log(`  Order ID: ${recentPayment.orderId}`);
    console.log(`  User: ${recentPayment.user.email}`);
    console.log(`  Country: ${recentPayment.user.country?.name}`);
    console.log(`  Coupon: ${recentPayment.couponCode}`);
    console.log(`  Amount: ₩${recentPayment.amount.toLocaleString()}`);
    console.log(`  Created: ${recentPayment.createdAt.toLocaleString()}`);

    console.log("\n🎟️ Coupon Details:");
    if (recentPayment.coupon) {
      console.log(`  Type: ${recentPayment.coupon.recurringType}`);
      console.log(`  Discount: ${recentPayment.coupon.discount}% + ₩${recentPayment.coupon.flatDiscount.toLocaleString()}`);
      console.log(`  Recurring months: ${recentPayment.coupon.recurringMonths}`);
    } else {
      console.log("  ❌ Coupon not found in payment relation!");
    }

    console.log("\n📊 Subscription:");
    if (recentPayment.subscription) {
      console.log(`  ID: ${recentPayment.subscription.id}`);
      console.log(`  Status: ${recentPayment.subscription.status}`);
      console.log(`  Auto-renew: ${recentPayment.subscription.autoRenew}`);
      console.log(`  Recurring status: ${recentPayment.subscription.recurringStatus}`);
      console.log(`  Coupon applications: ${recentPayment.subscription.couponApplications.length}`);
      
      if (recentPayment.subscription.couponApplications.length > 0) {
        console.log("  ✅ Has CouponApplication!");
      } else {
        console.log("  ❌ No CouponApplication found!");
      }
    } else {
      console.log("  ❌ No subscription found!");
    }

    // Simulate the conditions from the confirm endpoint
    console.log("\n🔍 Checking Conditions:");
    const isKoreanUser = recentPayment.user.country?.name === "South Korea";
    const isRecurringSetup = isKoreanUser;
    
    console.log(`  Is Korean user: ${isKoreanUser}`);
    console.log(`  Is recurring setup: ${isRecurringSetup}`);
    console.log(`  Has coupon: ${!!recentPayment.coupon}`);
    console.log(`  Coupon type is RECURRING: ${recentPayment.coupon?.recurringType === "RECURRING"}`);
    
    const shouldCreateApplication = !!(
      recentPayment.coupon &&
      recentPayment.coupon.recurringType === "RECURRING" &&
      isRecurringSetup
    );
    
    console.log(`  Should create CouponApplication: ${shouldCreateApplication}`);
    
    if (shouldCreateApplication && recentPayment.subscription?.couponApplications.length === 0) {
      console.log("\n❌ CouponApplication SHOULD have been created but wasn't!");
      console.log("This indicates a bug in the payment confirmation flow.");
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();