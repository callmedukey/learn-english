import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { checkChallengeParticipation } from "@/server-queries/challenge-participation";

import QuizComponent from "./components/quiz-component";
import {
  getChapterDetails,
  getChapterStatus,
} from "./query/chapter-details.query";

// Utility function to get font size classes based on AR settings
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

interface ChapterPageProps {
  params: Promise<{
    arId: string;
    novelId: string;
    chapterId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

async function ChapterContent({
  arId,
  novelId,
  chapterId,
  searchParams,
}: {
  arId: string;
  novelId: string;
  chapterId: string;
  searchParams: { status?: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const chapter = await getChapterDetails(chapterId, session.user.id);

  if (!chapter) {
    notFound();
  }

  const fontSizeClasses = getFontSizeClasses(
    chapter.novel.AR?.ARSettings?.fontSize,
  );

  const canAccess = chapter.isFree || session.user.hasPaidSubscription;

  if (!canAccess) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/novel/${arId}/${novelId}`}>← Back to Novel</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">🔒</div>
              <h3 className="mb-2 text-lg font-medium">Premium Content</h3>
              <p className="mb-4">
                This chapter requires a premium subscription to access.
              </p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Chapter:</strong> {chapter.title}
                </p>
                <p>
                  <strong>Novel:</strong> {chapter.novel.title}
                </p>
                <p>
                  <strong>{chapter.novel.AR?.level}</strong>
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

  if (!chapter.novelQuestionSet) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/novel/${arId}/${novelId}`}>← Back to Novel</Link>
          </Button>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="mb-2 text-lg font-medium">No Quiz Available</h3>
              <p className="mb-4">This chapter doesn&apos;t have a quiz yet.</p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Chapter:</strong> {chapter.title}
                </p>
                <p>
                  <strong>Novel:</strong> {chapter.novel.title}
                </p>
                {chapter.description && (
                  <p>
                    <strong>Description:</strong> {chapter.description}
                  </p>
                )}
              </div>
              <Button asChild>
                <Link href={`/novel/${arId}/${novelId}`}>Back to Novel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block access if question set is inactive
  if (!chapter.novelQuestionSet.active) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/novel/${arId}/${novelId}`}>← Back to Novel</Link>
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
                  <strong>Chapter:</strong> {chapter.title}
                </p>
                <p>
                  <strong>Novel:</strong> {chapter.novel.title}
                </p>
                <p>
                  <strong>Level:</strong> {chapter.novel.AR?.level}
                </p>
              </div>
              <Button asChild>
                <Link href={`/novel/${arId}/${novelId}`}>Back to Novel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = chapter.novelQuestionSet.novelQuestions;

  if (questions.length === 0) {
    return (
      <div
        className={`container mx-auto max-w-4xl px-4 py-8 ${fontSizeClasses}`}
      >
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/novel/${arId}/${novelId}`}>← Back to Novel</Link>
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
                This chapter&apos;s quiz doesn&apos;t have any questions yet.
              </p>
              <div className="mb-6 space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Chapter:</strong> {chapter.title}
                </p>
                <p>
                  <strong>Novel:</strong> {chapter.novel.title}
                </p>
                {chapter.description && (
                  <p>
                    <strong>Description:</strong> {chapter.description}
                  </p>
                )}
              </div>
              <Button asChild>
                <Link href={`/novel/${arId}/${novelId}`}>Back to Novel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get status from questions, but override with search params if retry is specified
  let status = getChapterStatus(questions);
  if (searchParams.status === "retry") {
    status = "retry";
  }

  // Check challenge participation
  const challengeInfo = await checkChallengeParticipation(
    session.user.id,
    "AR",
    arId,
    novelId
  );

  return (
    <div className={`container mx-auto px-4 py-8 ${fontSizeClasses}`}>
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/novel/${arId}/${novelId}`}>← Back to Novel</Link>
        </Button>
      </div>

      {/* Chapter Info Card - Show before starting quiz */}
      {status !== "continue" && (
        <Card className="mx-auto mb-6 max-w-4xl">
          <CardHeader>
            <CardTitle>
              Chapter {chapter.orderNumber}: {chapter.title}
            </CardTitle>
            <div className="flex gap-2">
              {chapter.isFree && (
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p>
                <strong>Novel:</strong> {chapter.novel.title}
              </p>
              <p>
                <strong>{chapter.novel.AR?.level}</strong>
              </p>
              {chapter.description && (
                <p>
                  <strong>Description:</strong> {chapter.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Component */}
      <QuizComponent
        chapter={chapter}
        userId={session.user.id}
        status={status}
        arId={arId}
        novelId={novelId}
        userHasPaidSubscription={session.user.hasPaidSubscription}
        challengeInfo={challengeInfo}
      />
    </div>
  );
}

function ChapterPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-10 w-48" />

      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default async function ChapterPage({
  params,
  searchParams,
}: ChapterPageProps) {
  const { arId, novelId, chapterId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <Suspense fallback={<ChapterPageSkeleton />}>
      <ChapterContent
        arId={arId}
        novelId={novelId}
        chapterId={chapterId}
        searchParams={resolvedSearchParams}
      />
    </Suspense>
  );
}
