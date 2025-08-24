#!/usr/bin/env tsx
/**
 * Script to fix missing CouponApplication records for subscriptions that used coupons
 * This handles cases where the initial payment used a coupon but no CouponApplication was created
 * 
 * Run with: npx tsx scripts/fix-missing-coupon-application.ts [email]
 * Example: npx tsx scripts/fix-missing-coupon-application.ts test@readingchamp.com
 */

import { prisma } from "../prisma/prisma-client";
import { CouponRecurringType } from "../prisma/generated/prisma";
import * as readline from "readline";

const userEmail = process.argv[2] || "test@readingchamp.com";

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
  log(`\n🔧 Fix Missing Coupon Applications\n`, colors.bright + colors.cyan);

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      log(`❌ User not found: ${userEmail}`, colors.red);
      process.exit(1);
    }

    // Find active subscriptions with their initial payments
    const subscriptions = await prisma.userSubscription.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        payment: true,
        plan: true,
        couponApplications: {
          include: {
            coupon: true,
          },
        },
      },
    });

    log(`Found ${subscriptions.length} active subscription(s)`, colors.cyan);

    for (const subscription of subscriptions) {
      console.log("\n" + "=".repeat(60));
      log(`\nSubscription ID: ${subscription.id}`, colors.bright);
      log(`Plan: ${subscription.plan.name} (₩${subscription.plan.price.toLocaleString()})`, colors.cyan);

      // Check if initial payment used a coupon
      if (subscription.payment.couponCode) {
        log(`\n✅ Initial payment used coupon: ${subscription.payment.couponCode}`, colors.green);
        log(`  Original amount: ₩${subscription.payment.originalAmount?.toLocaleString() || subscription.plan.price.toLocaleString()}`, colors.cyan);
        log(`  Discount amount: ₩${subscription.payment.discountAmount?.toLocaleString() || "Unknown"}`, colors.cyan);
        log(`  Paid amount: ₩${subscription.payment.amount.toLocaleString()}`, colors.cyan);

        // Check if CouponApplication exists
        const hasCouponApp = subscription.couponApplications.length > 0;
        
        if (hasCouponApp) {
          log(`\n✓ CouponApplication exists:`, colors.green);
          for (const app of subscription.couponApplications) {
            log(`  - ${app.coupon.code}: Active=${app.isActive}, Remaining=${app.remainingMonths}`, colors.cyan);
          }
        } else {
          log(`\n❌ No CouponApplication found! This needs to be fixed.`, colors.red);

          // Find the coupon
          const coupon = await prisma.discountCoupon.findUnique({
            where: { code: subscription.payment.couponCode },
          });

          if (!coupon) {
            log(`\n⚠️  Coupon "${subscription.payment.couponCode}" not found in database!`, colors.yellow);
            
            // Try to infer coupon details from payment
            const discountAmount = subscription.payment.discountAmount || 0;
            const originalAmount = subscription.payment.originalAmount || subscription.plan.price;
            const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
            
            const create = await askConfirmation(`Create coupon with ${discountPercentage}% discount?`);
            if (!create) continue;

            const newCoupon = await prisma.discountCoupon.create({
              data: {
                code: subscription.payment.couponCode,
                discount: discountPercentage > 0 ? discountPercentage : 0,
                flatDiscount: discountPercentage > 0 ? 0 : discountAmount,
                active: true,
                recurringType: CouponRecurringType.RECURRING,
                recurringMonths: 3, // Default to 3 months
                oneTimeUse: false,
              },
            });
            
            log(`✓ Created coupon: ${newCoupon.code}`, colors.green);
            
            // Create CouponApplication
            await prisma.couponApplication.create({
              data: {
                subscriptionId: subscription.id,
                couponId: newCoupon.id,
                isActive: true,
                appliedCount: 1, // Already used once for initial payment
                remainingMonths: 2, // 3 months - 1 already used
                discountPercentage: newCoupon.discount,
                flatDiscountKRW: newCoupon.flatDiscount,
              },
            });
            
            log(`✓ Created CouponApplication with 2 remaining months`, colors.green);
          } else {
            log(`\n✓ Found coupon in database:`, colors.green);
            log(`  Type: ${coupon.recurringType}`, colors.cyan);
            log(`  Discount: ${coupon.discount}% + ₩${coupon.flatDiscount}`, colors.cyan);
            log(`  Duration: ${coupon.recurringMonths || "Unlimited"} months`, colors.cyan);

            if (coupon.recurringType !== CouponRecurringType.RECURRING) {
              log(`\n⚠️  Coupon is not RECURRING type. It won't apply to future payments.`, colors.yellow);
              continue;
            }

            const apply = await askConfirmation("\nCreate CouponApplication for this subscription?");
            if (!apply) continue;

            // Calculate how many months have passed since subscription started
            const monthsPassed = Math.floor(
              (new Date().getTime() - subscription.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
            );
            
            const remainingMonths = coupon.recurringMonths 
              ? Math.max(0, coupon.recurringMonths - monthsPassed - 1) // -1 for initial payment
              : null;

            await prisma.couponApplication.create({
              data: {
                subscriptionId: subscription.id,
                couponId: coupon.id,
                isActive: remainingMonths === null || remainingMonths > 0,
                appliedCount: monthsPassed + 1, // Including initial payment
                remainingMonths: remainingMonths,
                discountPercentage: coupon.discount,
                flatDiscountKRW: coupon.flatDiscount,
              },
            });

            log(`✓ Created CouponApplication`, colors.green);
            log(`  Applied count: ${monthsPassed + 1}`, colors.cyan);
            log(`  Remaining months: ${remainingMonths === null ? "Unlimited" : remainingMonths}`, colors.cyan);
            log(`  Is active: ${remainingMonths === null || remainingMonths > 0}`, colors.cyan);
          }
        }
      } else {
        log(`\nNo coupon used in initial payment`, colors.cyan);
      }
    }

    console.log("\n" + "=".repeat(60));
    log(`\n✅ Fix complete! Run the following to verify:`, colors.green);
    log(`npx tsx scripts/check-subscription-coupon.ts ${userEmail}`, colors.cyan);

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();