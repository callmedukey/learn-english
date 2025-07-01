import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserLevelLock } from "@/server-queries/level-locks";
import { getActiveChallengeItems } from "@/server-queries/medals";

import ChapterCard from "./components/chapter-card";
import { getNovelDetails } from "./query/novel-details.query";

interface NovelPageProps {
  params: Promise<{
    arId: string;
    novelId: string;
  }>;
}

async function NovelContent({
  arId,
  novelId,
}: {
  arId: string;
  novelId: string;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const novel = await getNovelDetails(novelId, session.user.id);

  if (!novel) {
    notFound();
  }

  // Check if this novel is part of a monthly challenge
  const challengeNovelIds = novel.AR ? await getActiveChallengeItems("AR", novel.AR.id) : [];
  const isMonthlyChallenge = challengeNovelIds?.includes(novelId) || false;
  
  // Check user's level lock status
  const userLevelLock = await getUserLevelLock(session.user.id, "AR");

  const totalChapters = novel.novelChapters.length;
  const completedChapters = novel.novelChapters.filter(
    (chapter) => chapter.isCompleted,
  ).length;
  const freeChapters = novel.novelChapters.filter(
    (chapter) => chapter.isFree,
  ).length;

  const overallProgress =
    totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/novel/${arId}`}>
            ← Back to {novel.AR?.level || "AR"} Novels
          </Link>
        </Button>
      </div>

      {/* Novel Header */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Novel Details */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              {novel.title}
            </h1>
            {novel.AR && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {novel.AR.level}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800"
                >
                  AR: {novel.AR.score}
                </Badge>
                <div className="flex items-center">
                  <span className="mr-1 text-sm text-gray-600">
                    Difficulty:
                  </span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < (novel.AR?.stars || 0)
                            ? "text-amber-400"
                            : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {novel.description && (
              <p className="leading-relaxed text-gray-600">
                {novel.description}
              </p>
            )}
          </div>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {completedChapters}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-700">
                    {totalChapters}
                  </div>
                  <div className="text-sm text-gray-600">Total Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">
                    {freeChapters}
                  </div>
                  <div className="text-sm text-gray-600">Free Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(overallProgress)}%
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chapters Section */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Chapters</h2>
        {novel.novelChapters.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {novel.novelChapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                arId={arId}
                novelId={novelId}
                novelTitle={novel.title}
                arLevel={novel.AR?.level || ""}
                userHasPaidSubscription={session.user.hasPaidSubscription}
                isMonthlyChallenge={isMonthlyChallenge}
                userLevelLock={userLevelLock}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500">
                <div className="mb-4 text-4xl">📖</div>
                <h3 className="mb-2 text-lg font-medium">
                  No Chapters Available
                </h3>
                <p>This novel doesn&apos;t have any chapters yet.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function NovelPageSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-6 h-10 w-48" />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>

      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function NovelPage({ params }: NovelPageProps) {
  const { arId, novelId } = await params;

  return (
    <Suspense fallback={<NovelPageSkeleton />}>
      <NovelContent arId={arId} novelId={novelId} />
    </Suspense>
  );
}
