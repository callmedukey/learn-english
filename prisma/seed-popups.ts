import { PrismaClient } from "@/prisma/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting popup seed...");

  // Get current date info
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // Create MonthlyChallenge records for last month
  const arLevels = await prisma.aR.findMany({ take: 3 });
  const rcLevels = await prisma.rCLevel.findMany({ take: 3 });

  // Get some users for winners
  const users = await prisma.user.findMany();
  
  if (users.length < 3) {
    console.error("Not enough users. Please ensure you have at least 3 users in the database.");
    return;
  }
  
  // Find devduke specifically to ensure they get data
  const devduke = await prisma.user.findUnique({ 
    where: { email: "iamdevduke@gmail.com" } 
  });
  
  console.log(`Found ${users.length} users. Will distribute them across levels.`);
  if (devduke) {
    console.log(`Found devduke user: ${devduke.nickname}`);
  }

  // Create challenges and leaderboards for last month
  for (let i = 0; i < Math.min(3, arLevels.length); i++) {
    const ar = arLevels[i];
    
    // Create challenge
    const challenge = await prisma.monthlyChallenge.upsert({
      where: {
        year_month_levelType_levelId: {
          year: lastMonthYear,
          month: lastMonth,
          levelType: "AR",
          levelId: ar.id,
        },
      },
      update: {},
      create: {
        year: lastMonthYear,
        month: lastMonth,
        levelType: "AR",
        levelId: ar.id,
        active: false, // Set to false since it's last month
        startDate: new Date(lastMonthYear, lastMonth - 1, 1),
        endDate: new Date(lastMonthYear, lastMonth, 0, 23, 59, 59),
        novelIds: [],
        keywordIds: [],
      },
    });

    // Create monthly scores for some users (reuse users if not enough)
    const userIndex = i % users.length;
    const scoreUsers = users.length >= 3 ? users.slice(0, 3) : [...users, ...users, ...users].slice(0, 3);
    
    // Ensure devduke always has a score (4th place)
    if (devduke && !scoreUsers.find(u => u.id === devduke.id)) {
      await prisma.monthlyARScore.upsert({
        where: {
          userId_ARId_year_month: {
            userId: devduke.id,
            ARId: ar.id,
            year: lastMonthYear,
            month: lastMonth,
          },
        },
        update: {},
        create: {
          userId: devduke.id,
          ARId: ar.id,
          year: lastMonthYear,
          month: lastMonth,
          score: 700, // 4th place
          challengeId: challenge.id,
        },
      });
    }
    
    for (let j = 0; j < Math.min(3, scoreUsers.length); j++) {
      await prisma.monthlyARScore.upsert({
        where: {
          userId_ARId_year_month: {
            userId: scoreUsers[j].id,
            ARId: ar.id,
            year: lastMonthYear,
            month: lastMonth,
          },
        },
        update: {},
        create: {
          userId: scoreUsers[j].id,
          ARId: ar.id,
          year: lastMonthYear,
          month: lastMonth,
          score: 1000 - (j * 100), // Gold: 1000, Silver: 900, Bronze: 800
          challengeId: challenge.id,
        },
      });
    }

    // Create leaderboard
    await prisma.monthlyLeaderboard.upsert({
      where: {
        challengeId: challenge.id,
      },
      update: {},
      create: {
        challengeId: challenge.id,
        year: lastMonthYear,
        month: lastMonth,
        levelType: "AR",
        levelId: ar.id,
        goldUserId: scoreUsers[0].id,
        goldScore: 1000,
        silverUserId: scoreUsers[1].id,
        silverScore: 900,
        bronzeUserId: scoreUsers[2].id,
        bronzeScore: 800,
        finalized: true,
      },
    });

    // Level locks have been removed from the system
    // Users no longer need to be locked to levels
  }

  // Similar for RC levels
  for (let i = 0; i < Math.min(3, rcLevels.length); i++) {
    const rc = rcLevels[i];
    
    const challenge = await prisma.monthlyChallenge.upsert({
      where: {
        year_month_levelType_levelId: {
          year: lastMonthYear,
          month: lastMonth,
          levelType: "RC",
          levelId: rc.id,
        },
      },
      update: {},
      create: {
        year: lastMonthYear,
        month: lastMonth,
        levelType: "RC",
        levelId: rc.id,
        active: false,
        startDate: new Date(lastMonthYear, lastMonth - 1, 1),
        endDate: new Date(lastMonthYear, lastMonth, 0, 23, 59, 59),
        novelIds: [],
        keywordIds: [],
      },
    });

    const scoreUsers = users.length >= 3 ? users.slice(0, 3) : [...users, ...users, ...users].slice(0, 3);
    
    // Ensure devduke always has a score (4th place)
    if (devduke && !scoreUsers.find(u => u.id === devduke.id)) {
      await prisma.monthlyRCScore.upsert({
        where: {
          userId_RCLevelId_year_month: {
            userId: devduke.id,
            RCLevelId: rc.id,
            year: lastMonthYear,
            month: lastMonth,
          },
        },
        update: {},
        create: {
          userId: devduke.id,
          RCLevelId: rc.id,
          year: lastMonthYear,
          month: lastMonth,
          score: 700, // 4th place
          challengeId: challenge.id,
        },
      });
    }
    
    for (let j = 0; j < scoreUsers.length; j++) {
      await prisma.monthlyRCScore.upsert({
        where: {
          userId_RCLevelId_year_month: {
            userId: scoreUsers[j].id,
            RCLevelId: rc.id,
            year: lastMonthYear,
            month: lastMonth,
          },
        },
        update: {},
        create: {
          userId: scoreUsers[j].id,
          RCLevelId: rc.id,
          year: lastMonthYear,
          month: lastMonth,
          score: 1000 - (j * 100),
          challengeId: challenge.id,
        },
      });
    }

    await prisma.monthlyLeaderboard.upsert({
      where: {
        challengeId: challenge.id,
      },
      update: {},
      create: {
        challengeId: challenge.id,
        year: lastMonthYear,
        month: lastMonth,
        levelType: "RC",
        levelId: rc.id,
        goldUserId: scoreUsers[0].id,
        goldScore: 1000,
        silverUserId: scoreUsers[1].id,
        silverScore: 900,
        bronzeUserId: scoreUsers[2].id,
        bronzeScore: 800,
        finalized: true,
      },
    });

    // Level locks have been removed from the system
  }

  // Create popup records
  const globalWinnersPopup = await prisma.monthlyPopup.create({
    data: {
      year: lastMonthYear,
      month: lastMonth,
      type: "GLOBAL_WINNERS",
      title: `${getMonthName(lastMonth)} ${lastMonthYear} Winners`,
      content: "Congratulations to all our monthly winners!",
      displayFrom: new Date(), // Show immediately
      displayUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Show for 30 days
      active: true,
    },
  });

  const personalAchievementPopup = await prisma.monthlyPopup.create({
    data: {
      year: lastMonthYear,
      month: lastMonth,
      type: "PERSONAL_ACHIEVEMENT",
      title: `Your ${getMonthName(lastMonth)} ${lastMonthYear} Achievement`,
      content: "View your personal rankings for last month",
      displayFrom: new Date(), // Show immediately
      displayUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Show for 30 days
      active: true,
    },
  });

  console.log("Created popups:", {
    globalWinnersPopup: globalWinnersPopup.id,
    personalAchievementPopup: personalAchievementPopup.id,
  });

  console.log("Popup seed completed!");
}

function getMonthName(month: number): string {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return monthNames[month - 1];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });