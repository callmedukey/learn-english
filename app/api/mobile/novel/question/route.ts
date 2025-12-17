import { toZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { checkAndCreateRankingNotification } from "@/lib/services/notification.service";
import { prisma } from "@/prisma/prisma-client";

// POST /api/mobile/novel/question - Handle question actions
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
    console.error("Question action error:", error);
    return NextResponse.json(
      { error: "Failed to process question action" },
      { status: 500 }
    );
  }
}

// Mark question as started
async function handleStartQuestion(
  body: { questionId: string; novelId: string; arId: string },
  userId: string
) {
  const { questionId, novelId, arId } = body;

  if (!questionId || !novelId || !arId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Check if already exists
  const existingCompletion = await prisma.novelQuestionCompleted.findFirst({
    where: {
      novelQuestionId: questionId,
      userId: userId,
    },
  });

  if (existingCompletion) {
    return NextResponse.json({ success: true });
  }

  // Verify question context
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  if (
    question.novelQuestionSet?.novelChapter?.novelId !== novelId ||
    question.novelQuestionSet?.novelChapter?.novel.ARId !== arId
  ) {
    return NextResponse.json(
      { error: "Invalid question context" },
      { status: 400 }
    );
  }

  // Create completion record with score 0
  await prisma.novelQuestionCompleted.create({
    data: {
      novelQuestionId: questionId,
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = selectedAnswer === question.answer && !isTimedOut;
  const pointsAwarded = isCorrect && !isRetry ? question.score : 0;

  // Update or create completion record
  const existingCompletion = await prisma.novelQuestionCompleted.findFirst({
    where: {
      novelQuestionId: questionId,
      userId: userId,
    },
  });

  if (existingCompletion) {
    await prisma.novelQuestionCompleted.update({
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
    await prisma.novelQuestionCompleted.create({
      data: {
        novelQuestionId: questionId,
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
  if (
    pointsAwarded > 0 &&
    question.novelQuestionSet?.novelChapter?.novel.AR
  ) {
    const arId = question.novelQuestionSet.novelChapter.novel.AR.id;
    const novelId = question.novelQuestionSet.novelChapter.novel.id;

    await prisma.$transaction(async (tx) => {
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

      // Check for active monthly challenge
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

      if (challenge) {
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

    // Check for ranking notifications
    try {
      await checkAndCreateRankingNotification(userId, "novel");
    } catch (error) {
      console.error("Error checking ranking notifications:", error);
    }
  }

  // Create score transaction
  if (pointsAwarded !== 0) {
    try {
      const chapter = question.novelQuestionSet?.novelChapter;
      const novel = chapter?.novel;
      const ar = novel?.AR;

      await prisma.scoreTransaction.create({
        data: {
          userId: userId,
          source: "Novel",
          sourceId: existingCompletion?.id || "",
          score: pointsAwarded,
          levelInfo: ar?.level || null,
          novelInfo: novel?.title || null,
          unitInfo: null,
          chapterInfo: chapter ? `Chapter ${chapter.orderNumber}` : null,
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
    chapterId: string;
    novelId: string;
    arId: string;
    totalQuestions: number;
    correctAnswers: number;
  },
  userId: string
) {
  const { questionSetId, chapterId, novelId, arId, totalQuestions, correctAnswers } =
    body;

  if (!questionSetId || !chapterId || !novelId || !arId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Verify question set context
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
    return NextResponse.json(
      { error: "Question set not found" },
      { status: 404 }
    );
  }

  if (
    questionSet.novelChapter?.id !== chapterId ||
    questionSet.novelChapter?.novelId !== novelId ||
    questionSet.novelChapter?.novel.ARId !== arId
  ) {
    return NextResponse.json(
      { error: "Invalid question set context" },
      { status: 400 }
    );
  }

  // Check existing attempts
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
    return NextResponse.json({ success: true, tryNumber: 2 });
  }

  return NextResponse.json({ success: true, tryNumber });
}
