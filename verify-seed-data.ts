import { prisma } from './prisma/prisma-client';

async function verifySeededData() {
  console.log('🔍 Verifying Seeded Data...\n');

  try {
    // 1. Find devduke user
    console.log('1️⃣ Finding devduke user:');
    const devduke = await prisma.user.findUnique({
      where: { email: 'devduke@test.com' },
      include: {
        monthlyARScores: {
          orderBy: { createdAt: 'desc' },
          include: {
            AR: true
          }
        },
        monthlyRCScores: {
          orderBy: { createdAt: 'desc' },
          include: {
            RCLevel: true
          }
        },
        levelLocks: true
      }
    });

    if (devduke) {
      console.log(`✅ User found: ${devduke.name} (${devduke.email})`);
      console.log(`   ID: ${devduke.id}`);
      console.log(`   Role: ${devduke.role}`);
      console.log(`   Total XP: ${devduke.totalXp}`);
      
      // Display monthly AR scores
      console.log(`\n   Monthly AR Scores (${devduke.monthlyARScores.length} total):`);
      devduke.monthlyARScores.forEach(score => {
        console.log(`   - ${score.year}/${String(score.month).padStart(2, '0')} - ${score.AR.name}: Score=${score.score}`);
      });

      // Display monthly RC scores  
      console.log(`\n   Monthly RC Scores (${devduke.monthlyRCScores.length} total):`);
      devduke.monthlyRCScores.forEach(score => {
        console.log(`   - ${score.year}/${String(score.month).padStart(2, '0')} - ${score.RCLevel.name}: Score=${score.score}`);
      });

      // Display level locks
      console.log(`\n   Level Locks (${devduke.levelLocks.length} total):`);
      devduke.levelLocks.forEach(lock => {
        console.log(`   - ${lock.levelType} Level ${lock.levelId}: ${lock.year}/${String(lock.month).padStart(2, '0')} (Changes used: ${lock.changesUsed})`);
      });
    } else {
      console.log('❌ devduke user not found!');
    }

    // 2. Check monthly popups
    console.log('\n2️⃣ Checking monthly popups:');
    const monthlyPopups = await prisma.monthlyPopup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`✅ Found ${monthlyPopups.length} monthly popups:`);
    monthlyPopups.forEach(popup => {
      console.log(`   - ${popup.year}/${String(popup.month).padStart(2, '0')}: "${popup.title}" (Active: ${popup.active})`);
    });

    // 3. Verify monthly leaderboards
    console.log('\n3️⃣ Checking monthly leaderboards:');
    const leaderboards = await prisma.monthlyLeaderboard.findMany({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      take: 10,
      include: {
        goldUser: {
          select: { name: true, email: true }
        },
        silverUser: {
          select: { name: true, email: true }
        },
        bronzeUser: {
          select: { name: true, email: true }
        }
      }
    });

    if (leaderboards.length > 0) {
      console.log(`✅ Found ${leaderboards.length} leaderboard entries`);
      
      leaderboards.forEach(board => {
        console.log(`\n   ${board.year}/${String(board.month).padStart(2, '0')} - ${board.levelType} Level ${board.levelId}:`);
        if (board.goldUser) {
          console.log(`   🥇 Gold: ${board.goldUser.name} (Score: ${board.goldScore})`);
        }
        if (board.silverUser) {
          console.log(`   🥈 Silver: ${board.silverUser.name} (Score: ${board.silverScore})`);
        }
        if (board.bronzeUser) {
          console.log(`   🥉 Bronze: ${board.bronzeUser.name} (Score: ${board.bronzeScore})`);
        }
      });
    } else {
      console.log('❌ No leaderboard entries found!');
    }

    // 4. Check medals
    console.log('\n4️⃣ Checking medals:');
    const medals = await prisma.medal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    console.log(`✅ Found ${medals.length} medals:`);
    medals.forEach(medal => {
      console.log(`   - ${medal.user.name}: ${medal.medalType} medal for ${medal.levelType} Level ${medal.levelId} (${medal.year}/${String(medal.month).padStart(2, '0')}) - Score: ${medal.score}`);
    });

    // Additional checks
    console.log('\n5️⃣ Additional Statistics:');
    
    // Count total users
    const userCount = await prisma.user.count();
    console.log(`   Total users: ${userCount}`);
    
    // Count novels
    const novelCount = await prisma.novel.count();
    console.log(`   Total novels: ${novelCount}`);
    
    // Count chapters
    const chapterCount = await prisma.chapter.count();
    console.log(`   Total chapters: ${chapterCount}`);
    
    // Count questions
    const questionCount = await prisma.question.count();
    console.log(`   Total questions: ${questionCount}`);

    // Check if devduke has any reading progress
    if (devduke) {
      const readingProgress = await prisma.userProgress.count({
        where: { userId: devduke.id }
      });
      console.log(`   devduke's reading progress entries: ${readingProgress}`);
    }

    // Check AR levels
    const arLevels = await prisma.aR.findMany({
      select: { id: true, name: true }
    });
    console.log(`\n   AR Levels (${arLevels.length} total):`);
    arLevels.forEach(level => {
      console.log(`   - ${level.id}: ${level.name}`);
    });

    // Check RC levels
    const rcLevels = await prisma.rCLevel.findMany({
      select: { id: true, name: true }
    });
    console.log(`\n   RC Levels (${rcLevels.length} total):`);
    rcLevels.forEach(level => {
      console.log(`   - ${level.id}: ${level.name}`);
    });

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifySeededData()
  .then(() => console.log('\n✅ Verification complete!'))
  .catch(console.error);