import { getUserAccessibleNovels } from '@/lib/bpa/access-control';
import { prisma } from './prisma-client';

async function main() {
  console.log('Testing novel access for test@readingchamp.com\n');

  // Get test user
  const user = await prisma.user.findUnique({
    where: { email: 'test@readingchamp.com' },
  });

  if (!user) {
    console.log('❌ Test user not found!');
    return;
  }

  console.log(`✅ Found user: ${user.email}`);
  console.log(`   ID: ${user.id}\n`);

  // Get user's level assignments
  const assignments = await prisma.bPAUserLevelAssignment.findMany({
    where: { userId: user.id },
    include: {
      bpaLevel: { select: { name: true } },
      semester: { select: { season: true, startDate: true, endDate: true } },
    },
  });

  console.log(`📋 User has ${assignments.length} level assignments:\n`);
  assignments.forEach((a) => {
    console.log(`   Level: ${a.bpaLevel.name}`);
    console.log(`   Season: ${a.season}`);
    if (a.semester) {
      console.log(`   Dates: ${a.semester.startDate.toISOString().split('T')[0]} → ${a.semester.endDate.toISOString().split('T')[0]}`);
    }
    console.log();
  });

  // Test each level
  const levels = await prisma.bPALevel.findMany({
    orderBy: { orderNumber: 'asc' },
  });

  console.log('🔍 Testing access for each level:\n');
  for (const level of levels) {
    const accessibleNovels = await getUserAccessibleNovels(user.id, level.id);
    console.log(`${level.name}: ${accessibleNovels.length} novels accessible`);

    if (accessibleNovels.length > 0) {
      // Get novel titles
      const novels = await prisma.bPANovel.findMany({
        where: { id: { in: accessibleNovels } },
        select: { title: true },
      });
      novels.forEach((n) => console.log(`   - ${n.title}`));
    }
    console.log();
  }
}

main()
  .catch((e) => {
    console.error('Test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
