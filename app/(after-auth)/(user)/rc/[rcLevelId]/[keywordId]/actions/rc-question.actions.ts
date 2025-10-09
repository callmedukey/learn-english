"use server";

import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { checkAndCreateRankingNotification } from "@/lib/services/notification.service";
import { prisma } from "@/prisma/prisma-client";

export interface RCQuestionCompletionResult {
  success: boolean;
  error?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  explanation?: string;
}

export interface RCQuizCompletionResult {
  success: boolean;
  error?: string;
  tryNumber?: 1 | 2;
}

export async function markRCQuestionAsStarted(
  questionId: string,
  keywordId: string,
  rcLevelId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionId || !keywordId || !rcLevelId) {
      throw new Error("Missing required fields");
    }

    // Check if user already has a completion record for this question
    const existingCompletion = await prisma.rCQuestionCompleted.findFirst({
      where: {
        RCQuestionId: questionId,
        userId: session.user.id,
      },
    });

    // If already exists, don't create a new one
    if (existingCompletion) {
      return { success: true };
    }

    // Verify the question belongs to the correct keyword and level
    const question = await prisma.rCQuestion.findUnique({
      where: { id: questionId },
      include: {
        RCQuestionSet: {
          include: {
            RCKeyword: true,
          },
        },
      },
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    if (
      question.RCQuestionSet?.RCKeyword?.id !== keywordId ||
      question.RCQuestionSet?.RCKeyword?.rcLevelId !== rcLevelId
    ) {
      return { success: false, error: "Invalid question context" };
    }

    // Create completion record with score 0
    await prisma.rCQuestionCompleted.create({
      data: {
        RCQuestionId: questionId,
        userId: session.user.id,
        score: 0, // Mark as started with 0 score
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking RC question as started:", error);
    return {
      success: false,
      error: "Failed to mark question as started",
    };
  }
}

export async function saveRCQuizCompletion(
  questionSetId: string,
  keywordId: string,
  rcLevelId: string,
  totalQuestions: number,
  correctAnswers: number,
): Promise<RCQuizCompletionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionSetId || !keywordId || !rcLevelId) {
      throw new Error("Missing required fields");
    }

    // Verify the question set belongs to the correct keyword and level
    const questionSet = await prisma.rCQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        RCKeyword: true,
      },
    });

    if (!questionSet) {
      return { success: false, error: "Question set not found" };
    }

    if (
      questionSet.RCKeyword?.id !== keywordId ||
      questionSet.RCKeyword?.rcLevelId !== rcLevelId
    ) {
      return { success: false, error: "Invalid question set context" };
    }

    // Check if user has already completed this quiz
    const existingFirstTry = await prisma.rCQuestionFirstTry.findFirst({
      where: {
        RCQuestionSetId: questionSetId,
        userId: session.user.id,
      },
    });

    const existingSecondTry = await prisma.rCQuestionSecondTry.findFirst({
      where: {
        RCQuestionSetId: questionSetId,
        userId: session.user.id,
      },
    });

    let tryNumber: 1 | 2;

    if (!existingFirstTry) {
      // This is the first attempt
      await prisma.rCQuestionFirstTry.create({
        data: {
          RCQuestionSetId: questionSetId,
          userId: session.user.id,
          totalQuestions,
          correctAnswers,
        },
      });
      tryNumber = 1;
    } else if (!existingSecondTry) {
      // This is the second attempt
      await prisma.rCQuestionSecondTry.create({
        data: {
          RCQuestionSetId: questionSetId,
          userId: session.user.id,
          totalQuestions,
          correctAnswers,
        },
      });
      tryNumber = 2;
    } else {
      // User has already completed both attempts, don't save additional attempts
      return { success: true, tryNumber: 2 };
    }

    // Revalidate the RC level page to update the UI
    revalidatePath(`/rc/${rcLevelId}`);

    return {
      success: true,
      tryNumber,
    };
  } catch (error) {
    console.error("Error saving RC quiz completion:", error);
    return {
      success: false,
      error: "Failed to save quiz completion. Please try again.",
    };
  }
}

export async function submitRCAnswer(
  questionId: string,
  answer: string,
  keywordId: string,
  rcLevelId: string,
  isTimedOut: boolean = false,
  isRetry: boolean = false,
): Promise<RCQuestionCompletionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionId || !keywordId || !rcLevelId) {
      throw new Error("Missing required fields");
    }

    // Get the question details
    const question = await prisma.rCQuestion.findUnique({
      where: { id: questionId },
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
    });

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Verify the question belongs to the correct keyword and level
    if (
      question.RCQuestionSet?.RCKeyword?.id !== keywordId ||
      question.RCQuestionSet?.RCKeyword?.rcLevelId !== rcLevelId
    ) {
      return { success: false, error: "Invalid question context" };
    }

    // Calculate score - same logic as novel quiz
    const isCorrect = answer === question.answer && !isTimedOut;
    const pointsAwarded = isCorrect && !isRetry ? question.score : 0;

    // Check if user already has a completion record (should always exist now)
    const existingCompletion = await prisma.rCQuestionCompleted.findFirst({
      where: {
        RCQuestionId: questionId,
        userId: session.user.id,
      },
    });

    if (existingCompletion) {
      // Update existing completion with the actual score
      await prisma.rCQuestionCompleted.update({
        where: { id: existingCompletion.id },
        data: {
          score: pointsAwarded,
          selectedAnswer: answer,
          isCorrect: isCorrect,
          isRetry: isRetry,
          isTimedOut: isTimedOut,
        },
      });
    } else {
      // Fallback: Create completion record if it doesn't exist
      // This shouldn't happen in normal flow but keeping as safety net
      console.warn(
        `Question ${questionId} was not marked as started before submission`,
      );
      await prisma.rCQuestionCompleted.create({
        data: {
          RCQuestionId: questionId,
          userId: session.user.id,
          score: pointsAwarded,
          selectedAnswer: answer,
          isCorrect: isCorrect,
          isRetry: isRetry,
          isTimedOut: isTimedOut,
        },
      });
    }

    // Only update scores if points were awarded (not retry and correct answer)
    if (pointsAwarded > 0) {
      // Use transaction for atomic updates
      await prisma.$transaction(async (tx) => {
        // Update cumulative RC score
        const existingRCScore = await tx.rCScore.findFirst({
          where: {
            userId: session.user.id,
            RCLevelId: rcLevelId,
          },
        });

        if (existingRCScore) {
          await tx.rCScore.update({
            where: { id: existingRCScore.id },
            data: {
              score: {
                increment: pointsAwarded,
              },
            },
          });
        } else {
          await tx.rCScore.create({
            data: {
              userId: session.user.id,
              RCLevelId: rcLevelId,
              score: pointsAwarded,
            },
          });
        }

        // Update total score
        await tx.totalScore.upsert({
          where: { userId: session.user.id },
          update: {
            score: {
              increment: pointsAwarded,
            },
          },
          create: {
            userId: session.user.id,
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
            levelType: "RC",
            levelId: rcLevelId,
            active: true,
            startDate: { lte: now },
            endDate: { gte: now },
            keywordIds: { has: keywordId },
          },
        });

        // Update monthly score if challenge exists and quiz is part of it
        if (challenge) {
          // Update monthly score for medal tracking
          await tx.monthlyRCScore.upsert({
            where: {
              userId_RCLevelId_year_month: {
                userId: session.user.id,
                RCLevelId: rcLevelId,
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
              userId: session.user.id,
              RCLevelId: rcLevelId,
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
        await checkAndCreateRankingNotification(session.user.id, "rc");
      } catch (error) {
        console.error("Error checking ranking notifications:", error);
        // Don't fail the main action if notification fails
      }
    }

    // Revalidate the current page to update the UI
    revalidatePath(`/rc/${rcLevelId}/${keywordId}`);

    return {
      success: true,
      isCorrect,
      pointsAwarded,
      explanation: question.explanation,
    };
  } catch (error) {
    console.error("Error submitting RC answer:", error);
    return {
      success: false,
      error: "Failed to complete question. Please try again.",
    };
  }
}
