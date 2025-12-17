import { prisma } from "../prisma/prisma-client";

const EMAILS_TO_DELETE = [
  "iamdevduke@gmail.com",
  "dukekim47@gmail.com",
  "kbuddies.duke@gmail.com",
];

async function deleteTestUsers() {
  console.log("Starting deletion of test users...\n");

  for (const email of EMAILS_TO_DELETE) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          nickname: true,
          accounts: { select: { provider: true } },
        },
      });

      if (!user) {
        console.log(`[SKIP] User not found: ${email}`);
        continue;
      }

      const providers = user.accounts.map((a) => a.provider).join(", ") || "credentials";

      await prisma.user.delete({
        where: { email },
      });

      console.log(`[DELETED] ${email}`);
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Nickname: ${user.nickname || "N/A"}`);
      console.log(`  - Providers: ${providers}`);
      console.log("");
    } catch (error) {
      console.error(`[ERROR] Failed to delete ${email}:`, error);
    }
  }

  console.log("Done!");
}

deleteTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
