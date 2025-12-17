import { NextResponse } from "next/server";

import { canUserAccessNovel } from "@/lib/bpa/access-control";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

interface RouteParams {
  params: Promise<{ levelId: string; novelId: string; chapterId: string }>;
}

type ChapterStatus = "start" | "continue" | "retry";

function getChapterStatus(
  questions: { isCompleted: boolean }[],
  overrideStatus?: string
): ChapterStatus {
  if (overrideStatus === "retry") return "retry";

  if (questions.length === 0) return "start";

  const completedCount = questions.filter((q) => q.isCompleted).length;

  if (completedCount === 0) return "start";
  if (completedCount === questions.length) return "retry";
  return "continue";
}

export async function GET(request: Request, { params }: RouteParams) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { levelId, novelId, chapterId } = await params;

  // Parse query params
  const url = new URL(request.url);
  const statusOverride = url.searchParams.get("status");

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

    // Get the chapter with questions
    const chapter = await prisma.bPAChapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: {
          select: {
            id: true,
            title: true,
            bpaLevelId: true,
          },
        },
        questionSet: {
          select: {
            id: true,
            instructions: true,
            active: true,
            questions: {
              select: {
                id: true,
                orderNumber: true,
                question: true,
                choices: true,
                answer: true,
                explanation: true,
                score: true,
                timeLimit: true,
                completed: {
                  where: { userId: userId },
                  select: { id: true },
                },
              },
              orderBy: { orderNumber: "asc" },
            },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Verify the chapter belongs to the specified novel and level
    if (chapter.novelId !== novelId || chapter.novel.bpaLevelId !== levelId) {
      return NextResponse.json(
        { error: "Chapter does not belong to this novel/level" },
        { status: 400 }
      );
    }

    // Get the next chapter
    const nextChapter = await prisma.bPAChapter.findFirst({
      where: {
        novelId: chapter.novelId,
        orderNumber: {
          gt: chapter.orderNumber,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        title: true,
      },
      orderBy: {
        orderNumber: "asc",
      },
    });

    // Transform questions to include completion status
    const questionsWithCompletion =
      chapter.questionSet?.questions.map((question) => ({
        id: question.id,
        orderNumber: question.orderNumber,
        question: question.question,
        choices: question.choices,
        answer: question.answer,
        explanation: question.explanation,
        score: question.score,
        timeLimit: question.timeLimit,
        isCompleted: question.completed.length > 0,
      })) || [];

    // Determine chapter status
    const status = getChapterStatus(
      questionsWithCompletion,
      statusOverride || undefined
    );

    return NextResponse.json({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      orderNumber: chapter.orderNumber,
      isFree: chapter.isFree,
      novel: {
        id: chapter.novel.id,
        title: chapter.novel.title,
        bpaLevelId: chapter.novel.bpaLevelId,
      },
      nextChapter: nextChapter
        ? {
            id: nextChapter.id,
            title: nextChapter.title,
            orderNumber: nextChapter.orderNumber,
          }
        : null,
      questionSet: chapter.questionSet
        ? {
            id: chapter.questionSet.id,
            instructions: chapter.questionSet.instructions,
            active: chapter.questionSet.active,
            questions: questionsWithCompletion,
          }
        : null,
      status,
    });
  } catch (error) {
    console.error("BPA Chapter Quiz API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter quiz data" },
      { status: 500 }
    );
  }
}
