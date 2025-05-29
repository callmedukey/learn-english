"use server";

import { revalidatePath } from "next/cache";

import { checkAndCreateRankingNotification } from "@/lib/services/notification.service";
import { prisma } from "@/prisma/prisma-client";

export interface QuestionCompletionResult {
  success: boolean;
  error?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  explanation?: string;
}

export interface NovelQuizCompletionResult {
  success: boolean;
  error?: string;
  tryNumber?: 1 | 2;
}

export async function saveNovelQuizCompletion(
  questionSetId: string,
  chapterId: string,
  novelId: string,
  arId: string,
  totalQuestions: number,
  correctAnswers: number,
  userId: string,
): Promise<NovelQuizCompletionResult> {
  try {
    if (!questionSetId || !chapterId || !novelId || !arId || !userId) {
      throw new Error("Missing required fields");
    }

    // Verify the question set belongs to the correct chapter
    const questionSet = await prisma.novelQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        novelChapter: {
          include: {
            novel: true,
          },
        },
      },
    });

    if (!questionSet) {
      return { success: false, error: "Question set not found" };
    }

    if (
      questionSet.novelChapter?.id !== chapterId ||
      questionSet.novelChapter?.novelId !== novelId ||
      questionSet.novelChapter?.novel.ARId !== arId
    ) {
      return { success: false, error: "Invalid question set context" };
    }

    // Check if user has already completed this quiz
    const existingFirstTry = await prisma.novelQuestionFirstTry.findFirst({
      where: {
        novelQuestionSetId: questionSetId,
        userId: userId,
      },
    });

    const existingSecondTry = await prisma.novelQuestionSecondTry.findFirst({
      where: {
        novelQuestionSetId: questionSetId,
        userId: userId,
      },
    });

    let tryNumber: 1 | 2;

    if (!existingFirstTry) {
      // This is the first attempt
      await prisma.novelQuestionFirstTry.create({
        data: {
          novelQuestionSetId: questionSetId,
          userId: userId,
          totalQuestions,
          correctAnswers,
        },
      });
      tryNumber = 1;
    } else if (!existingSecondTry) {
      // This is the second attempt
      await prisma.novelQuestionSecondTry.create({
        data: {
          novelQuestionSetId: questionSetId,
          userId: userId,
          totalQuestions,
          correctAnswers,
        },
      });
      tryNumber = 2;
    } else {
      // User has already completed both attempts, don't save additional attempts
      return { success: true, tryNumber: 2 };
    }

    // Revalidate the novel page to update the UI
    revalidatePath(`/novel/${arId}/${novelId}`);

    return {
      success: true,
      tryNumber,
    };
  } catch (error) {
    console.error("Error saving novel quiz completion:", error);
    return {
      success: false,
      error: "Failed to save quiz completion. Please try again.",
    };
  }
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

      // Check for ranking achievements and create notifications
      try {
        await checkAndCreateRankingNotification(userId, "novel");
      } catch (error) {
        console.error("Error checking ranking notifications:", error);
        // Don't fail the main action if notification fails
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
