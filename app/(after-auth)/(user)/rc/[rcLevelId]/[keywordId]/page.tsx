import { Star } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/prisma/prisma-client";
import { getUserLevelLock } from "@/server-queries/level-locks";
import { getActiveChallengeItems } from "@/server-queries/medals";

import { RCQuizComponent } from "./components/rc-quiz-component";

// Utility function to get font size classes based on RCLevel settings
function getFontSizeClasses(
  fontSize: "BASE" | "LARGE" | "XLARGE" | undefined,
): string {
  switch (fontSize) {
    case "LARGE":
      return "[&_p]:text-lg [&_span]:text-lg [&_.badge]:text-lg";
    case "XLARGE":
      return "[&_p]:text-xl [&_span]:text-xl [&_.badge]:text-xl";
    case "BASE":
    default:
      return "";
  }
}

// Helper function to determine quiz status
function getRCQuizStatus(
  questions: Array<{
    RCQuestionCompleted: Array<{ userId: string }>;
  }>,
  userId: string,
): "start" | "continue" | "retry" {
  if (questions.length === 0) return "start";

  const completedCount = questions.filter((q) =>
    q.RCQuestionCompleted.some((completed) => completed.userId === userId),
  ).length;

  if (completedCount === 0) return "start";
  if (completedCount === questions.length) return "retry";
  return "continue";
}

interface PageProps {
  params: Promise<{ rcLevelId: string; keywordId: string }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

async function RCKeywordContent({
  rcLevelId,
  keywordId,
  searchParams,
}: {
  rcLevelId: string;
  keywordId: string;
  searchParams: { status?: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  const keyword = await prisma.rCKeyword.findUnique({
    where: { id: keywordId },
    include: {
      RCLevel: {
        include: {
          RCLevelSettings: true,
        },
      },
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
                  score: true,
                },
              },
            },
            orderBy: {
              orderNumber: "asc",
            },
          },
        },
      },
    },
  });

  // Return 404 if keyword doesn't exist, is hidden, or belongs to different level
  if (!keyword || keyword.rcLevelId !== rcLevelId || keyword.hidden) {
    notFound();
  }

  const fontSizeClasses = getFontSizeClasses(
    keyword.RCLevel.RCLevelSettings?.fontSize,
  );

  // Check premium access
  const hasPremiumAccess = keyword.isFree || session.user.hasPaidSubscription;

  // Check if this keyword is part of a monthly challenge
  const challengeKeywordIds = await getActiveChallengeItems("RC", rcLevelId);
  const isMonthlyChallenge = challengeKeywordIds?.includes(keywordId) || false;
  
  // Check user's level lock status
  const userLevelLock = await getUserLevelLock(session.user.id, "RC");
  
  // Check challenge access - only block if it's a challenge keyword AND user hasn't joined ANY level
  const challengeBlocked = isMonthlyChallenge && !userLevelLock;
  
  // Can access quiz if they have premium access AND (not a challenge keyword OR they've joined the challenge)
  // const canAccess = hasPremiumAccess && !challengeBlocked;

  if (!hasPremiumAccess) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/rc/${rcLevelId}`}>← Back to Topics</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">🔒</div>
              <h3 className="mb-2 text-lg font-medium">Premium Content</h3>
              <p className="mb-4">
                This topic requires a premium subscription to access.
              </p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Topic:</strong> {keyword.name}
                </p>
                <p>
                  <strong>Level:</strong> {keyword.RCLevel.level}
                </p>
                <p>
                  <strong>{keyword.RCLevel.relevantGrade}</strong>
                </p>
              </div>
              <Button asChild>
                <Link href="/profile">Upgrade to Premium</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for challenge access after premium check
  if (challengeBlocked) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/rc/${rcLevelId}`}>← Back to Topics</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">🏆</div>
              <h3 className="mb-2 text-lg font-medium">Monthly Challenge Content</h3>
              <p className="mb-4">
                This topic is part of the monthly challenge. You need to join the challenge to access this quiz.
              </p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Topic:</strong> {keyword.name}
                </p>
                <p>
                  <strong>Level:</strong> {keyword.RCLevel.level}
                </p>
              </div>
              <Button asChild>
                <Link href={`/rc/${rcLevelId}`}>Go to Level Page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!keyword.RCQuestionSet) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/rc/${rcLevelId}`}>← Back to Topics</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="mb-2 text-lg font-medium">No Quiz Available</h3>
              <p className="mb-4">This topic doesn&apos;t have a quiz yet.</p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Topic:</strong> {keyword.name}
                </p>
                <p>
                  <strong>Level:</strong> {keyword.RCLevel.level}
                </p>
                {keyword.description && (
                  <p>
                    <strong>Description:</strong> {keyword.description}
                  </p>
                )}
              </div>
              <Button asChild>
                <Link href={`/rc/${rcLevelId}`}>Back to Topics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block access if question set is inactive
  if (!keyword.RCQuestionSet.active) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/rc/${rcLevelId}`}>← Back to Topics</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">🚧</div>
              <h3 className="mb-2 text-lg font-medium">Quiz Not Available</h3>
              <p className="mb-4">
                This quiz is currently under development and not available yet.
              </p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Topic:</strong> {keyword.name}
                </p>
                <p>
                  <strong>Level:</strong> {keyword.RCLevel.level}
                </p>
                <p>
                  <strong>{keyword.RCLevel.relevantGrade}</strong>
                </p>
              </div>
              <Button asChild>
                <Link href={`/rc/${rcLevelId}`}>Back to Topics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = keyword.RCQuestionSet.RCQuestion;

  if (questions.length === 0) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/rc/${rcLevelId}`}>← Back to Topics</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="mb-2 text-lg font-medium">
                No Questions Available
              </h3>
              <p className="mb-4">
                This topic&apos;s quiz doesn&apos;t have any questions yet.
              </p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Topic:</strong> {keyword.name}
                </p>
                <p>
                  <strong>Level:</strong> {keyword.RCLevel.level}
                </p>
                {keyword.description && (
                  <p>
                    <strong>Description:</strong> {keyword.description}
                  </p>
                )}
              </div>
              <Button asChild>
                <Link href={`/rc/${rcLevelId}`}>Back to Topics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine quiz status
  let status = getRCQuizStatus(questions, userId);

  // Override with search params if retry is specified
  if (searchParams.status === "retry") {
    status = "retry";
  }


  return (
    <div className={`container mx-auto px-4 py-8 ${fontSizeClasses}`}>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/rc/${rcLevelId}`}>← Back to Topics</Link>
        </Button>
      </div>

      {/* Topic Info Card - Show before starting quiz */}
      {status !== "continue" && (
        <Card className="mx-auto mb-6 max-w-4xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between">
              <CardTitle>{keyword.name}</CardTitle>
              <div className="flex gap-2">
                {keyword.isFree && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800"
                  >
                    Free
                  </Badge>
                )}
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {status === "start" && "Ready to Start"}
                  {status === "retry" && "Ready to Retry"}
                </Badge>
                <div className="flex items-center gap-1">
                  {Array.from({ length: keyword.RCLevel.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p>
                <strong>Level:</strong> RC {keyword.RCLevel.level}
              </p>
              <p>
                <strong>{keyword.RCLevel.relevantGrade}</strong>
              </p>
              <p>
                <strong>Questions:</strong> {questions.length}
              </p>
              {keyword.description && (
                <p>
                  <strong>Description:</strong> {keyword.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Component */}
      <RCQuizComponent
        questionSet={keyword.RCQuestionSet}
        userId={session.user.id}
        keywordId={keywordId}
        rcLevelId={rcLevelId}
        status={status}
        fontSizeClasses={fontSizeClasses}
      />
    </div>
  );
}

function RCKeywordContentSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="mb-4 h-10 w-32" />

        <div className="mb-4 flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-5" />
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-32" />
        </div>

        <Skeleton className="h-6 w-96" />
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Passage Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Page({ params, searchParams }: PageProps) {
  const { rcLevelId, keywordId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<RCKeywordContentSkeleton />}>
      <RCKeywordContent
        rcLevelId={rcLevelId}
        keywordId={keywordId}
        searchParams={resolvedSearchParams}
      />
    </Suspense>
  );
}
