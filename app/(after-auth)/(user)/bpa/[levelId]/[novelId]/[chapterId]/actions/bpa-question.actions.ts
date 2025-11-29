"use server";

import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { prisma } from "@/prisma/prisma-client";

export interface BPAQuestionCompletionResult {
  success: boolean;
  error?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  explanation?: string;
}

export interface BPAQuizCompletionResult {
  success: boolean;
  error?: string;
  tryNumber?: 1 | 2;
}

export async function saveBPAQuizCompletion(
  questionSetId: string,
  chapterId: string,
  novelId: string,
  levelId: string,
  totalQuestions: number,
  correctAnswers: number,
  userId: string,
): Promise<BPAQuizCompletionResult> {
  try {
    if (
      !questionSetId ||
      !chapterId ||
      !novelId ||
      !levelId ||
      !userId
    ) {
      throw new Error("Missing required fields");
    }

    // Verify the question set belongs to the correct chapter
    const questionSet = await prisma.bPAQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        chapter: {
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
      questionSet.chapter?.id !== chapterId ||
      questionSet.chapter?.novelId !== novelId ||
      questionSet.chapter?.novel.bpaLevelId !== levelId
    ) {
      return { success: false, error: "Invalid question set context" };
    }

    // Check if user has already completed this quiz
    const existingFirstTry = await prisma.bPAQuestionFirstTry.findFirst({
      where: {
        questionSetId: questionSetId,
        userId: userId,
      },
    });

    const existingSecondTry = await prisma.bPAQuestionSecondTry.findFirst({
      where: {
        questionSetId: questionSetId,
        userId: userId,
      },
    });

    let tryNumber: 1 | 2;

    if (!existingFirstTry) {
      // This is the first attempt
      await prisma.bPAQuestionFirstTry.create({
        data: {
          questionSetId: questionSetId,
          userId: userId,
          totalQuestions,
          correctAnswers,
        },
      });
      tryNumber = 1;
    } else if (!existingSecondTry) {
      // This is the second attempt
      await prisma.bPAQuestionSecondTry.create({
        data: {
          questionSetId: questionSetId,
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
    revalidatePath(`/bpa/${levelId}/${novelId}`);

    return {
      success: true,
      tryNumber,
    };
  } catch (error) {
    console.error("Error saving BPA quiz completion:", error);
    return {
      success: false,
      error: "Failed to save quiz completion. Please try again.",
    };
  }
}

export const completeBPAQuestionAction = async (
  questionId: string,
  userId: string,
  selectedAnswer: string,
  isTimedOut: boolean = false,
  isRetry: boolean = false,
): Promise<BPAQuestionCompletionResult> => {
  try {
    // Get the question details
    const question = await prisma.bPAQuestion.findUnique({
      where: { id: questionId },
      include: {
        questionSet: {
          include: {
            chapter: {
              include: {
                unit: true,
                novel: {
                  include: {
                    bpaLevel: true,
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

    // Check if user already has a completion record (should always exist now)
    const existingCompletion = await prisma.bPAQuestionCompleted.findFirst({
      where: {
        questionId: questionId,
        userId: userId,
      },
    });

    if (existingCompletion) {
      // Update existing completion with the actual score
      await prisma.bPAQuestionCompleted.update({
        where: { id: existingCompletion.id },
        data: {
          score: pointsAwarded,
          selectedAnswer: selectedAnswer,
          isCorrect: isCorrect,
          isRetry: isRetry,
          isTimedOut: isTimedOut,
        },
      });
    } else {
      // Fallback: Create completion record if it doesn't exist
      console.warn(
        `BPA Question ${questionId} was not marked as started before submission`,
      );
      await prisma.bPAQuestionCompleted.create({
        data: {
          questionId: questionId,
          userId: userId,
          score: pointsAwarded,
          selectedAnswer: selectedAnswer,
          isCorrect: isCorrect,
          isRetry: isRetry,
          isTimedOut: isTimedOut,
        },
      });
    }

    // Update user's BPA score if points were awarded
    if (pointsAwarded > 0 && question.questionSet.chapter?.novel.bpaLevel) {
      const levelId = question.questionSet.chapter.novel.bpaLevel.id;

      // Use transaction for atomic updates
      await prisma.$transaction(async (tx) => {
        // Get user's ACTUAL level assignment first (not the latest timeframe!)
        // This fixes the bug where users assigned to older timeframes couldn't score
        const levelAssignment = await tx.bPAUserLevelAssignment.findFirst({
          where: {
            userId: userId,
            bpaLevelId: levelId,
          },
          orderBy: {
            assignedAt: "desc", // Most recent assignment for this level
          },
          include: {
            timeframe: true, // Include their actual assigned timeframe
          },
        });

        if (!levelAssignment || !levelAssignment.timeframe) {
          console.warn(
            `No BPA level assignment found for user ${userId} at level ${levelId}, skipping score update`,
          );
          return;
        }

        // Use the user's actual assigned timeframe, not the latest one
        const userTimeframe = levelAssignment.timeframe;

        // Look up the semester based on timeframe + season
        const semester = await tx.bPASemester.findFirst({
          where: {
            timeframeId: userTimeframe.id,
            season: levelAssignment.season,
          },
          select: { id: true },
        });

        // Update BPA score with timeframe and season
        const existingBPAScore = await tx.bPAScore.findFirst({
          where: {
            userId: userId,
            bpaLevelId: levelId,
            timeframeId: userTimeframe.id,
            season: levelAssignment.season,
          },
        });

        if (existingBPAScore) {
          await tx.bPAScore.update({
            where: { id: existingBPAScore.id },
            data: {
              score: {
                increment: pointsAwarded,
              },
              // Backfill semesterId if not set
              ...(semester?.id && !existingBPAScore.semesterId ? { semesterId: semester.id } : {}),
            },
          });
        } else {
          await tx.bPAScore.create({
            data: {
              userId: userId,
              bpaLevelId: levelId,
              timeframeId: userTimeframe.id,
              season: levelAssignment.season,
              semesterId: semester?.id || null,
              score: pointsAwarded,
            },
          });
        }

        // Update MonthlyBPAScore (for monthly leaderboard)
        // Calculate current month/year in Korea timezone
        const now = new Date();
        const koreaTime = toZonedTime(now, APP_TIMEZONE);
        const year = koreaTime.getFullYear();
        const month = koreaTime.getMonth() + 1;

        await tx.monthlyBPAScore.upsert({
          where: {
            userId_bpaLevelId_year_month: {
              userId: userId,
              bpaLevelId: levelId,
              year: year,
              month: month,
            },
          },
          update: {
            score: {
              increment: pointsAwarded,
            },
          },
          create: {
            userId: userId,
            bpaLevelId: levelId,
            year: year,
            month: month,
            score: pointsAwarded,
          },
        });

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
      });
    }

    // Create score transaction for admin tracking (outside transaction)
    if (pointsAwarded !== 0) {
      try {
        const chapter = question.questionSet.chapter;
        const unit = chapter?.unit;
        const novel = chapter?.novel;
        const level = novel?.bpaLevel;

        await prisma.scoreTransaction.create({
          data: {
            userId: userId,
            source: "BPA",
            sourceId: existingCompletion?.id || "",
            score: pointsAwarded,
            levelInfo: level?.name || null,
            novelInfo: novel?.title || null,
            unitInfo: unit?.name || null,
            chapterInfo: chapter?.title || null,
            keywordInfo: null,
            questionText: question.question,
            selectedAnswer: selectedAnswer || null,
            correctAnswer: question.answer,
            isCorrect: isCorrect,
            isRetry: isRetry,
            isTimedOut: isTimedOut,
            explanation: question.explanation,
          },
        });
      } catch (error) {
        // Log error but don't fail the request - score is already saved
        console.error("Failed to create score transaction:", error);
      }
    }

    // Revalidate relevant paths
    revalidatePath(
      `/bpa/${question.questionSet.chapter?.novel.bpaLevelId}/${question.questionSet.chapter?.novelId}`,
    );
    revalidatePath(`/dashboard`);

    return {
      success: true,
      isCorrect,
      pointsAwarded,
      explanation: question.explanation,
    };
  } catch (error) {
    console.error("Failed to complete BPA question:", error);
    return {
      success: false,
      error: "Failed to complete question. Please try again.",
    };
  }
};

export async function markBPAQuestionAsStarted(
  questionId: string,
  novelId: string,
  levelId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!questionId || !novelId || !levelId || !userId) {
      throw new Error("Missing required fields");
    }

    // Check if user already has a completion record for this question
    const existingCompletion = await prisma.bPAQuestionCompleted.findFirst({
      where: {
        questionId: questionId,
        userId: userId,
      },
    });

    // If already exists, don't create a new one
    if (existingCompletion) {
      return { success: true };
    }

    // Verify the question belongs to the correct novel and level
    const question = await prisma.bPAQuestion.findUnique({
      where: { id: questionId },
      include: {
        questionSet: {
          include: {
            chapter: {
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
      question.questionSet?.chapter?.novelId !== novelId ||
      question.questionSet?.chapter?.novel.bpaLevelId !== levelId
    ) {
      return { success: false, error: "Invalid question context" };
    }

    // Create completion record with score 0
    await prisma.bPAQuestionCompleted.create({
      data: {
        questionId: questionId,
        userId: userId,
        score: 0, // Mark as started with 0 score
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking BPA question as started:", error);
    return {
      success: false,
      error: "Failed to mark question as started",
    };
  }
}
