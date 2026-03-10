import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Setting all content to paid (isFree = false)...\n");

  // 1. Update NovelChapters
  const novelResult = await prisma.novelChapter.updateMany({
    where: { isFree: true },
    data: { isFree: false },
  });
  console.log(`NovelChapter: ${novelResult.count} chapters updated`);

  // 2. Update RCKeywords
  const rcResult = await prisma.rCKeyword.updateMany({
    where: { isFree: true },
    data: { isFree: false },
  });
  console.log(`RCKeyword: ${rcResult.count} keywords updated`);

  // 3. Update BPAChapters
  const bpaResult = await prisma.bPAChapter.updateMany({
    where: { isFree: true },
    data: { isFree: false },
  });
  console.log(`BPAChapter: ${bpaResult.count} chapters updated`);

  console.log("\nDone!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
