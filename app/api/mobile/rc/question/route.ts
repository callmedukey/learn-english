import { toZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { checkAndCreateRankingNotification } from "@/lib/services/notification.service";
import { prisma } from "@/prisma/prisma-client";

// POST /api/mobile/rc/question - Handle question actions
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
    console.error("RC Question action error:", error);
    return NextResponse.json(
      { error: "Failed to process question action" },
      { status: 500 }
    );
  }
}

// Mark question as started
async function handleStartQuestion(
  body: { questionId: string; keywordId: string; rcLevelId: string },
  userId: string
) {
  const { questionId, keywordId, rcLevelId } = body;

  if (!questionId || !keywordId || !rcLevelId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check if already exists
  const existingCompletion = await prisma.rCQuestionCompleted.findFirst({
    where: {
      RCQuestionId: questionId,
      userId: userId,
    },
  });

  if (existingCompletion) {
    return NextResponse.json({ success: true });
  }

  // Verify question context
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (
    question.RCQuestionSet?.RCKeyword?.id !== keywordId ||
    question.RCQuestionSet?.RCKeyword?.rcLevelId !== rcLevelId
  ) {
    return NextResponse.json(
      { error: "Invalid question context" },
      { status: 400 }
    );
  }

  // Create completion record with score 0
  await prisma.rCQuestionCompleted.create({
    data: {
      RCQuestionId: questionId,
      userId: userId,
      score: 0,
    },
  });

  return NextResponse.json({ success: true });
}

// Complete question with answer
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = selectedAnswer === question.answer && !isTimedOut;
  const pointsAwarded = isCorrect && !isRetry ? question.score : 0;

  // Update or create completion record
  const existingCompletion = await prisma.rCQuestionCompleted.findFirst({
    where: {
      RCQuestionId: questionId,
      userId: userId,
    },
  });

  if (existingCompletion) {
    await prisma.rCQuestionCompleted.update({
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
    await prisma.rCQuestionCompleted.create({
      data: {
        RCQuestionId: questionId,
        userId: userId,
        score: pointsAwarded,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect,
        isRetry: isRetry,
        isTimedOut: isTimedOut,
      },
    });
  }

  // Update scores if points awarded
  if (pointsAwarded > 0 && question.RCQuestionSet?.RCKeyword?.RCLevel) {
    const rcLevelId = question.RCQuestionSet.RCKeyword.RCLevel.id;
    const keywordId = question.RCQuestionSet.RCKeyword.id;

    await prisma.$transaction(async (tx) => {
      // Update cumulative RC score
      const existingRCScore = await tx.rCScore.findFirst({
        where: {
          userId: userId,
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
            userId: userId,
            RCLevelId: rcLevelId,
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

      // Check for active monthly challenge
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

      if (challenge) {
        await tx.monthlyRCScore.upsert({
          where: {
            userId_RCLevelId_year_month: {
              userId: userId,
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
            userId: userId,
            RCLevelId: rcLevelId,
            year: challenge.year,
            month: challenge.month,
            score: pointsAwarded,
            challengeId: challenge.id,
          },
        });
      }
    });

    // Check for ranking notifications
    try {
      await checkAndCreateRankingNotification(userId, "rc");
    } catch (error) {
      console.error("Error checking ranking notifications:", error);
    }
  }

  // Create score transaction
  if (pointsAwarded !== 0) {
    try {
      const keyword = question.RCQuestionSet?.RCKeyword;
      const rcLevel = keyword?.RCLevel;

      await prisma.scoreTransaction.create({
        data: {
          userId: userId,
          source: "RC",
          sourceId: existingCompletion?.id || "",
          score: pointsAwarded,
          levelInfo: rcLevel?.level || null,
          keywordInfo: keyword?.name || null,
          novelInfo: null,
          unitInfo: null,
          chapterInfo: null,
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
  }

  return NextResponse.json({
    success: true,
    isCorrect,
    pointsAwarded,
    explanation: question.explanation,
  });
}

// Save quiz completion (first/second try)
async function handleQuizComplete(
  body: {
    questionSetId: string;
    keywordId: string;
    rcLevelId: string;
    totalQuestions: number;
    correctAnswers: number;
  },
  userId: string
) {
  const { questionSetId, keywordId, rcLevelId, totalQuestions, correctAnswers } =
    body;

  if (!questionSetId || !keywordId || !rcLevelId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify question set context
  const questionSet = await prisma.rCQuestionSet.findUnique({
    where: { id: questionSetId },
    include: {
      RCKeyword: {
        include: {
          RCLevel: true,
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
    questionSet.RCKeyword?.id !== keywordId ||
    questionSet.RCKeyword?.rcLevelId !== rcLevelId
  ) {
    return NextResponse.json(
      { error: "Invalid question set context" },
      { status: 400 }
    );
  }

  // Check existing attempts
  const existingFirstTry = await prisma.rCQuestionFirstTry.findFirst({
    where: {
      RCQuestionSetId: questionSetId,
      userId: userId,
    },
  });

  const existingSecondTry = await prisma.rCQuestionSecondTry.findFirst({
    where: {
      RCQuestionSetId: questionSetId,
      userId: userId,
    },
  });

  let tryNumber: 1 | 2;

  if (!existingFirstTry) {
    await prisma.rCQuestionFirstTry.create({
      data: {
        RCQuestionSetId: questionSetId,
        userId: userId,
        totalQuestions,
        correctAnswers,
      },
    });
    tryNumber = 1;
  } else if (!existingSecondTry) {
    await prisma.rCQuestionSecondTry.create({
      data: {
        RCQuestionSetId: questionSetId,
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
