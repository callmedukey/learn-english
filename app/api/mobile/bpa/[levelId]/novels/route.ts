import { NextResponse } from "next/server";

import { getUserAccessibleNovels } from "@/lib/bpa/access-control";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

interface RouteParams {
  params: Promise<{ levelId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const { levelId } = await params;

  // Parse query params
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const sortBy = url.searchParams.get("sortBy") || "title";
  const sortOrder = (url.searchParams.get("sortOrder") || "asc") as "asc" | "desc";
  const status = url.searchParams.get("status") || "all";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "20", 10);

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

    // Get the BPA level info
    const bpaLevel = await prisma.bPALevel.findUnique({
      where: { id: levelId },
      select: {
        id: true,
        name: true,
        stars: true,
        description: true,
      },
    });

    if (!bpaLevel) {
      return NextResponse.json(
        { error: "BPA level not found" },
        { status: 404 }
      );
    }

    // Get accessible novel IDs for this user in this level
    const accessibleNovelIds = await getUserAccessibleNovels(userId, levelId);

    // Build where clause
    const whereClause: any = {
      bpaLevelId: levelId,
      hidden: false,
    };

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get all novels with progress data
    const allNovels = await prisma.bPANovel.findMany({
      where: whereClause,
      include: {
        chapters: {
          include: {
            questionSet: {
              include: {
                questions: {
                  include: {
                    completed: {
                      where: { userId: userId },
                      select: { userId: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { orderNumber: "asc" },
        },
      },
      orderBy: sortBy === "title"
        ? { title: sortOrder }
        : sortBy === "createdAt"
        ? { createdAt: sortOrder }
        : { title: sortOrder },
    });

    // Transform novels with progress
    let transformedNovels = allNovels.map((novel) => {
      const isAccessible = accessibleNovelIds.includes(novel.id);
      const totalChapters = novel.chapters.length;
      const completedChapters = novel.chapters.filter((chapter) => {
        if (!chapter.questionSet) return false;
        const totalQuestions = chapter.questionSet.questions.length;
        const completedQuestions = chapter.questionSet.questions.filter(
          (question) => question.completed.length > 0
        ).length;
        return totalQuestions > 0 && completedQuestions === totalQuestions;
      }).length;

      const progress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

      return {
        id: novel.id,
        title: novel.title,
        description: novel.description,
        totalChapters,
        completedChapters,
        progress,
        isAccessible,
        comingSoon: novel.comingSoon,
      };
    });

    // Apply status filter
    if (status === "completed") {
      transformedNovels = transformedNovels.filter(
        (n) => n.totalChapters > 0 && n.completedChapters === n.totalChapters
      );
    } else if (status === "inProgress") {
      transformedNovels = transformedNovels.filter(
        (n) => n.completedChapters > 0 && n.completedChapters < n.totalChapters
      );
    } else if (status === "notStarted") {
      transformedNovels = transformedNovels.filter((n) => n.completedChapters === 0);
    }

    // Apply pagination
    const filteredCount = transformedNovels.length;
    const totalPages = Math.ceil(filteredCount / perPage);
    const offset = (page - 1) * perPage;
    const paginatedNovels = transformedNovels.slice(offset, offset + perPage);

    return NextResponse.json({
      bpaLevel,
      novels: paginatedNovels,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount: filteredCount,
        perPage,
      },
    });
  } catch (error) {
    console.error("BPA Novels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch BPA novels" },
      { status: 500 }
    );
  }
}
