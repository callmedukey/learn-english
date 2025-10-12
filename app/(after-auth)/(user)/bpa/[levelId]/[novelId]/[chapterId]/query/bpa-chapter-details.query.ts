"server only";

import { prisma } from "@/prisma/prisma-client";

export interface BPAChapterDetailsData {
  id: string;
  title: string;
  description: string | null;
  orderNumber: number;
  isFree: boolean;
  novel: {
    id: string;
    title: string;
    bpaLevel: {
      id: string;
      name: string;
      bpaLevelSettings: {
        fontSize: "BASE" | "LARGE" | "XLARGE";
      } | null;
    } | null;
  };
  nextChapter: {
    id: string;
    orderNumber: number;
    title: string;
  } | null;
  questionSet: {
    id: string;
    instructions: string;
    active: boolean;
    questions: {
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

export type BPAChapterStatus = "start" | "continue" | "retry";

export const getBPAChapterDetails = async (
  chapterId: string,
  userId?: string,
): Promise<BPAChapterDetailsData | null> => {
  const chapter = await prisma.bPAChapter.findUnique({
    where: { id: chapterId },
    include: {
      novel: {
        select: {
          id: true,
          title: true,
          bpaLevel: {
            select: {
              id: true,
              name: true,
              bpaLevelSettings: {
                select: {
                  fontSize: true,
                },
              },
            },
          },
        },
      },
      questionSet: {
        select: {
          id: true,
          instructions: true,
          active: true,
          questions: {
            select: {
              id: true,
              orderNumber: true,
              question: true,
              choices: true,
              answer: true,
              explanation: true,
              score: true,
              timeLimit: true,
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
  const nextChapter = await prisma.bPAChapter.findFirst({
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
    chapter.questionSet?.questions.map((question) => ({
      id: question.id,
      orderNumber: question.orderNumber,
      question: question.question,
      choices: question.choices,
      answer: question.answer,
      explanation: question.explanation,
      score: question.score,
      timeLimit: question.timeLimit,
      isCompleted: userId ? question.completed.length > 0 : false,
    })) || [];

  return {
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    orderNumber: chapter.orderNumber,
    isFree: chapter.isFree,
    novel: chapter.novel,
    nextChapter: nextChapter,
    questionSet: chapter.questionSet
      ? {
          id: chapter.questionSet.id,
          instructions: chapter.questionSet.instructions,
          active: chapter.questionSet.active,
          questions: questionsWithCompletion,
        }
      : null,
  };
};

export const getBPAChapterStatus = (
  questions: { isCompleted: boolean }[],
): BPAChapterStatus => {
  if (questions.length === 0) return "start";

  const completedCount = questions.filter((q) => q.isCompleted).length;

  if (completedCount === 0) return "start";
  if (completedCount === questions.length) return "retry";
  return "continue";
};
