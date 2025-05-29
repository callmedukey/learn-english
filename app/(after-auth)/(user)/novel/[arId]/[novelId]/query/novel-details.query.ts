"server only";

import { prisma } from "@/prisma/prisma-client";

export interface NovelDetailsData {
  id: string;
  title: string;
  description: string | null;
  AR: {
    id: string;
    level: string;
    score: string;
    stars: number;
    description: string | null;
  } | null;
  novelChapters: {
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
    novelQuestionSet: {
      id: string;
      instructions: string;
      active: boolean;
    } | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export const getNovelDetails = async (
  novelId: string,
  userId?: string,
): Promise<NovelDetailsData | null> => {
  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      AR: {
        select: {
          id: true,
          level: true,
          score: true,
          stars: true,
          description: true,
        },
      },
      novelChapters: {
        include: {
          novelQuestionSet: {
            select: {
              id: true,
              instructions: true,
              active: true,
              novelQuestions: {
                select: {
                  id: true,
                  novelQuestionCompleted: userId
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
              NovelQuestionFirstTry: userId
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
              NovelQuestionSecondTry: userId
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

  if (!novel) {
    return null;
  }

  // Transform the data to include completion status and try data
  const novelChaptersWithProgress = novel.novelChapters.map((chapter) => {
    const totalQuestionsCount =
      chapter.novelQuestionSet?.novelQuestions.length || 0;
    const completedQuestionsCount = userId
      ? chapter.novelQuestionSet?.novelQuestions.filter(
          (question) => question.novelQuestionCompleted.length > 0,
        ).length || 0
      : 0;

    const isCompleted =
      totalQuestionsCount > 0 &&
      completedQuestionsCount === totalQuestionsCount;

    // Extract first and second try data
    const firstTry = chapter.novelQuestionSet?.NovelQuestionFirstTry[0] || null;
    const secondTry =
      chapter.novelQuestionSet?.NovelQuestionSecondTry[0] || null;

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
      novelQuestionSet: chapter.novelQuestionSet
        ? {
            id: chapter.novelQuestionSet.id,
            instructions: chapter.novelQuestionSet.instructions,
            active: chapter.novelQuestionSet.active,
          }
        : null,
    };
  });

  return {
    id: novel.id,
    title: novel.title,
    description: novel.description,
    AR: novel.AR,
    novelChapters: novelChaptersWithProgress,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
  };
};
