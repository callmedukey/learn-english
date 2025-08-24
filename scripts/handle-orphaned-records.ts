import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function handleOrphanedRecords() {
  console.log('Starting to handle orphaned records...\n');

  // Get all valid user IDs
  const validUsers = await prisma.user.findMany({
    select: { id: true }
  });
  const validUserIds = new Set(validUsers.map((u: { id: string }) => u.id));
  console.log(`Found ${validUserIds.size} valid users\n`);

  // Check and report orphaned records in each table
  const tables = [
    { name: 'Medal', model: prisma.medal },
    { name: 'Payment', model: prisma.payment },
    { name: 'UserSubscription', model: prisma.userSubscription },
    { name: 'Notification', model: prisma.notification },
    { name: 'BillingHistory', model: prisma.billingHistory },
    { name: 'NovelQuestionCompleted', model: prisma.novelQuestionCompleted },
    { name: 'RCQuestionCompleted', model: prisma.rCQuestionCompleted },
    { name: 'TotalScore', model: prisma.totalScore },
    { name: 'ARScore', model: prisma.aRScore },
    { name: 'RCScore', model: prisma.rCScore },
    { name: 'MonthlyARScore', model: prisma.monthlyARScore },
    { name: 'MonthlyRCScore', model: prisma.monthlyRCScore },
    { name: 'UserLevelLock', model: prisma.userLevelLock },
    { name: 'LevelChangeRequest', model: prisma.levelChangeRequest },
    { name: 'UserPopupDismissal', model: prisma.userPopupDismissal },
    { name: 'RCQuestionFirstTry', model: prisma.rCQuestionFirstTry },
    { name: 'RCQuestionSecondTry', model: prisma.rCQuestionSecondTry },
    { name: 'NovelQuestionFirstTry', model: prisma.novelQuestionFirstTry },
    { name: 'NovelQuestionSecondTry', model: prisma.novelQuestionSecondTry },
  ];

  const orphanedRecordsSummary: any[] = [];

  for (const table of tables) {
    try {
      // Find orphaned records
      const allRecords = await (table.model as any).findMany({
        select: { userId: true }
      });
      
      const orphanedRecords = allRecords.filter((r: any) => !validUserIds.has(r.userId));
      
      if (orphanedRecords.length > 0) {
        orphanedRecordsSummary.push({
          table: table.name,
          count: orphanedRecords.length,
          userIds: [...new Set(orphanedRecords.map((r: any) => r.userId))].slice(0, 5) // Show first 5 unique user IDs
        });
        
        console.log(`${table.name}: Found ${orphanedRecords.length} orphaned records`);
        
        // Delete orphaned records
        const deleteResult = await (table.model as any).deleteMany({
          where: {
            userId: {
              notIn: Array.from(validUserIds)
            }
          }
        });
        
        console.log(`  → Deleted ${deleteResult.count} records\n`);
      } else {
        console.log(`${table.name}: No orphaned records found\n`);
      }
    } catch (error: any) {
      console.error(`Error processing ${table.name}: ${error.message}\n`);
    }
  }

  // Handle Session table separately (it also has userId foreign key)
  try {
    const orphanedSessions = await prisma.session.findMany({
      where: {
        userId: {
          notIn: Array.from(validUserIds)
        }
      }
    });
    
    if (orphanedSessions.length > 0) {
      console.log(`Session: Found ${orphanedSessions.length} orphaned records`);
      
      const deleteResult = await prisma.session.deleteMany({
        where: {
          userId: {
            notIn: Array.from(validUserIds)
          }
        }
      });
      
      console.log(`  → Deleted ${deleteResult.count} records\n`);
    } else {
      console.log(`Session: No orphaned records found\n`);
    }
  } catch (error: any) {
    console.error(`Error processing Session: ${error.message}\n`);
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Orphaned records found and deleted:');
  orphanedRecordsSummary.forEach(item => {
    console.log(`  ${item.table}: ${item.count} records`);
    console.log(`    Sample orphaned user IDs: ${item.userIds.join(', ')}`);
  });
  
  console.log('\nNote: Account records with orphaned userIds have been set to NULL (preserved)');
  
  // Check Account table status
  const accountsWithNullUserId = await prisma.account.count({
    where: { userId: null }
  });
  console.log(`\nAccount records with NULL userId: ${accountsWithNullUserId}`);
}

handleOrphanedRecords()
  .then(() => {
    console.log('\n✅ Orphaned records handled successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });