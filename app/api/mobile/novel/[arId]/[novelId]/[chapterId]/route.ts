import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

export type ChapterStatus = "start" | "continue" | "retry";

export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ arId: string; novelId: string; chapterId: string }> }
) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { arId, novelId, chapterId } = await params;

  try {
    const chapter = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: {
          include: {
            AR: {
              select: {
                id: true,
                level: true,
              },
            },
          },
        },
        novelQuestionSet: {
          include: {
            novelQuestions: {
              orderBy: {
                orderNumber: "asc",
              },
              include: {
                novelQuestionCompleted: {
                  where: {
                    userId: userId,
                  },
                  select: {
                    id: true,
                    isCorrect: true,
                    score: true,
                  },
                },
              },
            },
            NovelQuestionFirstTry: {
              where: {
                userId: userId,
              },
            },
            NovelQuestionSecondTry: {
              where: {
                userId: userId,
              },
            },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Verify context
    if (chapter.novelId !== novelId || chapter.novel.ARId !== arId) {
      return NextResponse.json(
        { error: "Invalid chapter context" },
        { status: 400 }
      );
    }

    // Get next chapter
    const nextChapter = await prisma.novelChapter.findFirst({
      where: {
        novelId: novelId,
        orderNumber: {
          gt: chapter.orderNumber,
        },
      },
      orderBy: {
        orderNumber: "asc",
      },
      select: {
        id: true,
        title: true,
        orderNumber: true,
      },
    });

    // Determine chapter status
    const questions = chapter.novelQuestionSet?.novelQuestions || [];
    const hasFirstTry =
      (chapter.novelQuestionSet?.NovelQuestionFirstTry?.length || 0) > 0;
    const hasSecondTry =
      (chapter.novelQuestionSet?.NovelQuestionSecondTry?.length || 0) > 0;

    let status: ChapterStatus = "start";

    if (hasFirstTry && hasSecondTry) {
      status = "retry";
    } else if (hasFirstTry) {
      // Check if all questions completed for second try eligibility
      const allCompleted = questions.every(
        (q) => q.novelQuestionCompleted.length > 0
      );
      if (allCompleted) {
        status = "retry";
      } else {
        // Some questions started but not completed
        const someStarted = questions.some(
          (q) => q.novelQuestionCompleted.length > 0
        );
        status = someStarted ? "continue" : "start";
      }
    } else {
      // No first try
      const someStarted = questions.some(
        (q) => q.novelQuestionCompleted.length > 0
      );
      status = someStarted ? "continue" : "start";
    }

    // Transform questions for response
    const transformedQuestions = questions.map((q) => ({
      id: q.id,
      orderNumber: q.orderNumber,
      question: q.question,
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation,
      score: q.score,
      timeLimit: q.timeLimit,
      isCompleted: q.novelQuestionCompleted.length > 0,
    }));

    return NextResponse.json({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      orderNumber: chapter.orderNumber,
      isFree: chapter.isFree,
      novel: {
        id: chapter.novel.id,
        title: chapter.novel.title,
        arLevel: chapter.novel.AR?.level,
      },
      nextChapter: nextChapter
        ? {
            id: nextChapter.id,
            title: nextChapter.title,
            orderNumber: nextChapter.orderNumber,
          }
        : null,
      questionSet: chapter.novelQuestionSet
        ? {
            id: chapter.novelQuestionSet.id,
            instructions: chapter.novelQuestionSet.instructions,
            active: chapter.novelQuestionSet.active,
            questions: transformedQuestions,
          }
        : null,
      status,
    });
  } catch (error) {
    console.error("Chapter Details API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter details" },
      { status: 500 }
    );
  }
}
