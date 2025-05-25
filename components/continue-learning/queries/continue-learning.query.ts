"server only";

import { prisma } from "@/prisma/prisma-client";

export interface NovelProgress {
  novel: {
    id: string;
    title: string;
    ARId?: string | null;
    image?: {
      imageUrl: string;
    } | null;
    AR?: {
      level: string;
    } | null;
  };
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  lastUpdated: Date;
}

export interface RCProgress {
  keyword: {
    id: string;
    name: string;
    RCLevel: {
      id: string;
      level: string;
    };
  };
  lastUpdated: Date;
}

export interface ContinueLearningData {
  novelProgress: NovelProgress | null;
  rcProgress: RCProgress | null;
}

export async function getContinueLearningData(
  userId: string,
): Promise<ContinueLearningData> {
  // Get the most recent novel progress
  const latestNovelProgress = await prisma.novelQuestionCompleted.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      novelQuestion: {
        include: {
          novelQuestionSet: {
            include: {
              novelChapter: {
                include: {
                  novel: {
                    include: {
                      image: true,
                      AR: true,
                      novelChapters: {
                        select: {
                          id: true,
                        },
                      },
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

  let novelProgress: NovelProgress | null = null;

  if (
    latestNovelProgress?.novelQuestion.novelQuestionSet?.novelChapter?.novel
  ) {
    const novel =
      latestNovelProgress.novelQuestion.novelQuestionSet.novelChapter.novel;

    // Get all completed chapters for this novel by this user
    const completedChapters = await prisma.novelQuestionCompleted.findMany({
      where: {
        userId,
        novelQuestion: {
          novelQuestionSet: {
            novelChapter: {
              novelId: novel.id,
            },
          },
        },
      },
      include: {
        novelQuestion: {
          include: {
            novelQuestionSet: {
              select: {
                novelChapterId: true,
              },
            },
          },
        },
      },
    });

    // Get unique chapter IDs that have been completed
    const uniqueCompletedChapterIds = new Set(
      completedChapters
        .map((c) => c.novelQuestion.novelQuestionSet?.novelChapterId)
        .filter(Boolean),
    );

    const totalChapters = novel.novelChapters.length;
    const completedChaptersCount = uniqueCompletedChapterIds.size;
    const progressPercentage =
      totalChapters > 0
        ? Math.round((completedChaptersCount / totalChapters) * 100)
        : 0;

    novelProgress = {
      novel: {
        id: novel.id,
        title: novel.title,
        ARId: novel.ARId,
        image: novel.image,
        AR: novel.AR,
      },
      totalChapters,
      completedChapters: completedChaptersCount,
      progressPercentage,
      lastUpdated: latestNovelProgress.updatedAt,
    };
  }

  // Get the most recent RC progress
  const latestRCProgress = await prisma.rCQuestionCompleted.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      RCQuestion: {
        include: {
          RCQuestionSet: {
            include: {
              RCKeyword: {
                include: {
                  RCLevel: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let rcProgress: RCProgress | null = null;

  if (latestRCProgress?.RCQuestion.RCQuestionSet?.RCKeyword) {
    const keyword = latestRCProgress.RCQuestion.RCQuestionSet.RCKeyword;

    rcProgress = {
      keyword: {
        id: keyword.id,
        name: keyword.name,
        RCLevel: keyword.RCLevel,
      },
      lastUpdated: latestRCProgress.updatedAt,
    };
  }

  return {
    novelProgress,
    rcProgress,
  };
}
