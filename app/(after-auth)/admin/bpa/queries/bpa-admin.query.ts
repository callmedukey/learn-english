"server only";

import { BPALevel, BPASemester, BPATimeframe } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface BPALevelData extends BPALevel {
  novelCount: number;
  questionCount: number;
  bpaLevelSettings?: {
    fontSize: "BASE" | "LARGE" | "XLARGE";
  } | null;
}

/**
 * Fetch all BPA levels with novel count and question count
 */
export const getBPALevels = async (): Promise<BPALevelData[]> => {
  const levelsFromDb = await prisma.bPALevel.findMany({
    include: {
      _count: {
        select: {
          novels: true,
        },
      },
      bpaLevelSettings: true,
      novels: {
        include: {
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
    // Calculate total question count across all novels and chapters
    const questionCount = level.novels.reduce((total, novel) => {
      const novelQuestionCount = novel.chapters.reduce((chapterTotal, chapter) => {
        return chapterTotal + (chapter.questionSet?._count.questions || 0);
      }, 0);
      return total + novelQuestionCount;
    }, 0);

    return {
      ...level,
      novelCount: level._count.novels,
      questionCount,
    };
  });

  return levelsWithCounts;
};

/**
 * Fetch a single BPA level by ID with question count
 */
export const getBPALevelById = async (
  id: string
): Promise<BPALevelData | null> => {
  const level = await prisma.bPALevel.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          novels: true,
        },
      },
      bpaLevelSettings: true,
      novels: {
        include: {
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
  });

  if (!level) {
    return null;
  }

  // Calculate total question count
  const questionCount = level.novels.reduce((total, novel) => {
    const novelQuestionCount = novel.chapters.reduce((chapterTotal, chapter) => {
      return chapterTotal + (chapter.questionSet?._count.questions || 0);
    }, 0);
    return total + novelQuestionCount;
  }, 0);

  return {
    ...level,
    novelCount: level._count.novels,
    questionCount,
  };
};

export interface BPATimeframeWithSemesters extends BPATimeframe {
  semesters: BPASemester[];
}

/**
 * Fetch all BPA timeframes with their semesters
 */
export const getBPATimeframes = async (): Promise<BPATimeframeWithSemesters[]> => {
  return await prisma.bPATimeframe.findMany({
    include: {
      semesters: {
        orderBy: {
          season: "asc",
        },
      },
    },
    orderBy: [
      {
        year: "desc",
      },
      {
        startDate: "desc",
      },
    ],
  });
};

/**
 * Simple query to get all BPA levels for selection
 */
export const getBPALevelsForSelection = async () => {
  return await prisma.bPALevel.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      stars: true,
      orderNumber: true,
    },
    orderBy: {
      orderNumber: "asc",
    },
  });
};
