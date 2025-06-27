import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();

async function fixReferrals() {
  console.log("Starting referral data fix...");

  try {
    // Step 1: Find and fix circular references
    console.log("\n1. Finding circular references...");
    
    // Get all users with their referrer and referrals
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        referrerId: true,
        referralsMade: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    let circularFixCount = 0;
    
    for (const user of users) {
      if (user.referrerId) {
        // Check if this user's referrerId points to someone they referred
        const isCircular = user.referralsMade.some(
          (referral) => referral.id === user.referrerId
        );
        
        if (isCircular) {
          console.log(
            `Found circular reference: ${user.nickname} (${user.id}) has referrerId pointing to someone they referred`
          );
          
          // Clear the incorrect referrerId
          await prisma.user.update({
            where: { id: user.id },
            data: { referrerId: null },
          });
          
          circularFixCount++;
        }
      }
    }
    
    console.log(`Fixed ${circularFixCount} circular references`);

    // Step 2: Update isReferred flag for users with valid referrerId
    console.log("\n2. Updating isReferred flags...");
    
    const usersWithReferrer = await prisma.user.updateMany({
      where: {
        referrerId: { not: null },
        isReferred: false,
      },
      data: {
        isReferred: true,
      },
    });
    
    console.log(`Updated ${usersWithReferrer.count} users with isReferred = true`);

    // Step 3: Clear isReferred for users without referrerId
    const usersWithoutReferrer = await prisma.user.updateMany({
      where: {
        referrerId: null,
        isReferred: true,
      },
      data: {
        isReferred: false,
      },
    });
    
    console.log(`Updated ${usersWithoutReferrer.count} users with isReferred = false`);

    // Step 4: Recalculate referrerCount for all users
    console.log("\n3. Recalculating referrerCount for all users...");
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        referrerCount: true,
      },
    });

    let countFixCount = 0;
    
    for (const user of allUsers) {
      // Count actual referrals
      const actualReferralCount = await prisma.user.count({
        where: {
          referrerId: user.id,
        },
      });
      
      // Update if different
      if (user.referrerCount !== actualReferralCount) {
        console.log(
          `Fixing referrerCount for ${user.nickname}: ${user.referrerCount} -> ${actualReferralCount}`
        );
        
        await prisma.user.update({
          where: { id: user.id },
          data: { referrerCount: actualReferralCount },
        });
        
        countFixCount++;
      }
    }
    
    console.log(`Fixed referrerCount for ${countFixCount} users`);

    // Final summary
    console.log("\n=== Summary ===");
    console.log(`Circular references fixed: ${circularFixCount}`);
    console.log(`Users with isReferred updated to true: ${usersWithReferrer.count}`);
    console.log(`Users with isReferred updated to false: ${usersWithoutReferrer.count}`);
    console.log(`Users with referrerCount corrected: ${countFixCount}`);
    
    // Verification stats
    const stats = await prisma.user.aggregate({
      _count: {
        id: true,
        referrerId: true,
      },
    });
    
    const referredUsers = await prisma.user.count({
      where: { isReferred: true },
    });
    
    console.log("\n=== Final Stats ===");
    console.log(`Total users: ${stats._count.id}`);
    console.log(`Users with referrers: ${stats._count.referrerId}`);
    console.log(`Users marked as referred: ${referredUsers}`);
    
    if (stats._count.referrerId !== referredUsers) {
      console.warn(
        "WARNING: Mismatch between users with referrerId and isReferred flag!"
      );
    } else {
      console.log("✓ Data is consistent!");
    }

  } catch (error) {
    console.error("Error fixing referrals:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixReferrals()
  .then(() => {
    console.log("\nReferral fix completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nReferral fix failed:", error);
    process.exit(1);
  });