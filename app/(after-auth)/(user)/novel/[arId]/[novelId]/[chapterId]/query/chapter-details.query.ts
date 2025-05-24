"server only";

import { prisma } from "@/prisma/prisma-client";

export interface ChapterDetailsData {
  id: string;
  title: string;
  description: string | null;
  orderNumber: number;
  isFree: boolean;
  novel: {
    id: string;
    title: string;
    AR: {
      id: string;
      level: string;
    } | null;
  };
  nextChapter: {
    id: string;
    orderNumber: number;
    title: string;
  } | null;
  novelQuestionSet: {
    id: string;
    instructions: string;
    active: boolean;
    novelQuestions: {
      id: string;
      orderNumber: number;
      question: string;
      choices: string[];
      answer: string;
      explanation: string;
      score: number;
      timeLimit: number;
      isCompleted: boolean;
    }[];
  } | null;
}

export type ChapterStatus = "start" | "continue" | "retry";

export const getChapterDetails = async (
  chapterId: string,
  userId?: string,
): Promise<ChapterDetailsData | null> => {
  const chapter = await prisma.novelChapter.findUnique({
    where: { id: chapterId },
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          AR: {
            select: {
              id: true,
              level: true,
            },
          },
        },
      },
      novelQuestionSet: {
        select: {
          id: true,
          instructions: true,
          active: true,
          novelQuestions: {
            select: {
              id: true,
              orderNumber: true,
              question: true,
              choices: true,
              answer: true,
              explanation: true,
              score: true,
              timeLimit: true,
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
            orderBy: {
              orderNumber: "asc",
            },
          },
        },
      },
    },
  });

  if (!chapter) {
    return null;
  }

  // Get the next chapter
  const nextChapter = await prisma.novelChapter.findFirst({
    where: {
      novelId: chapter.novelId,
      orderNumber: {
        gt: chapter.orderNumber,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      title: true,
    },
    orderBy: {
      orderNumber: "asc",
    },
  });

  // Transform questions to include completion status
  const questionsWithCompletion =
    chapter.novelQuestionSet?.novelQuestions.map((question) => ({
      id: question.id,
      orderNumber: question.orderNumber,
      question: question.question,
      choices: question.choices,
      answer: question.answer,
      explanation: question.explanation,
      score: question.score,
      timeLimit: question.timeLimit,
      isCompleted: userId ? question.novelQuestionCompleted.length > 0 : false,
    })) || [];

  return {
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    orderNumber: chapter.orderNumber,
    isFree: chapter.isFree,
    novel: chapter.novel,
    nextChapter: nextChapter,
    novelQuestionSet: chapter.novelQuestionSet
      ? {
          id: chapter.novelQuestionSet.id,
          instructions: chapter.novelQuestionSet.instructions,
          active: chapter.novelQuestionSet.active,
          novelQuestions: questionsWithCompletion,
        }
      : null,
  };
};

export const getChapterStatus = (
  questions: { isCompleted: boolean }[],
): ChapterStatus => {
  if (questions.length === 0) return "start";

  const completedCount = questions.filter((q) => q.isCompleted).length;

  if (completedCount === 0) return "start";
  if (completedCount === questions.length) return "retry";
  return "continue";
};
