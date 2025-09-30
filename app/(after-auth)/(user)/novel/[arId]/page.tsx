import { ArrowLeft, BookOpen, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/prisma/prisma-client";
import { getActiveChallengeItems } from "@/server-queries/medals";

import { NovelCard } from "../components/novel-card";
import { NovelFilters } from "./components/novel-filters";
import { NovelsPagination } from "./components/novels-pagination";

interface PageProps {
  params: Promise<{ arId: string }>;
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    page?: string;
  }>;
}

async function ARNovels({
  arId,
  searchParams,
}: {
  arId: string;
  searchParams: {
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    page?: string;
  };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  // Build the where clause for search
  const searchWhere = searchParams.search
    ? {
        OR: [
          {
            title: {
              contains: searchParams.search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: searchParams.search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  // Pagination setup
  const page = parseInt(searchParams.page || "1", 10);
  const perPage = 30;

  // Build the orderBy clause - default to title asc
  const sortBy = searchParams.sortBy || "title";
  const sortOrder = searchParams.sortOrder || "asc";

  let orderBy: any = { title: "asc" };

  switch (sortBy) {
    case "title":
      orderBy = { title: sortOrder };
      break;
    case "createdAt":
      orderBy = { createdAt: sortOrder };
      break;
    case "chapterCount":
      // We'll handle chapter count sorting after fetching the data
      orderBy = { createdAt: "desc" }; // Default sort for now
      break;
    default:
      orderBy = { title: "asc" };
  }

  // First, get the AR info
  const ar = await prisma.aR.findUnique({
    where: { id: arId },
  });

  if (!ar) {
    notFound();
  }

  // Get the challenge novel IDs for this AR level
  const challengeNovelIds = await getActiveChallengeItems("AR", arId);

  // Get all novels without pinning
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
                    where: userId
                      ? {
                          userId: userId,
                        }
                      : undefined,
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

  // Get total count for display (only visible novels)
  const totalNovelsCount = await prisma.novel.count({
    where: {
      ARId: arId,
      hidden: false,
      ...searchWhere,
    },
  });

  // Calculate total pages with standard pagination
  const totalPages = Math.ceil(totalNovelsCount / perPage);

  // Apply status filter on the server side if needed
  let filteredNovels = allNovels;

  if (searchParams.status && searchParams.status !== "all" && userId) {
    filteredNovels = allNovels.filter((novel) => {
      const totalChapters = novel.novelChapters.length;
      const completedChapters = novel.novelChapters.filter((chapter) => {
        if (!chapter.novelQuestionSet) return false;

        const totalQuestions = chapter.novelQuestionSet.novelQuestions.length;
        const completedQuestions =
          chapter.novelQuestionSet.novelQuestions.filter((question) =>
            question.novelQuestionCompleted.some(
              (completed) => completed.userId === userId,
            ),
          ).length;

        return totalQuestions > 0 && completedQuestions === totalQuestions;
      }).length;

      const progressPercentage =
        totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

      switch (searchParams.status) {
        case "completed":
          return progressPercentage === 100;
        case "inProgress":
          return progressPercentage > 0 && progressPercentage < 100;
        case "notStarted":
          return progressPercentage === 0;
        default:
          return true;
      }
    });
  }

  // Handle chapter count sorting after fetching data
  if (sortBy === "chapterCount") {
    filteredNovels.sort((a, b) => {
      const comparison = a.novelChapters.length - b.novelChapters.length;
      return sortOrder === "desc" ? -comparison : comparison;
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/novel">
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lexile Levels
          </Button>
        </Link>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">{ar.level}</h1>
            <div className="flex items-center gap-1">
              {Array.from({ length: ar.stars }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            {ar.score}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            {totalNovelsCount} novel{totalNovelsCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        {ar.description && (
          <p className="text-lg text-muted-foreground">{ar.description}</p>
        )}
      </div>

      {/* Filters */}
      <NovelFilters arId={arId} />

      {/* Novels Grid */}
      {filteredNovels.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            {totalNovelsCount === 0
              ? "No novels available"
              : "No novels match your filters"}
          </h3>
          <p className="text-muted-foreground">
            {totalNovelsCount === 0
              ? "Novels for this Lexile level are coming next month."
              : "Try adjusting your search criteria or clearing the filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredNovels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              arId={arId}
              userId={userId}
              isMonthlyChallenge={
                challengeNovelIds?.includes(novel.id) || false
              }
              userJoinedChallenge={false}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredNovels.length > 0 && (
        <NovelsPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalNovelsCount}
        />
      )}
    </div>
  );
}

function ARNovelsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="mb-4 h-10 w-32" />

        <div className="mb-4 flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-5" />
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>

        <Skeleton className="h-6 w-96" />
      </div>

      {/* Novels Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="pb-4">
              <Skeleton className="mb-4 h-48 w-full rounded-lg" />
              <Skeleton className="mb-2 h-6 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-4 h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function Page({ params, searchParams }: PageProps) {
  const { arId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<ARNovelsSkeleton />}>
      <ARNovels arId={arId} searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
