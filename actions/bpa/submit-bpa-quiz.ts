"use server";

import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { prisma } from "@/prisma/prisma-client";

import { getCurrentBPAContext } from "./get-current-bpa-context";

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

/**
 * Mark a BPA question as started (create a placeholder completion record with score 0)
 */
export async function markBPAQuestionAsStarted(
  questionId: string,
  chapterId: string,
  novelId: string,
  levelId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionId || !chapterId || !novelId || !levelId) {
      throw new Error("Missing required fields");
    }

    // Check if user already has a completion record for this question
    const existingCompletion = await prisma.bPAQuestionCompleted.findFirst({
      where: {
        questionId: questionId,
        userId: session.user.id,
      },
    });

    // If already exists, don't create a new one
    if (existingCompletion) {
      return { success: true };
    }

    // Verify the question belongs to the correct chapter/novel/level
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
      question.questionSet?.chapterId !== chapterId ||
      question.questionSet?.chapter?.novelId !== novelId ||
      question.questionSet?.chapter?.novel.bpaLevelId !== levelId
    ) {
      return { success: false, error: "Invalid question context" };
    }

    // Create completion record with score 0
    await prisma.bPAQuestionCompleted.create({
      data: {
        questionId: questionId,
        userId: session.user.id,
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

/**
 * Submit a BPA quiz answer and update scores
 * Awards points to 2 scoreboards: TotalScore and BPAScore
 */
export async function submitBPAAnswer(
  questionId: string,
  answer: string,
  chapterId: string,
  novelId: string,
  levelId: string,
  isTimedOut: boolean = false,
  isRetry: boolean = false,
): Promise<BPAQuestionCompletionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionId || !chapterId || !novelId || !levelId) {
      throw new Error("Missing required fields");
    }

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

    // Verify the question belongs to the correct context
    if (
      question.questionSet?.chapterId !== chapterId ||
      question.questionSet?.chapter?.novelId !== novelId ||
      question.questionSet?.chapter?.novel.bpaLevelId !== levelId
    ) {
      return { success: false, error: "Invalid question context" };
    }

    // Calculate score
    const isCorrect = answer === question.answer && !isTimedOut;
    const pointsAwarded = isCorrect && !isRetry ? question.score : 0;

    // Debug logging
    console.log("BPA Answer submission debug:", {
      selectedAnswer: answer,
      questionAnswer: question.answer,
      isCorrect,
      pointsAwarded,
      questionScore: question.score,
      isRetry,
      isTimedOut,
      questionId: question.id,
    });

    // Check if user already has a completion record (should always exist now)
    const existingCompletion = await prisma.bPAQuestionCompleted.findFirst({
      where: {
        questionId: questionId,
        userId: session.user.id,
      },
    });

    if (existingCompletion) {
      // Update existing completion with the actual score
      await prisma.bPAQuestionCompleted.update({
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
      console.warn(
        `BPA Question ${questionId} was not marked as started before submission`,
      );
      await prisma.bPAQuestionCompleted.create({
        data: {
          questionId: questionId,
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
      // Get current BPA context (timeframe + season)
      const { timeframeId, season } = await getCurrentBPAContext();

      if (!timeframeId || !season) {
        console.warn("No active BPA timeframe/season found, skipping BPAScore update");
      }

      // Use transaction for atomic updates
      await prisma.$transaction(async (tx) => {
        // 1. Update TotalScore (all-time global)
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

        // 2. Update BPAScore (timeframe + season + level specific)
        // Only update if we have a valid timeframe and season
        if (timeframeId && season) {
          // Look up the semester based on timeframe + season
          const semester = await tx.bPASemester.findFirst({
            where: {
              timeframeId: timeframeId,
              season: season,
            },
            select: { id: true },
          });

          const existingBPAScore = await tx.bPAScore.findFirst({
            where: {
              userId: session.user.id,
              bpaLevelId: levelId,
              timeframeId: timeframeId,
              season: season,
            },
          });

          if (existingBPAScore) {
            await tx.bPAScore.update({
              where: { id: existingBPAScore.id },
              data: {
                score: {
                  increment: pointsAwarded,
                },
                // Update semesterId if we found a semester and it's not set
                ...(semester?.id && !existingBPAScore.semesterId ? { semesterId: semester.id } : {}),
              },
            });
          } else {
            await tx.bPAScore.create({
              data: {
                userId: session.user.id,
                bpaLevelId: levelId,
                timeframeId: timeframeId,
                season: season,
                semesterId: semester?.id || null,
                score: pointsAwarded,
              },
            });
          }
        }

        // 3. Update MonthlyBPAScore (for monthly leaderboard)
        // Calculate current month/year in Korea timezone
        const now = new Date();
        const koreaTime = toZonedTime(now, APP_TIMEZONE);
        const year = koreaTime.getFullYear();
        const month = koreaTime.getMonth() + 1;

        console.log("=== MonthlyBPAScore Update START ===");
        console.log("About to upsert MonthlyBPAScore:", {
          userId: session.user.id,
          bpaLevelId: levelId,
          year,
          month,
          pointsAwarded,
          timestamp: new Date().toISOString(),
        });

        try {
          const monthlyResult = await tx.monthlyBPAScore.upsert({
            where: {
              userId_bpaLevelId_year_month: {
                userId: session.user.id,
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
              userId: session.user.id,
              bpaLevelId: levelId,
              year: year,
              month: month,
              score: pointsAwarded,
            },
          });
          console.log("MonthlyBPAScore upsert SUCCESS:", {
            id: monthlyResult.id,
            score: monthlyResult.score,
            created: monthlyResult.createdAt,
            updated: monthlyResult.updatedAt,
          });
        } catch (monthlyError) {
          console.error("!!! MonthlyBPAScore upsert FAILED !!!", monthlyError);
          throw monthlyError; // Re-throw to fail the transaction
        }
        console.log("=== MonthlyBPAScore Update END ===");
      });

      // TODO: Implement BPA-specific ranking notifications
      // For now, BPA doesn't have notification support
      // The notification service would need to be extended to support BPA leaderboards
    }

    // Always create score transaction for admin tracking (including incorrect/retry attempts)
    try {
      const chapter = question.questionSet?.chapter;
      const unit = chapter?.unit;
      const novel = chapter?.novel;
      const level = novel?.bpaLevel;

      await prisma.scoreTransaction.create({
        data: {
          userId: session.user.id,
          source: "BPA",
          sourceId: existingCompletion?.id || "",
          score: pointsAwarded,
          levelInfo: level?.name || null,
          novelInfo: novel?.title || null,
          unitInfo: unit?.name || null,
          chapterInfo: chapter?.title || null,
          keywordInfo: null,
          questionText: question.question,
          selectedAnswer: answer || null,
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

    // Revalidate the current page to update the UI
    revalidatePath(`/bpa/${levelId}/${novelId}/${chapterId}`);
    revalidatePath(`/bpa/${levelId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      isCorrect,
      pointsAwarded,
      explanation: question.explanation,
    };
  } catch (error) {
    console.error("Error submitting BPA answer:", error);
    return {
      success: false,
      error: "Failed to complete question. Please try again.",
    };
  }
}

/**
 * Save BPA quiz completion (first try or second try tracking)
 */
export async function saveBPAQuizCompletion(
  questionSetId: string,
  chapterId: string,
  novelId: string,
  levelId: string,
  totalQuestions: number,
  correctAnswers: number,
): Promise<BPAQuizCompletionResult> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionSetId || !chapterId || !novelId || !levelId) {
      throw new Error("Missing required fields");
    }

    // Verify the question set belongs to the correct chapter/novel/level
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
        userId: session.user.id,
      },
    });

    const existingSecondTry = await prisma.bPAQuestionSecondTry.findFirst({
      where: {
        questionSetId: questionSetId,
        userId: session.user.id,
      },
    });

    let tryNumber: 1 | 2;

    if (!existingFirstTry) {
      // This is the first attempt
      await prisma.bPAQuestionFirstTry.create({
        data: {
          questionSetId: questionSetId,
          userId: session.user.id,
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

    // Revalidate the BPA pages to update the UI
    revalidatePath(`/bpa/${levelId}/${novelId}`);
    revalidatePath(`/bpa/${levelId}`);

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
