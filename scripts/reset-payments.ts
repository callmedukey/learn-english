#!/usr/bin/env tsx

import { prisma } from "@/prisma/prisma-client";

async function resetPaymentsAndSubscriptions() {
  console.log(
    "🚨 WARNING: This will delete ALL payment data, subscriptions, and billing keys!",
  );
  console.log("This action cannot be undone.");
  console.log("");

  // Add a safety check for production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot run this script in production!");
    process.exit(1);
  }

  // Give user time to cancel
  console.log("Starting in 5 seconds... Press Ctrl+C to cancel");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    console.log("\n🔄 Starting payment data reset...\n");

    // 1. Delete all billing history
    console.log("1️⃣ Deleting billing history...");
    const billingHistoryResult = await prisma.billingHistory.deleteMany({});
    console.log(
      `   ✅ Deleted ${billingHistoryResult.count} billing history records`,
    );

    // 2. Delete all payment webhooks
    console.log("\n2️⃣ Deleting payment webhooks...");
    const webhookResult = await prisma.paymentWebhook.deleteMany({});
    console.log(`   ✅ Deleted ${webhookResult.count} payment webhook records`);

    // 3. Delete all user subscriptions
    console.log("\n3️⃣ Deleting user subscriptions...");
    const subscriptionResult = await prisma.userSubscription.deleteMany({});
    console.log(`   ✅ Deleted ${subscriptionResult.count} user subscriptions`);

    // 4. Delete all payments
    console.log("\n4️⃣ Deleting payments...");
    const paymentResult = await prisma.payment.deleteMany({});
    console.log(`   ✅ Deleted ${paymentResult.count} payment records`);

    // 5. Reset all user billing keys and related fields
    console.log("\n5️⃣ Resetting user billing keys...");
    const userUpdateResult = await prisma.user.updateMany({
      where: {
        OR: [
          { billingKey: { not: null } },
          { billingAuthKey: { not: null } },
          { billingKeyIssuedAt: { not: null } },
          { billingMethod: { not: null } },
        ],
      },
      data: {
        billingKey: null,
        billingAuthKey: null,
        billingKeyIssuedAt: null,
        billingMethod: null,
      },
    });
    console.log(
      `   ✅ Reset billing information for ${userUpdateResult.count} users`,
    );

    // 6. Show summary
    console.log("\n✨ Payment data reset complete!");
    console.log("\n📊 Summary:");
    console.log(
      `   - Billing history records deleted: ${billingHistoryResult.count}`,
    );
    console.log(`   - Payment webhooks deleted: ${webhookResult.count}`);
    console.log(`   - User subscriptions deleted: ${subscriptionResult.count}`);
    console.log(`   - Payment records deleted: ${paymentResult.count}`);
    console.log(`   - User billing keys reset: ${userUpdateResult.count}`);

    // 7. Verify the reset
    console.log("\n🔍 Verifying reset...");
    const verifyPayments = await prisma.payment.count();
    const verifySubscriptions = await prisma.userSubscription.count();
    const verifyBillingKeys = await prisma.user.count({
      where: { billingKey: { not: null } },
    });

    if (
      verifyPayments === 0 &&
      verifySubscriptions === 0 &&
      verifyBillingKeys === 0
    ) {
      console.log("   ✅ Verification passed: All payment data has been reset");
    } else {
      console.log("   ⚠️  Warning: Some data may not have been fully reset");
      console.log(`      Remaining payments: ${verifyPayments}`);
      console.log(`      Remaining subscriptions: ${verifySubscriptions}`);
      console.log(`      Remaining billing keys: ${verifyBillingKeys}`);
    }
  } catch (error) {
    console.error("\n❌ Error during reset:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetPaymentsAndSubscriptions()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
