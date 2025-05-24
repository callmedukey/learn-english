"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export interface QuestionCompletionResult {
  success: boolean;
  error?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  explanation?: string;
}

export const completeQuestionAction = async (
  questionId: string,
  userId: string,
  selectedAnswer: string,
  isTimedOut: boolean = false,
  isRetry: boolean = false,
): Promise<QuestionCompletionResult> => {
  try {
    // Get the question details
    const question = await prisma.novelQuestion.findUnique({
      where: { id: questionId },
      include: {
        novelQuestionSet: {
          include: {
            novelChapter: {
              include: {
                novel: {
                  include: {
                    AR: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const isCorrect = selectedAnswer === question.answer && !isTimedOut;
    const pointsAwarded = isCorrect && !isRetry ? question.score : 0;

    // Check if user has already completed this question
    const existingCompletion = await prisma.novelQuestionCompleted.findFirst({
      where: {
        novelQuestionId: questionId,
        userId: userId,
      },
    });

    if (existingCompletion) {
      // Update existing completion (for retry scenarios)
      await prisma.novelQuestionCompleted.update({
        where: { id: existingCompletion.id },
        data: {
          score: pointsAwarded,
        },
      });
    } else {
      // Create new completion record
      await prisma.novelQuestionCompleted.create({
        data: {
          novelQuestionId: questionId,
          userId: userId,
          score: pointsAwarded,
        },
      });
    }

    // Update user's AR score if points were awarded
    if (pointsAwarded > 0 && question.novelQuestionSet.novelChapter?.novel.AR) {
      const arId = question.novelQuestionSet.novelChapter.novel.AR.id;

      // Find or create AR score record
      const existingARScore = await prisma.aRScore.findFirst({
        where: {
          userId: userId,
          ARId: arId,
        },
      });

      if (existingARScore) {
        await prisma.aRScore.update({
          where: { id: existingARScore.id },
          data: {
            score: {
              increment: pointsAwarded,
            },
          },
        });
      } else {
        await prisma.aRScore.create({
          data: {
            userId: userId,
            ARId: arId,
            score: pointsAwarded,
          },
        });
      }

      // Update total score
      const existingTotalScore = await prisma.totalScore.findUnique({
        where: { userId: userId },
      });

      if (existingTotalScore) {
        await prisma.totalScore.update({
          where: { userId: userId },
          data: {
            score: {
              increment: pointsAwarded,
            },
          },
        });
      } else {
        await prisma.totalScore.create({
          data: {
            userId: userId,
            score: pointsAwarded,
          },
        });
      }
    }

    // Revalidate relevant paths
    revalidatePath(
      `/novel/${question.novelQuestionSet.novelChapter?.novel.ARId}/${question.novelQuestionSet.novelChapter?.novelId}`,
    );
    revalidatePath(`/dashboard`);

    return {
      success: true,
      isCorrect,
      pointsAwarded,
      explanation: question.explanation,
    };
  } catch (error) {
    console.error("Failed to complete question:", error);
    return {
      success: false,
      error: "Failed to complete question. Please try again.",
    };
  }
};
