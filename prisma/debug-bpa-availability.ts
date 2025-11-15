import { getCurrentBPAContext } from '@/actions/bpa/get-current-bpa-context';
import { prisma } from './prisma-client';

async function main() {
  console.log('='.repeat(80));
  console.log('BPA QUIZ AVAILABILITY DEBUGGING');
  console.log('='.repeat(80));
  console.log();

  // 1. Check current BPA context
  console.log('📅 CURRENT BPA CONTEXT');
  console.log('-'.repeat(80));
  const currentContext = await getCurrentBPAContext();
  console.log('Current Context:', JSON.stringify(currentContext, null, 2));
  console.log();

  // 2. Check all timeframes
  console.log('📋 ALL BPA TIMEFRAMES');
  console.log('-'.repeat(80));
  const timeframes = await prisma.bPATimeframe.findMany({
    orderBy: { startDate: 'desc' },
  });

  if (timeframes.length === 0) {
    console.log('❌ NO TIMEFRAMES FOUND!');
  } else {
    const now = new Date();
    timeframes.forEach((tf) => {
      const isActive = now >= tf.startDate && now <= tf.endDate;
      console.log(`${isActive ? '✅ ACTIVE' : '⭕ Inactive'} | ID: ${tf.id} | Year: ${tf.year}`);
      console.log(`   Start: ${tf.startDate.toISOString().split('T')[0]}`);
      console.log(`   End: ${tf.endDate.toISOString().split('T')[0]}`);
      console.log();
    });
  }

  // 3. Check all BPASemester records
  console.log('📚 ALL BPA SEMESTERS');
  console.log('-'.repeat(80));
  const semesters = await prisma.bPASemester.findMany({
    include: {
      timeframe: {
        select: { year: true },
      },
    },
    orderBy: [{ timeframeId: 'desc' }, { season: 'asc' }],
  });

  if (semesters.length === 0) {
    console.log('❌ NO SEMESTERS FOUND!');
    console.log('   → Run: tsx prisma/migrations/populate-bpa-semesters.ts');
  } else {
    const grouped = semesters.reduce((acc, sem) => {
      if (!acc[sem.timeframeId]) acc[sem.timeframeId] = [];
      acc[sem.timeframeId].push(sem);
      return acc;
    }, {} as Record<string, typeof semesters>);

    Object.entries(grouped).forEach(([tfId, sems]) => {
      console.log(`Timeframe: ${sems[0].timeframe.year}`);
      sems.forEach((sem) => {
        const isCurrent =
          currentContext.timeframeId === sem.timeframeId &&
          currentContext.season === sem.season;
        console.log(`   ${isCurrent ? '✅ CURRENT' : '⭕'} ${sem.season} | ID: ${sem.id}`);
      });
      console.log();
    });
  }

  // 4. Check all BPA levels
  console.log('🎯 ALL BPA LEVELS');
  console.log('-'.repeat(80));
  const levels = await prisma.bPALevel.findMany({
    include: {
      _count: {
        select: { novels: true },
      },
    },
    orderBy: { orderNumber: 'asc' },
  });

  if (levels.length === 0) {
    console.log('❌ NO LEVELS FOUND!');
  } else {
    levels.forEach((level) => {
      console.log(`Level: ${level.name} (${level._count.novels} novels)`);
      console.log(`   ID: ${level.id}`);
      console.log();
    });
  }

  // 5. Check user level assignments
  console.log('👤 USER LEVEL ASSIGNMENTS');
  console.log('-'.repeat(80));
  const userAssignments = await prisma.bPAUserLevelAssignment.findMany({
    include: {
      user: {
        select: { email: true },
      },
      bpaLevel: {
        select: { name: true },
      },
      timeframe: {
        select: { year: true },
      },
      semester: {
        select: { season: true },
      },
    },
  });

  if (userAssignments.length === 0) {
    console.log('❌ NO USER ASSIGNMENTS FOUND!');
  } else {
    userAssignments.forEach((assignment) => {
      const isCurrent =
        currentContext.timeframeId === assignment.timeframeId &&
        currentContext.season === assignment.season;

      console.log(`${isCurrent ? '✅ MATCHES CURRENT' : '⭕ Different semester'}`);
      console.log(`   User: ${assignment.user.email}`);
      console.log(`   Level: ${assignment.bpaLevel.name}`);
      console.log(`   Timeframe: ${assignment.timeframe.year}`);
      console.log(`   Season: ${assignment.season}`);
      console.log(`   SemesterId: ${assignment.semesterId || 'NULL ⚠️'}`);
      console.log();
    });
  }

  // 6. Check novel semester assignments
  console.log('📖 NOVEL SEMESTER ASSIGNMENTS');
  console.log('-'.repeat(80));
  const novelAssignments = await prisma.bPANovelSemesterAssignment.findMany({
    include: {
      novel: {
        select: {
          title: true,
          bpaLevelId: true,
          bpaLevel: {
            select: { name: true },
          },
        },
      },
      timeframe: {
        select: { year: true },
      },
      semester: {
        select: { season: true },
      },
    },
  });

  if (novelAssignments.length === 0) {
    console.log('❌ NO NOVEL ASSIGNMENTS FOUND!');
  } else {
    novelAssignments.forEach((assignment) => {
      const isCurrent =
        currentContext.timeframeId === assignment.timeframeId &&
        currentContext.season === assignment.season;

      console.log(`${isCurrent ? '✅ MATCHES CURRENT' : '⭕ Different semester'}`);
      console.log(`   Novel: ${assignment.novel.title}`);
      console.log(`   Level: ${assignment.novel.bpaLevel?.name || 'No level'}`);
      console.log(`   Timeframe: ${assignment.timeframe.year}`);
      console.log(`   Season: ${assignment.season}`);
      console.log(`   SemesterId: ${assignment.semesterId || 'NULL ⚠️'}`);
      console.log();
    });
  }

  // 7. Matching analysis
  console.log('🔍 MATCHING ANALYSIS');
  console.log('-'.repeat(80));

  if (!currentContext.timeframeId || !currentContext.season) {
    console.log('❌ CRITICAL: No current timeframe or season detected!');
    console.log('   This means no timeframe covers today\'s date.');
    console.log('   → Create a timeframe that includes today\'s date');
  } else {
    const matchingUserAssignments = userAssignments.filter(
      (a) => a.timeframeId === currentContext.timeframeId && a.season === currentContext.season
    );
    const matchingNovelAssignments = novelAssignments.filter(
      (a) => a.timeframeId === currentContext.timeframeId && a.season === currentContext.season
    );

    console.log(`Current Semester: ${currentContext.season} in timeframe ${currentContext.timeframeId}`);
    console.log();
    console.log(`✅ User assignments matching current semester: ${matchingUserAssignments.length}`);
    console.log(`✅ Novel assignments matching current semester: ${matchingNovelAssignments.length}`);
    console.log();

    if (matchingUserAssignments.length === 0) {
      console.log('❌ ISSUE: No users assigned to any level for current semester!');
      console.log('   → Assign users to levels via admin panel for current semester');
    }

    if (matchingNovelAssignments.length === 0) {
      console.log('❌ ISSUE: No novels assigned to current semester!');
      console.log('   → Assign novels to current semester via admin panel');
    }

    if (matchingUserAssignments.length > 0 && matchingNovelAssignments.length > 0) {
      console.log('✅ Both user and novel assignments exist for current semester');
      console.log();
      console.log('Checking for level matches:');

      const userLevels = new Set(matchingUserAssignments.map((a) => a.bpaLevelId));
      const novelLevels = new Set(matchingNovelAssignments.map((a) => a.novel.bpaLevelId));

      const matchingLevels = [...userLevels].filter((levelId) => novelLevels.has(levelId));

      if (matchingLevels.length === 0) {
        console.log('❌ ISSUE: Users and novels are assigned to DIFFERENT levels!');
        console.log(`   User levels: ${[...userLevels].join(', ')}`);
        console.log(`   Novel levels: ${[...novelLevels].join(', ')}`);
      } else {
        console.log(`✅ Matching levels found: ${matchingLevels.length}`);
        matchingLevels.forEach((levelId) => {
          const level = levels.find((l) => l.id === levelId);
          const userCount = matchingUserAssignments.filter((a) => a.bpaLevelId === levelId).length;
          const novelCount = matchingNovelAssignments.filter((a) => a.novel.bpaLevelId === levelId).length;
          console.log(`   Level: ${level?.name || levelId} - ${userCount} users, ${novelCount} novels`);
        });
      }
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('END OF DEBUG REPORT');
  console.log('='.repeat(80));
}

main()
  .catch((e) => {
    console.error('Debug script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
