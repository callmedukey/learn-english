import bcrypt from "bcryptjs";

import { Role, Gender } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * Script to set up test accounts and clean payment data for maintenance mode
 * 
 * This script will:
 * 1. Create test@readingchamp.com account if it doesn't exist
 * 2. Create test2@readingchamp.com account if it doesn't exist
 * 3. Clean all payment-related data from both test accounts
 */

async function setupTestAccounts() {
  console.log("🔧 Setting up test accounts for payment maintenance mode...\n");

  try {
    // Get South Korea country
    const korea = await prisma.country.findFirst({
      where: { name: "South Korea" },
    });

    if (!korea) {
      console.error("❌ South Korea country not found in database");
      process.exit(1);
    }

    // Default test account password
    const hashedPassword = await bcrypt.hash("test2025@@@", 10);

    // Create or update test@readingchamp.com
    console.log("📧 Setting up test@readingchamp.com...");
    const testUser = await prisma.user.upsert({
      where: { email: "test@readingchamp.com" },
      update: {
        password: hashedPassword,
        countryId: korea.id,
        gender: Gender.Male,
        birthday: new Date("2000-01-01"),
        role: Role.USER,
      },
      create: {
        email: "test@readingchamp.com",
        password: hashedPassword,
        nickname: "Test User",
        role: Role.USER,
        countryId: korea.id,
        gender: Gender.Male,
        birthday: new Date("2000-01-01"),
      },
    });
    console.log("✅ test@readingchamp.com ready");

    // Create or update test2@readingchamp.com
    console.log("📧 Setting up test2@readingchamp.com...");
    const test2User = await prisma.user.upsert({
      where: { email: "test2@readingchamp.com" },
      update: {
        password: hashedPassword,
        countryId: korea.id,
        gender: Gender.Female,
        birthday: new Date("2000-01-01"),
        role: Role.USER,
      },
      create: {
        email: "test2@readingchamp.com",
        password: hashedPassword,
        nickname: "Test User 2",
        role: Role.USER,
        countryId: korea.id,
        gender: Gender.Female,
        birthday: new Date("2000-01-01"),
      },
    });
    console.log("✅ test2@readingchamp.com ready");

    // Clean payment data for both test accounts
    console.log("\n🧹 Cleaning payment data for test accounts...");

    const testUserIds = [testUser.id, test2User.id];

    // Delete coupon applications (through subscription relation)
    const deletedCouponApps = await prisma.couponApplication.deleteMany({
      where: {
        subscription: {
          userId: { in: testUserIds }
        }
      },
    });
    console.log(`  - Deleted ${deletedCouponApps.count} coupon applications`);

    // Delete billing history (must be done before deleting subscriptions)
    const deletedBillingHistory = await prisma.billingHistory.deleteMany({
      where: {
        subscription: {
          userId: { in: testUserIds }
        }
      },
    });
    console.log(`  - Deleted ${deletedBillingHistory.count} billing history records`);

    // Delete subscriptions
    const deletedSubscriptions = await prisma.userSubscription.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`  - Deleted ${deletedSubscriptions.count} subscriptions`);

    // Delete payments
    const deletedPayments = await prisma.payment.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`  - Deleted ${deletedPayments.count} payments`);

    // Clear billing keys from users
    await prisma.user.updateMany({
      where: { id: { in: testUserIds } },
      data: {
        billingKey: null,
        billingAuthKey: null,
        billingKeyIssuedAt: null,
        billingMethod: null,
      },
    });
    console.log(`  - Cleared billing keys from test users`);

    console.log("\n✅ Test accounts setup complete!");
    console.log("\n📝 Test Account Details:");
    console.log("  Email: test@readingchamp.com");
    console.log("  Email: test2@readingchamp.com");
    console.log("  Password: test2025@@@");
    console.log("\n⚠️  Note: Only test@readingchamp.com has payment access during maintenance");

  } catch (error) {
    console.error("❌ Error setting up test accounts:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupTestAccounts();