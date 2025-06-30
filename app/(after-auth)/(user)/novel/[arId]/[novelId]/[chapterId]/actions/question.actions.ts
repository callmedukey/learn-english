"use server";

import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { createUserLevelLock } from "@/actions/level-locks";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { checkAndCreateRankingNotification } from "@/lib/services/notification.service";
import { prisma } from "@/prisma/prisma-client";
import { checkLevelLockPermission } from "@/server-queries/level-locks";

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

    // Debug logging to identify the issue
    console.log('Answer comparison debug:', {
      selectedAnswer,
      questionAnswer: question.answer,
      areEqual: selectedAnswer === question.answer,
      selectedLength: selectedAnswer.length,
      answerLength: question.answer.length,
      choices: question.choices,
      isSelectedInChoices: question.choices.includes(selectedAnswer),
      isTimedOut,
      isRetry,
      questionId: question.id,
    });

    const isCorrect = selectedAnswer === question.answer && !isTimedOut;
    const pointsAwarded = isCorrect && !isRetry ? question.score : 0;
    
    console.log('Score calculation:', {
      isCorrect,
      pointsAwarded,
      questionScore: question.score,
      isRetry,
    });

    // Check if user already has a completion record (should always exist now)
    const existingCompletion = await prisma.novelQuestionCompleted.findFirst({
      where: {
        novelQuestionId: questionId,
        userId: userId,
      },
    });

    if (existingCompletion) {
      // Update existing completion with the actual score
      await prisma.novelQuestionCompleted.update({
        where: { id: existingCompletion.id },
        data: {
          score: pointsAwarded,
        },
      });
    } else {
      // Fallback: Create completion record if it doesn't exist
      // This shouldn't happen in normal flow but keeping as safety net
      console.warn(
        `Question ${questionId} was not marked as started before submission`,
      );
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
      const novelId = question.novelQuestionSet.novelChapter.novel.id;

      // Check level lock permission for monthly scores only
      const lockCheck = await checkLevelLockPermission(userId, "AR", arId);
      
      console.log('Level lock check:', {
        allowed: lockCheck.allowed,
        shouldCreateLock: lockCheck.shouldCreateLock,
        currentLevel: lockCheck.currentLevel,
        arId,
      });
      
      // Use transaction for atomic updates
      await prisma.$transaction(async (tx) => {
        // Create level lock if needed
        if (lockCheck.shouldCreateLock) {
          await createUserLevelLock(userId, "AR", arId);
        }
        // Update cumulative AR score
        const existingARScore = await tx.aRScore.findFirst({
          where: {
            userId: userId,
            ARId: arId,
          },
        });

        if (existingARScore) {
          await tx.aRScore.update({
            where: { id: existingARScore.id },
            data: {
              score: {
                increment: pointsAwarded,
              },
            },
          });
        } else {
          await tx.aRScore.create({
            data: {
              userId: userId,
              ARId: arId,
              score: pointsAwarded,
            },
          });
        }

        // Update total score
        await tx.totalScore.upsert({
          where: { userId: userId },
          update: {
            score: {
              increment: pointsAwarded,
            },
          },
          create: {
            userId: userId,
            score: pointsAwarded,
          },
        });

        // Check for active monthly challenge and update monthly score
        const now = new Date();
        const koreaTime = toZonedTime(now, APP_TIMEZONE);
        const year = koreaTime.getFullYear();
        const month = koreaTime.getMonth() + 1;

        const challenge = await tx.monthlyChallenge.findFirst({
          where: {
            year,
            month,
            levelType: "AR",
            levelId: arId,
            active: true,
            startDate: { lte: now },
            endDate: { gte: now },
            novelIds: { has: novelId },
          },
        });

        // Only update monthly score if user is locked to this level
        if (challenge && lockCheck.allowed) {
          // Update monthly score for medal tracking
          await tx.monthlyARScore.upsert({
            where: {
              userId_ARId_year_month: {
                userId: userId,
                ARId: arId,
                year: challenge.year,
                month: challenge.month,
              },
            },
            update: {
              score: {
                increment: pointsAwarded,
              },
            },
            create: {
              userId: userId,
              ARId: arId,
              year: challenge.year,
              month: challenge.month,
              score: pointsAwarded,
              challengeId: challenge.id,
            },
          });
        }
      });

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

export async function markNovelQuestionAsStarted(
  questionId: string,
  novelId: string,
  arId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!questionId || !novelId || !arId || !userId) {
      throw new Error("Missing required fields");
    }

    // Check if user already has a completion record for this question
    const existingCompletion = await prisma.novelQuestionCompleted.findFirst({
      where: {
        novelQuestionId: questionId,
        userId: userId,
      },
    });

    // If already exists, don't create a new one
    if (existingCompletion) {
      return { success: true };
    }

    // Verify the question belongs to the correct novel and AR
    const question = await prisma.novelQuestion.findUnique({
      where: { id: questionId },
      include: {
        novelQuestionSet: {
          include: {
            novelChapter: {
              include: {
                novel: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    if (
      question.novelQuestionSet?.novelChapter?.novelId !== novelId ||
      question.novelQuestionSet?.novelChapter?.novel.ARId !== arId
    ) {
      return { success: false, error: "Invalid question context" };
    }

    // Create completion record with score 0
    await prisma.novelQuestionCompleted.create({
      data: {
        novelQuestionId: questionId,
        userId: userId,
        score: 0, // Mark as started with 0 score
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking novel question as started:", error);
    return {
      success: false,
      error: "Failed to mark question as started",
    };
  }
}
