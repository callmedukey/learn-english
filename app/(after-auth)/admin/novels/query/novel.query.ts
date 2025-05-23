"server only";

import { Novel } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface NovelData extends Novel {
  AR: {
    id: string;
    level: string;
  } | null;
  image: {
    imageUrl: string;
    width: number;
    height: number;
  } | null;
  novelQuestionSet: {
    id: string;
    instructions: string;
    _count: {
      novelQuestions: number;
    };
  } | null;
}

export const getNovelsByARLevel = async (
  level: string,
): Promise<NovelData[]> => {
  const novels = await prisma.novel.findMany({
    where: {
      AR: {
        level: level,
      },
    },
    include: {
      AR: {
        select: {
          id: true,
          level: true,
        },
      },
      image: {
        select: {
          imageUrl: true,
          width: true,
          height: true,
        },
      },
      novelQuestionSet: {
        select: {
          id: true,
          instructions: true,
          _count: {
            select: {
              novelQuestions: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return novels;
};

export const getARByLevel = async (level: string) => {
  return await prisma.aR.findFirst({
    where: {
      level: level,
    },
  });
};
