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
    const rcLevels = await prisma.rCLevel.findMany({
      include: {
        RCKeyword: {
          where: {
            hidden: false,
          },
          include: {
            RCQuestionSet: {
              include: {
                RCQuestion: {
                  include: {
                    RCQuestionCompleted: {
                      where: {
                        userId: userId,
                      },
                      select: {
                        userId: true,
                      },
                    },
                  },
                },
                RCQuestionFirstTry: {
                  where: {
                    userId: userId,
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

    // Fetch medal images for each RC level
    const medalImages = await prisma.medalImage.findMany({
      where: {
        levelType: "RC",
        levelId: {
          in: rcLevels.map((rc) => rc.id),
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

    // Transform RC data with progress stats
    const transformedRCLevels = rcLevels.map((rc) => {
      // Count keywords
      const keywordCount = rc.RCKeyword.length;

      // Calculate first try stats across all keywords in this RC level
      let firstTryTotal = 0;
      let firstTryCorrect = 0;

      rc.RCKeyword.forEach((keyword) => {
        const questionSet = keyword.RCQuestionSet;
        if (
          questionSet &&
          questionSet.RCQuestionFirstTry &&
          questionSet.RCQuestionFirstTry.length > 0
        ) {
          const firstTry = questionSet.RCQuestionFirstTry[0];
          firstTryTotal += firstTry.totalQuestions;
          firstTryCorrect += firstTry.correctAnswers;
        }
      });

      // Count keywords attempted (keywords with at least one completed question)
      let keywordsAttempted = 0;
      rc.RCKeyword.forEach((keyword) => {
        const hasCompletedQuestion = keyword.RCQuestionSet?.RCQuestion.some(
          (q) => q.RCQuestionCompleted.length > 0
        );
        if (hasCompletedQuestion) {
          keywordsAttempted++;
        }
      });

      return {
        id: rc.id,
        level: rc.level,
        relevantGrade: rc.relevantGrade,
        stars: rc.stars,
        description: rc.description,
        keywordCount,
        keywordsAttempted,
        firstTryTotal,
        firstTryCorrect,
        medalImages: medalImageMap.get(rc.id) || [],
      };
    });

    return NextResponse.json({ rcLevels: transformedRCLevels });
  } catch (error) {
    console.error("RC Levels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch RC levels" },
      { status: 500 }
    );
  }
}
