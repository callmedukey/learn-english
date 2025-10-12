"server only";

import { BPALevel, BPANovel } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface BPALevelData extends BPALevel {
  novelCount: number;
  freeChapterCount: number;
  questionCount: number;
}

export interface BPANovelData extends BPANovel {
  bpaLevel: {
    id: string;
    name: string;
  } | null;
  chapters: {
    id: string;
    title: string;
    description: string | null;
    orderNumber: number;
    isFree: boolean;
  }[];
}

export const getBPALevels = async (): Promise<BPALevelData[]> => {
  const levelsFromDb = await prisma.bPALevel.findMany({
    include: {
      _count: {
        select: {
          novels: true,
        },
      },
      novels: {
        include: {
          _count: {
            select: {
              chapters: {
                where: {
                  isFree: true,
                },
              },
            },
          },
          chapters: {
            include: {
              questionSet: {
                include: {
                  _count: {
                    select: {
                      questions: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      orderNumber: "asc",
    },
  });

  const levelsWithCounts: BPALevelData[] = levelsFromDb.map((level) => {
    const freeChapterCount = level.novels.reduce((total, novel) => {
      return total + novel._count.chapters;
    }, 0);

    const questionCount = level.novels.reduce((total, novel) => {
      return (
        total +
        novel.chapters.reduce((chapterTotal, chapter) => {
          return (
            chapterTotal + (chapter.questionSet?._count.questions || 0)
          );
        }, 0)
      );
    }, 0);

    return {
      ...level,
      novelCount: level._count.novels,
      freeChapterCount,
      questionCount,
    };
  });

  return levelsWithCounts;
};

export const getBPALevelById = async (id: string) => {
  return await prisma.bPALevel.findFirst({
    where: {
      id,
    },
  });
};

export const getNovelsByBPALevel = async (levelId: string): Promise<BPANovelData[]> => {
  const novels = await prisma.bPANovel.findMany({
    where: {
      bpaLevelId: levelId,
    },
    include: {
      bpaLevel: {
        select: {
          id: true,
          name: true,
        },
      },
      chapters: {
        select: {
          id: true,
          title: true,
          description: true,
          orderNumber: true,
          isFree: true,
        },
        orderBy: {
          orderNumber: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return novels;
};

export const getBPALevelsForSelection = async () => {
  return await prisma.bPALevel.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      stars: true,
    },
    orderBy: {
      orderNumber: "asc",
    },
  });
};
