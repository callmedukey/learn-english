import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";
import { getActiveChallengeItems } from "@/server-queries/medals";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ rcLevelId: string }> }
) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { rcLevelId } = await params;

  // Parse query params
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "name";
  const sortOrder = url.searchParams.get("sortOrder") || "asc";
  const status = url.searchParams.get("status") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "30", 10);

  try {
    // Get RC Level info
    const rcLevel = await prisma.rCLevel.findUnique({
      where: { id: rcLevelId },
    });

    if (!rcLevel) {
      return NextResponse.json(
        { error: "RC level not found" },
        { status: 404 }
      );
    }

    // Build search where clause
    const searchWhere = search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {};

    // Build order by
    let orderBy: Record<string, string> = { name: "asc" };
    if (sortBy === "name") {
      orderBy = { name: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    }

    // Get challenge keyword IDs
    const challengeKeywordIds = await getActiveChallengeItems("RC", rcLevelId);

    // Fetch keywords
    const skip = (page - 1) * perPage;

    const allKeywords = await prisma.rCKeyword.findMany({
      where: {
        rcLevelId: rcLevelId,
        hidden: false,
        ...searchWhere,
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
            RCQuestionSecondTry: {
              where: {
                userId: userId,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    // Get total count
    const totalCount = await prisma.rCKeyword.count({
      where: {
        rcLevelId: rcLevelId,
        hidden: false,
        ...searchWhere,
      },
    });

    // Transform keywords with progress
    let keywords = allKeywords.map((keyword) => {
      const questionSet = keyword.RCQuestionSet;
      const questionCount = questionSet?.RCQuestion.length || 0;

      // Get first try data
      const firstTryData =
        questionSet?.RCQuestionFirstTry && questionSet.RCQuestionFirstTry.length > 0
          ? {
              totalQuestions: questionSet.RCQuestionFirstTry[0].totalQuestions,
              correctAnswers: questionSet.RCQuestionFirstTry[0].correctAnswers,
            }
          : null;

      // Get second try data
      const secondTryData =
        questionSet?.RCQuestionSecondTry && questionSet.RCQuestionSecondTry.length > 0
          ? {
              totalQuestions: questionSet.RCQuestionSecondTry[0].totalQuestions,
              correctAnswers: questionSet.RCQuestionSecondTry[0].correctAnswers,
            }
          : null;

      // Calculate progress
      const completedQuestions = questionSet?.RCQuestion.filter(
        (q) => q.RCQuestionCompleted.length > 0
      ).length || 0;

      const progress =
        questionCount > 0
          ? Math.round((completedQuestions / questionCount) * 100)
          : 0;

      return {
        id: keyword.id,
        name: keyword.name,
        description: keyword.description,
        comingSoon: keyword.comingSoon,
        isFree: keyword.isFree,
        questionCount,
        completedQuestions,
        progress,
        isMonthlyChallenge: challengeKeywordIds?.includes(keyword.id) || false,
        firstTryData,
        secondTryData,
      };
    });

    // Apply status filter
    if (status !== "all") {
      keywords = keywords.filter((keyword) => {
        switch (status) {
          case "completed":
            return keyword.progress === 100;
          case "inProgress":
            return keyword.progress > 0 && keyword.progress < 100;
          case "notStarted":
            return keyword.progress === 0;
          default:
            return true;
        }
      });
    }

    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      rcLevel: {
        id: rcLevel.id,
        level: rcLevel.level,
        relevantGrade: rcLevel.relevantGrade,
        stars: rcLevel.stars,
        description: rcLevel.description,
      },
      keywords,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        perPage,
      },
    });
  } catch (error) {
    console.error("RC Keywords API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch RC keywords" },
      { status: 500 }
    );
  }
}
