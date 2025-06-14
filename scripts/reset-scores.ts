import { prisma } from "@/prisma/prisma-client";

async function resetScores() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        score: {
          upsert: {
            create: {
              score: 0,
            },
            update: {
              score: 0,
            },
          },
        },
        ARScore: {
          deleteMany: {},
        },
        RCScore: {
          deleteMany: {},
        },
        novelQuestionCompleted: {
          deleteMany: {},
        },
        RCQuestionCompleted: {
          deleteMany: {},
        },
        NovelQuestionFirstTry: {
          deleteMany: {},
        },
        NovelQuestionSecondTry: {
          deleteMany: {},
        },
        RCQuestionFirstTry: {
          deleteMany: {},
        },
        RCQuestionSecondTry: {
          deleteMany: {},
        },
        notifications: {
          deleteMany: {},
        },
      },
    });
  }
}

resetScores();
