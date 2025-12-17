import { NextResponse } from "next/server";

import { canUserAccessNovel } from "@/lib/bpa/access-control";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

interface RouteParams {
  params: Promise<{ levelId: string; novelId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { levelId, novelId } = await params;

  try {
    // Check if user has an assigned campus
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { campusId: true },
    });

    if (!user?.campusId) {
      return NextResponse.json(
        { error: "No campus access" },
        { status: 403 }
      );
    }

    // Check if user can access this novel
    const hasAccess = await canUserAccessNovel(userId, novelId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this novel" },
        { status: 403 }
      );
    }

    // Get the novel with units and chapters
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      include: {
        bpaLevel: {
          select: {
            id: true,
            name: true,
            stars: true,
            description: true,
          },
        },
        units: {
          include: {
            chapters: {
              include: {
                questionSet: {
                  select: {
                    id: true,
                    instructions: true,
                    active: true,
                    questions: {
                      select: {
                        id: true,
                        completed: {
                          where: { userId: userId },
                          select: { id: true },
                        },
                      },
                    },
                    firstTries: {
                      where: { userId: userId },
                      select: {
                        id: true,
                        totalQuestions: true,
                        correctAnswers: true,
                        createdAt: true,
                      },
                    },
                    secondTries: {
                      where: { userId: userId },
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
              orderBy: { orderNumber: "asc" },
            },
          },
          orderBy: { orderNumber: "asc" },
        },
        chapters: {
          include: {
            questionSet: {
              select: {
                id: true,
                instructions: true,
                active: true,
                questions: {
                  select: {
                    id: true,
                    completed: {
                      where: { userId: userId },
                      select: { id: true },
                    },
                  },
                },
                firstTries: {
                  where: { userId: userId },
                  select: {
                    id: true,
                    totalQuestions: true,
                    correctAnswers: true,
                    createdAt: true,
                  },
                },
                secondTries: {
                  where: { userId: userId },
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
          orderBy: { orderNumber: "asc" },
        },
      },
    });

    if (!novel || novel.hidden) {
      return NextResponse.json(
        { error: "Novel not found" },
        { status: 404 }
      );
    }

    // Verify the novel belongs to the specified level
    if (novel.bpaLevelId !== levelId) {
      return NextResponse.json(
        { error: "Novel does not belong to this level" },
        { status: 400 }
      );
    }

    // Helper function to transform chapter data
    const transformChapter = (chapter: any) => {
      const totalQuestions = chapter.questionSet?.questions.length || 0;
      const completedQuestions = chapter.questionSet?.questions.filter(
        (question: any) => question.completed.length > 0
      ).length || 0;

      const isCompleted =
        totalQuestions > 0 && completedQuestions === totalQuestions;

      const firstTry = chapter.questionSet?.firstTries[0] || null;
      const secondTry = chapter.questionSet?.secondTries[0] || null;

      return {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        orderNumber: chapter.orderNumber,
        isFree: chapter.isFree,
        totalQuestions,
        completedQuestions,
        isCompleted,
        hasQuiz: totalQuestions > 0 && chapter.questionSet?.active,
        firstTryData: firstTry
          ? {
              totalQuestions: firstTry.totalQuestions,
              correctAnswers: firstTry.correctAnswers,
              createdAt: firstTry.createdAt.toISOString(),
            }
          : null,
        secondTryData: secondTry
          ? {
              totalQuestions: secondTry.totalQuestions,
              correctAnswers: secondTry.correctAnswers,
              createdAt: secondTry.createdAt.toISOString(),
            }
          : null,
      };
    };

    // Transform units with their chapters
    const units = novel.units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      description: unit.description,
      orderNumber: unit.orderNumber,
      chapters: unit.chapters.map(transformChapter),
    }));

    // Flat chapters list
    const chapters = novel.chapters.map(transformChapter);

    // Calculate progress
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter((c) => c.isCompleted).length;
    const freeChapters = chapters.filter((c) => c.isFree).length;
    const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    return NextResponse.json({
      id: novel.id,
      title: novel.title,
      description: novel.description,
      bpaLevel: novel.bpaLevel,
      units,
      chapters,
      totalChapters,
      completedChapters,
      freeChapters,
      progress,
    });
  } catch (error) {
    console.error("BPA Novel Details API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch novel details" },
      { status: 500 }
    );
  }
}
