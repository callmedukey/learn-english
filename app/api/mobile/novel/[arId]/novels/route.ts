import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";
import { getActiveChallengeItems } from "@/server-queries/medals";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ arId: string }> }
) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { arId } = await params;

  // Parse query params
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "title";
  const sortOrder = url.searchParams.get("sortOrder") || "asc";
  const status = url.searchParams.get("status") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "30", 10);

  try {
    // Get AR info
    const ar = await prisma.aR.findUnique({
      where: { id: arId },
    });

    if (!ar) {
      return NextResponse.json({ error: "AR level not found" }, { status: 404 });
    }

    // Build search where clause
    const searchWhere = search
      ? {
          OR: [
            {
              title: {
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
    let orderBy: Record<string, string> = { title: "asc" };
    if (sortBy === "title") {
      orderBy = { title: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    }

    // Get challenge novel IDs
    const challengeNovelIds = await getActiveChallengeItems("AR", arId);

    // Fetch novels
    const skip = (page - 1) * perPage;

    const allNovels = await prisma.novel.findMany({
      where: {
        ARId: arId,
        hidden: false,
        ...searchWhere,
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
              },
            },
          },
          orderBy: {
            orderNumber: "asc",
          },
        },
      },
      orderBy,
      skip,
      take: perPage,
    });

    // Get total count
    const totalCount = await prisma.novel.count({
      where: {
        ARId: arId,
        hidden: false,
        ...searchWhere,
      },
    });

    // Transform novels with progress
    let novels = allNovels.map((novel) => {
      const totalChapters = novel.novelChapters.length;
      const freeChapters = novel.novelChapters.filter((c) => c.isFree).length;

      // Calculate completed chapters
      const completedChapters = novel.novelChapters.filter((chapter) => {
        if (!chapter.novelQuestionSet) return false;
        const totalQuestions = chapter.novelQuestionSet.novelQuestions.length;
        const completedQuestions =
          chapter.novelQuestionSet.novelQuestions.filter(
            (q) => q.novelQuestionCompleted.length > 0
          ).length;
        return totalQuestions > 0 && completedQuestions === totalQuestions;
      }).length;

      const progress =
        totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        comingSoon: novel.comingSoon,
        totalChapters,
        completedChapters,
        freeChapters,
        progress,
        isMonthlyChallenge: challengeNovelIds?.includes(novel.id) || false,
      };
    });

    // Apply status filter
    if (status !== "all") {
      novels = novels.filter((novel) => {
        switch (status) {
          case "completed":
            return novel.progress === 100;
          case "inProgress":
            return novel.progress > 0 && novel.progress < 100;
          case "notStarted":
            return novel.progress === 0;
          default:
            return true;
        }
      });
    }

    // Handle chapter count sorting after fetching
    if (sortBy === "chapterCount") {
      novels.sort((a, b) => {
        const comparison = a.totalChapters - b.totalChapters;
        return sortOrder === "desc" ? -comparison : comparison;
      });
    }

    const totalPages = Math.ceil(totalCount / perPage);

    return NextResponse.json({
      ar: {
        id: ar.id,
        level: ar.level,
        score: ar.score,
        stars: ar.stars,
        description: ar.description,
      },
      novels,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        perPage,
      },
    });
  } catch (error) {
    console.error("Novels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch novels" },
      { status: 500 }
    );
  }
}
