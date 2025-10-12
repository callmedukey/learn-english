"server only";

import { prisma } from "@/prisma/prisma-client";

export interface BPANovelDetailsData {
  id: string;
  title: string;
  description: string | null;
  hidden: boolean;
  bpaLevel: {
    id: string;
    name: string;
    stars: number;
    description: string | null;
  };
  units: {
    id: string;
    name: string;
    description: string | null;
    orderNumber: number;
    chapters: {
      id: string;
      title: string;
      description: string | null;
      orderNumber: number;
      isFree: boolean;
      isCompleted: boolean;
      completedQuestionsCount: number;
      totalQuestionsCount: number;
      firstTryData: {
        totalQuestions: number;
        correctAnswers: number;
        createdAt: Date;
      } | null;
      secondTryData: {
        totalQuestions: number;
        correctAnswers: number;
        createdAt: Date;
      } | null;
      questionSet: {
        id: string;
        instructions: string;
        active: boolean;
      } | null;
    }[];
  }[];
  chapters: {
    id: string;
    title: string;
    description: string | null;
    orderNumber: number;
    isFree: boolean;
    isCompleted: boolean;
    completedQuestionsCount: number;
    totalQuestionsCount: number;
    firstTryData: {
      totalQuestions: number;
      correctAnswers: number;
      createdAt: Date;
    } | null;
    secondTryData: {
      totalQuestions: number;
      correctAnswers: number;
      createdAt: Date;
    } | null;
    questionSet: {
      id: string;
      instructions: string;
      active: boolean;
    } | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export const getBPANovelDetails = async (
  novelId: string,
  userId?: string,
): Promise<BPANovelDetailsData | null> => {
  const novel = await prisma.bPANovel.findUnique({
    where: { id: novelId },
    include: {
      bpaLevel: {
        select: {
          id: true,
          name: true,
          stars: true,
          description: true,
        },
      },
      units: {
        include: {
          chapters: {
            include: {
              questionSet: {
                select: {
                  id: true,
                  instructions: true,
                  active: true,
                  questions: {
                    select: {
                      id: true,
                      completed: userId
                        ? {
                            where: {
                              userId: userId,
                            },
                            select: {
                              id: true,
                            },
                          }
                        : false,
                    },
                  },
                  firstTries: userId
                    ? {
                        where: {
                          userId: userId,
                        },
                        select: {
                          id: true,
                          totalQuestions: true,
                          correctAnswers: true,
                          createdAt: true,
                        },
                      }
                    : false,
                  secondTries: userId
                    ? {
                        where: {
                          userId: userId,
                        },
                        select: {
                          id: true,
                          totalQuestions: true,
                          correctAnswers: true,
                          createdAt: true,
                        },
                      }
                    : false,
                },
              },
            },
            orderBy: {
              orderNumber: "asc",
            },
          },
        },
        orderBy: {
          orderNumber: "asc",
        },
      },
      chapters: {
        include: {
          questionSet: {
            select: {
              id: true,
              instructions: true,
              active: true,
              questions: {
                select: {
                  id: true,
                  completed: userId
                    ? {
                        where: {
                          userId: userId,
                        },
                        select: {
                          id: true,
                        },
                      }
                    : false,
                },
              },
              firstTries: userId
                ? {
                    where: {
                      userId: userId,
                    },
                    select: {
                      id: true,
                      totalQuestions: true,
                      correctAnswers: true,
                      createdAt: true,
                    },
                  }
                : false,
              secondTries: userId
                ? {
                    where: {
                      userId: userId,
                    },
                    select: {
                      id: true,
                      totalQuestions: true,
                      correctAnswers: true,
                      createdAt: true,
                    },
                  }
                : false,
            },
          },
        },
        orderBy: {
          orderNumber: "asc",
        },
      },
    },
  });

  if (!novel || novel.hidden) {
    return null;
  }

  // Helper function to transform chapter data
  const transformChapter = (chapter: any) => {
    const totalQuestionsCount = chapter.questionSet?.questions.length || 0;
    const completedQuestionsCount = userId
      ? chapter.questionSet?.questions.filter(
          (question: any) => question.completed.length > 0,
        ).length || 0
      : 0;

    const isCompleted =
      totalQuestionsCount > 0 &&
      completedQuestionsCount === totalQuestionsCount;

    // Extract first and second try data
    const firstTry = chapter.questionSet?.firstTries[0] || null;
    const secondTry = chapter.questionSet?.secondTries[0] || null;

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      orderNumber: chapter.orderNumber,
      isFree: chapter.isFree,
      isCompleted,
      completedQuestionsCount,
      totalQuestionsCount,
      firstTryData: firstTry
        ? {
            totalQuestions: firstTry.totalQuestions,
            correctAnswers: firstTry.correctAnswers,
            createdAt: firstTry.createdAt,
          }
        : null,
      secondTryData: secondTry
        ? {
            totalQuestions: secondTry.totalQuestions,
            correctAnswers: secondTry.correctAnswers,
            createdAt: secondTry.createdAt,
          }
        : null,
      questionSet: chapter.questionSet
        ? {
            id: chapter.questionSet.id,
            instructions: chapter.questionSet.instructions,
            active: chapter.questionSet.active,
          }
        : null,
    };
  };

  // Transform units with their chapters
  const unitsWithChapters = novel.units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    description: unit.description,
    orderNumber: unit.orderNumber,
    chapters: unit.chapters.map(transformChapter),
  }));

  // Also keep flat chapters list for backward compatibility
  const chaptersWithProgress = novel.chapters.map(transformChapter);

  return {
    id: novel.id,
    title: novel.title,
    description: novel.description,
    hidden: novel.hidden,
    bpaLevel: novel.bpaLevel,
    units: unitsWithChapters,
    chapters: chaptersWithProgress,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
  };
};
