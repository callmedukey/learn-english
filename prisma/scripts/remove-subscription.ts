/**
 * Remove Subscription Script
 *
 * Removes all subscription-related data for a user by email address.
 * Deletes: BillingHistory -> CouponApplication -> UserSubscription -> Payment
 *
 * Usage:
 *   tsx prisma/scripts/remove-subscription.ts <email>
 *
 * Example:
 *   tsx prisma/scripts/remove-subscription.ts test@readingchamp.com
 */

import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();

async function removeSubscription(email: string) {
  console.log(`\n🔍 Finding user: ${email}\n`);

  // Step 1: Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      nickname: true,
    },
  });

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    return;
  }

  console.log(`Found user: ${user.nickname} (${user.id})\n`);

  // Step 2: Get current subscription data
  const subscriptions = await prisma.userSubscription.findMany({
    where: { userId: user.id },
    include: {
      payment: true,
      plan: true,
    },
  });

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
  });

  console.log(`📋 Current data:`);
  console.log(`   Subscriptions: ${subscriptions.length}`);
  console.log(`   Payments: ${payments.length}\n`);

  if (subscriptions.length > 0) {
    console.log(`📅 Subscription details:`);
    for (const sub of subscriptions) {
      console.log(`   - ${sub.status} | ${sub.plan.name}`);
      console.log(`     Start: ${sub.startDate.toISOString().split("T")[0]}`);
      console.log(`     End: ${sub.endDate.toISOString().split("T")[0]}`);
      console.log(`     Payment: ₩${sub.payment.amount.toLocaleString()}\n`);
    }
  }

  if (subscriptions.length === 0 && payments.length === 0) {
    console.log(`✅ No subscription data to remove for this user.`);
    return;
  }

  // Step 3: Delete in order (respecting foreign key constraints)
  console.log(`🗑️  Deleting subscription data...\n`);

  // 3a. Delete BillingHistory
  const billingDeleted = await prisma.billingHistory.deleteMany({
    where: { userId: user.id },
  });
  console.log(`   BillingHistory deleted: ${billingDeleted.count}`);

  // 3b. Delete CouponApplication
  const subscriptionIds = subscriptions.map((s) => s.id);
  const couponDeleted = await prisma.couponApplication.deleteMany({
    where: { subscriptionId: { in: subscriptionIds } },
  });
  console.log(`   CouponApplication deleted: ${couponDeleted.count}`);

  // 3c. Delete UserSubscription
  const subDeleted = await prisma.userSubscription.deleteMany({
    where: { userId: user.id },
  });
  console.log(`   UserSubscription deleted: ${subDeleted.count}`);

  // 3d. Delete Payment
  const payDeleted = await prisma.payment.deleteMany({
    where: { userId: user.id },
  });
  console.log(`   Payment deleted: ${payDeleted.count}`);

  // Step 4: Verify
  console.log(`\n✅ Verification:`);
  const remainingSubs = await prisma.userSubscription.count({
    where: { userId: user.id },
  });
  const remainingPay = await prisma.payment.count({
    where: { userId: user.id },
  });
  console.log(`   Subscriptions remaining: ${remainingSubs}`);
  console.log(`   Payments remaining: ${remainingPay}`);

  console.log(`\n✅ Done! Subscription data removed for ${email}\n`);
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.error("Usage: tsx prisma/scripts/remove-subscription.ts <email>");
  process.exit(1);
}

removeSubscription(email)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
