import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const arChoices = await prisma.aR.findMany({
      include: {
        novels: {
          where: {
            hidden: false,
          },
          include: {
            novelChapters: {
              include: {
                novelQuestionSet: {
                  include: {
                    novelQuestions: {
                      include: {
                        novelQuestionCompleted: {
                          where: {
                            userId: userId,
                          },
                          select: {
                            userId: true,
                          },
                        },
                      },
                    },
                    NovelQuestionFirstTry: {
                      where: {
                        userId: userId,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        stars: "asc",
      },
    });

    // Fetch medal images for each AR level
    const medalImages = await prisma.medalImage.findMany({
      where: {
        levelType: "AR",
        levelId: {
          in: arChoices.map((ar) => ar.id),
        },
      },
    });

    // Create a map for easy lookup
    const medalImageMap = new Map<
      string,
      { medalType: string; imageUrl: string }[]
    >();
    medalImages.forEach((medalImage) => {
      const key = medalImage.levelId;
      if (!medalImageMap.has(key)) {
        medalImageMap.set(key, []);
      }
      medalImageMap.get(key)!.push({
        medalType: medalImage.medalType,
        imageUrl: medalImage.imageUrl,
      });
    });

    // Transform AR data with progress stats
    const arLevels = arChoices.map((ar) => {
      // Count novels
      const novelCount = ar.novels.length;

      // Calculate first try stats across all novels in this AR
      let firstTryTotal = 0;
      let firstTryCorrect = 0;

      ar.novels.forEach((novel) => {
        novel.novelChapters.forEach((chapter) => {
          const questionSet = chapter.novelQuestionSet;
          if (
            questionSet &&
            questionSet.NovelQuestionFirstTry &&
            questionSet.NovelQuestionFirstTry.length > 0
          ) {
            const firstTry = questionSet.NovelQuestionFirstTry[0];
            firstTryTotal += firstTry.totalQuestions;
            firstTryCorrect += firstTry.correctAnswers;
          }
        });
      });

      // Count chapters attempted (chapters with at least one completed question)
      let chaptersAttempted = 0;
      ar.novels.forEach((novel) => {
        novel.novelChapters.forEach((chapter) => {
          const hasCompletedQuestion =
            chapter.novelQuestionSet?.novelQuestions.some(
              (q) => q.novelQuestionCompleted.length > 0
            );
          if (hasCompletedQuestion) {
            chaptersAttempted++;
          }
        });
      });

      return {
        id: ar.id,
        level: ar.level,
        score: ar.score,
        stars: ar.stars,
        description: ar.description,
        novelCount,
        chaptersAttempted,
        firstTryTotal,
        firstTryCorrect,
        medalImages: medalImageMap.get(ar.id) || [],
      };
    });

    return NextResponse.json({ arLevels });
  } catch (error) {
    console.error("AR Levels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AR levels" },
      { status: 500 }
    );
  }
}
