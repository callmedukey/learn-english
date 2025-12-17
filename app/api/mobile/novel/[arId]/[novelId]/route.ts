import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ arId: string; novelId: string }> }
) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { arId, novelId } = await params;

  try {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: {
        AR: {
          select: {
            id: true,
            level: true,
            score: true,
            stars: true,
            description: true,
          },
        },
        novelChapters: {
          include: {
            novelQuestionSet: {
              select: {
                id: true,
                instructions: true,
                active: true,
                novelQuestions: {
                  select: {
                    id: true,
                    novelQuestionCompleted: {
                      where: {
                        userId: userId,
                      },
                      select: {
                        id: true,
                      },
                    },
                  },
                },
                NovelQuestionFirstTry: {
                  where: {
                    userId: userId,
                  },
                  select: {
                    id: true,
                    totalQuestions: true,
                    correctAnswers: true,
                    createdAt: true,
                  },
                },
                NovelQuestionSecondTry: {
                  where: {
                    userId: userId,
                  },
                  select: {
                    id: true,
                    totalQuestions: true,
                    correctAnswers: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
          orderBy: {
            orderNumber: "asc",
          },
        },
      },
    });

    if (!novel || novel.hidden) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }

    // Verify AR ID matches
    if (novel.ARId !== arId) {
      return NextResponse.json({ error: "Invalid novel context" }, { status: 400 });
    }

    // Transform chapters with progress data
    const chapters = novel.novelChapters.map((chapter) => {
      const totalQuestionsCount =
        chapter.novelQuestionSet?.novelQuestions.length || 0;
      const completedQuestionsCount =
        chapter.novelQuestionSet?.novelQuestions.filter(
          (question) => question.novelQuestionCompleted.length > 0
        ).length || 0;

      const isCompleted =
        totalQuestionsCount > 0 &&
        completedQuestionsCount === totalQuestionsCount;

      const firstTry = chapter.novelQuestionSet?.NovelQuestionFirstTry[0] || null;
      const secondTry = chapter.novelQuestionSet?.NovelQuestionSecondTry[0] || null;

      return {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        orderNumber: chapter.orderNumber,
        isFree: chapter.isFree,
        totalQuestions: totalQuestionsCount,
        completedQuestions: completedQuestionsCount,
        isCompleted,
        hasQuiz: chapter.novelQuestionSet !== null,
        isQuizActive: chapter.novelQuestionSet?.active || false,
        firstTryData: firstTry
          ? {
              totalQuestions: firstTry.totalQuestions,
              correctAnswers: firstTry.correctAnswers,
              createdAt: firstTry.createdAt,
            }
          : null,
        secondTryData: secondTry
          ? {
              totalQuestions: secondTry.totalQuestions,
              correctAnswers: secondTry.correctAnswers,
              createdAt: secondTry.createdAt,
            }
          : null,
      };
    });

    // Calculate overall progress
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter((c) => c.isCompleted).length;
    const freeChapters = chapters.filter((c) => c.isFree).length;
    const progress =
      totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0;

    return NextResponse.json({
      id: novel.id,
      title: novel.title,
      description: novel.description,
      ar: novel.AR,
      chapters,
      totalChapters,
      completedChapters,
      freeChapters,
      progress,
    });
  } catch (error) {
    console.error("Novel Details API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch novel details" },
      { status: 500 }
    );
  }
}
