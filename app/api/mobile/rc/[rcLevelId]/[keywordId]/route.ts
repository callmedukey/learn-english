import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

type QuizStatus = "start" | "continue" | "retry";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ rcLevelId: string; keywordId: string }> }
) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { rcLevelId, keywordId } = await params;

  // Check for status override in query params (for retry)
  const url = new URL(request.url);
  const statusOverride = url.searchParams.get("status") as QuizStatus | null;

  try {
    // Fetch keyword with question set and questions
    const keyword = await prisma.rCKeyword.findUnique({
      where: { id: keywordId },
      include: {
        RCLevel: true,
        RCQuestionSet: {
          include: {
            RCQuestion: {
              orderBy: {
                orderNumber: "asc",
              },
              include: {
                RCQuestionCompleted: {
                  where: {
                    userId: userId,
                  },
                },
              },
            },
            RCQuestionFirstTry: {
              where: {
                userId: userId,
              },
            },
            RCQuestionSecondTry: {
              where: {
                userId: userId,
              },
            },
          },
        },
      },
    });

    if (!keyword) {
      return NextResponse.json(
        { error: "Keyword not found" },
        { status: 404 }
      );
    }

    if (keyword.rcLevelId !== rcLevelId) {
      return NextResponse.json(
        { error: "Invalid keyword context" },
        { status: 400 }
      );
    }

    const questionSet = keyword.RCQuestionSet;

    // Determine quiz status
    let status: QuizStatus = "start";

    if (statusOverride === "retry") {
      status = "retry";
    } else if (questionSet) {
      const hasFirstTry =
        questionSet.RCQuestionFirstTry &&
        questionSet.RCQuestionFirstTry.length > 0;
      const hasSecondTry =
        questionSet.RCQuestionSecondTry &&
        questionSet.RCQuestionSecondTry.length > 0;

      if (hasSecondTry) {
        // Already completed twice, any further is a retry
        status = "retry";
      } else if (hasFirstTry) {
        // Check if user started but didn't finish second try
        const completedQuestions = questionSet.RCQuestion.filter(
          (q) => q.RCQuestionCompleted.length > 0
        ).length;
        const totalQuestions = questionSet.RCQuestion.length;

        if (completedQuestions > 0 && completedQuestions < totalQuestions) {
          status = "continue";
        } else {
          // First try done, second try not started - this is a new second try
          status = "start";
        }
      } else {
        // No first try yet
        const completedQuestions = questionSet.RCQuestion.filter(
          (q) => q.RCQuestionCompleted.length > 0
        ).length;

        if (completedQuestions > 0) {
          status = "continue";
        } else {
          status = "start";
        }
      }
    }

    // Transform questions
    const questions = questionSet?.RCQuestion.map((q) => ({
      id: q.id,
      orderNumber: q.orderNumber,
      question: q.question,
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation,
      score: q.score,
      timeLimit: q.timeLimit,
      isCompleted: q.RCQuestionCompleted.length > 0,
    })) || [];

    return NextResponse.json({
      id: keyword.id,
      keyword: {
        id: keyword.id,
        name: keyword.name,
      },
      rcLevel: {
        id: keyword.RCLevel.id,
        level: keyword.RCLevel.level,
      },
      isFree: keyword.isFree,
      questionSet: questionSet
        ? {
            id: questionSet.id,
            title: questionSet.title,
            passage: questionSet.passage,
            timeLimit: questionSet.timeLimit,
            active: questionSet.active,
            questions,
          }
        : null,
      status,
    });
  } catch (error) {
    console.error("RC Quiz Data API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch RC quiz data" },
      { status: 500 }
    );
  }
}
