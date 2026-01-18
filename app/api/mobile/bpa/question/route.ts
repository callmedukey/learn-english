import { toZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

// POST /api/mobile/bpa/question - Handle BPA question actions
export async function POST(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "start":
        return handleStartQuestion(body, userId);
      case "complete":
        return handleCompleteQuestion(body, userId);
      case "quiz-complete":
        return handleQuizComplete(body, userId);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("BPA Question action error:", error);
    return NextResponse.json(
      { error: "Failed to process question action" },
      { status: 500 }
    );
  }
}

// Mark BPA question as started
async function handleStartQuestion(
  body: { questionId: string; novelId: string; levelId: string },
  userId: string
) {
  const { questionId, novelId, levelId } = body;

  if (!questionId || !novelId || !levelId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check if already exists
  const existingCompletion = await prisma.bPAQuestionCompleted.findFirst({
    where: {
      questionId: questionId,
      userId: userId,
    },
  });

  if (existingCompletion) {
    return NextResponse.json({ success: true });
  }

  // Verify question context
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (
    question.questionSet?.chapter?.novelId !== novelId ||
    question.questionSet?.chapter?.novel.bpaLevelId !== levelId
  ) {
    return NextResponse.json(
      { error: "Invalid question context" },
      { status: 400 }
    );
  }

  // Create completion record with score 0
  await prisma.bPAQuestionCompleted.create({
    data: {
      questionId: questionId,
      userId: userId,
      score: 0,
    },
  });

  return NextResponse.json({ success: true });
}

// Complete BPA question with answer
async function handleCompleteQuestion(
  body: {
    questionId: string;
    selectedAnswer: string;
    isTimedOut: boolean;
    isRetry: boolean;
  },
  userId: string
) {
  const { questionId, selectedAnswer, isTimedOut, isRetry } = body;

  if (!questionId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get question details
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = selectedAnswer === question.answer && !isTimedOut;
  const pointsAwarded = isCorrect && !isRetry ? question.score : 0;

  // Update or create completion record
  const existingCompletion = await prisma.bPAQuestionCompleted.findFirst({
    where: {
      questionId: questionId,
      userId: userId,
    },
  });

  if (existingCompletion) {
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

  // Update BPA score if points awarded
  if (pointsAwarded > 0 && question.questionSet.chapter?.novel.bpaLevel) {
    const levelId = question.questionSet.chapter.novel.bpaLevel.id;

    await prisma.$transaction(async (tx) => {
      // Get user's level assignment
      const levelAssignment = await tx.bPAUserLevelAssignment.findFirst({
        where: {
          userId: userId,
          bpaLevelId: levelId,
        },
        orderBy: {
          assignedAt: "desc",
        },
        include: {
          timeframe: true,
        },
      });

      if (!levelAssignment || !levelAssignment.timeframe) {
        console.warn(
          `No BPA level assignment found for user ${userId} at level ${levelId}`
        );
        return;
      }

      const userTimeframe = levelAssignment.timeframe;

      // Look up the semester
      const semester = await tx.bPASemester.findFirst({
        where: {
          timeframeId: userTimeframe.id,
          season: levelAssignment.season,
        },
        select: { id: true },
      });

      // Update BPA score
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
            ...(semester?.id && !existingBPAScore.semesterId
              ? { semesterId: semester.id }
              : {}),
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

      // Update MonthlyBPAScore
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

  // Always create score transaction for admin tracking (including incorrect/retry attempts)
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
    console.error("Failed to create score transaction:", error);
  }

  return NextResponse.json({
    success: true,
    isCorrect,
    pointsAwarded,
    explanation: question.explanation,
  });
}

// Save BPA quiz completion (first/second try)
async function handleQuizComplete(
  body: {
    questionSetId: string;
    chapterId: string;
    novelId: string;
    levelId: string;
    totalQuestions: number;
    correctAnswers: number;
  },
  userId: string
) {
  const {
    questionSetId,
    chapterId,
    novelId,
    levelId,
    totalQuestions,
    correctAnswers,
  } = body;

  if (!questionSetId || !chapterId || !novelId || !levelId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify question set context
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
    return NextResponse.json(
      { error: "Question set not found" },
      { status: 404 }
    );
  }

  if (
    questionSet.chapter?.id !== chapterId ||
    questionSet.chapter?.novelId !== novelId ||
    questionSet.chapter?.novel.bpaLevelId !== levelId
  ) {
    return NextResponse.json(
      { error: "Invalid question set context" },
      { status: 400 }
    );
  }

  // Check existing attempts
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
    return NextResponse.json({ success: true, tryNumber: 2 });
  }

  return NextResponse.json({ success: true, tryNumber });
}
