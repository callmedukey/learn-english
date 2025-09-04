import { ArrowLeft, Star, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/prisma/prisma-client";
import { getUserLevelLock } from "@/server-queries/level-locks";
import {
  getActiveChallengeItems,
  getCurrentKoreaYearMonth,
} from "@/server-queries/medals";

import { RCChallengeConfirmationButton } from "./components/rc-challenge-confirmation-button";
import { RCKeywordCard } from "./components/rc-keyword-card";
import { RCKeywordFilters } from "./components/rc-keyword-filters";
import { RCKeywordsPagination } from "./components/rc-keywords-pagination";

interface PageProps {
  params: Promise<{ rcLevelId: string }>;
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    page?: string;
  }>;
}

async function RCKeywords({
  rcLevelId,
  searchParams,
}: {
  rcLevelId: string;
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
  const hasPaidSubscription = session?.user?.hasPaidSubscription;

  // Build the where clause for search
  const searchWhere = searchParams.search
    ? {
        OR: [
          {
            name: {
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
          {
            RCQuestionSet: {
              title: {
                contains: searchParams.search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {};

  // Pagination setup
  const page = parseInt(searchParams.page || "1", 10);
  const perPage = 30;

  // Build the orderBy clause - default to name asc
  const sortBy = searchParams.sortBy || "name";
  const sortOrder = searchParams.sortOrder || "asc";

  let orderBy: any = { name: "asc" };

  switch (sortBy) {
    case "name":
      orderBy = { name: sortOrder };
      break;
    case "createdAt":
      orderBy = { createdAt: sortOrder };
      break;
    default:
      orderBy = { name: "asc" };
  }

  // First, get the RC Level info
  const rcLevel = await prisma.rCLevel.findUnique({
    where: { id: rcLevelId },
  });

  if (!rcLevel) {
    notFound();
  }

  // Get challenge keyword IDs for this RC level
  const challengeKeywordIds = await getActiveChallengeItems("RC", rcLevelId);

  // Get current month/year for challenge button
  const { year: currentYear, month: currentMonth } = getCurrentKoreaYearMonth();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentMonthName = monthNames[currentMonth - 1];

  // Get user's level lock if they're logged in
  const userLevelLock = userId ? await getUserLevelLock(userId, "RC") : null;
  
  // Get all keywords without pinning
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
            orderBy: {
              orderNumber: "asc",
            },
          },
          RCQuestionFirstTry: userId
            ? {
                where: {
                  userId: userId,
                },
                select: {
                  id: true,
                  totalQuestions: true,
                  correctAnswers: true,
                  createdAt: true,
                },
              }
            : false,
          RCQuestionSecondTry: userId
            ? {
                where: {
                  userId: userId,
                },
                select: {
                  id: true,
                  totalQuestions: true,
                  correctAnswers: true,
                  createdAt: true,
                },
              }
            : false,
        },
      },
    },
    orderBy,
    skip,
    take: perPage,
  });

  // Get total count for display (only visible keywords)
  const totalKeywordsCount = await prisma.rCKeyword.count({
    where: {
      rcLevelId: rcLevelId,
      hidden: false,
      ...searchWhere,
    },
  });

  // Calculate total pages with standard pagination
  const totalPages = Math.ceil(totalKeywordsCount / perPage);

  // Apply status filter on the server side if needed
  let filteredKeywords = allKeywords;

  if (searchParams.status && searchParams.status !== "all" && userId) {
    filteredKeywords = allKeywords.filter((keyword) => {
      if (!keyword.RCQuestionSet) return searchParams.status === "notStarted";

      const firstTryData = keyword.RCQuestionSet.RCQuestionFirstTry[0] || null;
      const secondTryData =
        keyword.RCQuestionSet.RCQuestionSecondTry[0] || null;

      switch (searchParams.status) {
        case "completed":
          // Completed means has at least first try (could show both first and second try completed)
          return firstTryData !== null;
        case "inProgress":
          // In progress means has first try but could do second try
          return firstTryData !== null && secondTryData === null;
        case "notStarted":
          // Not started means no attempts yet
          return firstTryData === null;
        default:
          return true;
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/rc">
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RC Levels
          </Button>
        </Link>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">
              RC Level {rcLevel.level}
            </h1>
            <div className="flex items-center gap-1">
              {Array.from({ length: rcLevel.stars }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <RCChallengeConfirmationButton
            rcLevelId={rcLevelId}
            rcLevel={`RC Level ${rcLevel.level}`}
            hasActiveChallenge={
              !!challengeKeywordIds && challengeKeywordIds.length > 0
            }
            challengeKeywordCount={challengeKeywordIds?.length || 0}
            currentMonth={currentMonthName}
            currentYear={currentYear}
            userLevelLock={userLevelLock}
          />
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            {rcLevel.relevantGrade}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            {rcLevel.numberOfQuestions} Total Questions
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            {totalKeywordsCount} topic{totalKeywordsCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        {rcLevel.description && (
          <p className="text-lg text-muted-foreground">{rcLevel.description}</p>
        )}
      </div>

      {/* Filters */}
      <RCKeywordFilters rcLevelId={rcLevelId} />

      {/* Keywords Grid */}
      {filteredKeywords.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            {totalKeywordsCount === 0
              ? "No topics available"
              : "No topics match your filters"}
          </h3>
          <p className="text-muted-foreground">
            {totalKeywordsCount === 0
              ? "Topics for this RC level are coming next month."
              : "Try adjusting your search criteria or clearing the filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredKeywords.map((keyword) => (
            <RCKeywordCard
              key={keyword.id}
              keyword={keyword}
              rcLevelId={rcLevelId}
              rcLevelName={rcLevel.level}
              userId={userId}
              hasPaidSubscription={hasPaidSubscription}
              isMonthlyChallenge={
                challengeKeywordIds?.includes(keyword.id) || false
              }
              userLevelLock={userLevelLock}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredKeywords.length > 0 && (
        <RCKeywordsPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalKeywordsCount}
        />
      )}
    </div>
  );
}

function RCKeywordsSkeleton() {
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
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-24" />
        </div>

        <Skeleton className="h-6 w-96" />
      </div>

      {/* Keywords Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
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
  const { rcLevelId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<RCKeywordsSkeleton />}>
      <RCKeywords rcLevelId={rcLevelId} searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
