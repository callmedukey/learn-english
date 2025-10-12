import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { canUserAccessNovel } from "@/lib/bpa/access-control";
import { prisma } from "@/prisma/prisma-client";

import BPAChapterCard from "./components/bpa-chapter-card";
import { getBPANovelDetails } from "./query/bpa-novel-details.query";

interface NovelPageProps {
  params: Promise<{
    levelId: string;
    novelId: string;
  }>;
}

async function BPANovelContent({
  levelId,
  novelId,
}: {
  levelId: string;
  novelId: string;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if user has an assigned campus
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { campusId: true },
  });

  // If no campus is assigned, redirect to dashboard
  if (!user?.campusId) {
    redirect("/dashboard");
  }

  const novel = await getBPANovelDetails(novelId, session.user.id);

  if (!novel) {
    notFound();
  }

  // Check if user can access this novel
  const hasAccess = await canUserAccessNovel(session.user.id, novelId);

  if (!hasAccess) {
    redirect(`/bpa/${levelId}`);
  }

  const totalChapters = novel.chapters.length;
  const completedChapters = novel.chapters.filter(
    (chapter) => chapter.isCompleted,
  ).length;
  const freeChapters = novel.chapters.filter(
    (chapter) => chapter.isFree,
  ).length;

  const overallProgress =
    totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/bpa/${levelId}`}>
            ← Back to {novel.bpaLevel?.name || "BPA"} Novels
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
            {novel.bpaLevel && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {novel.bpaLevel.name}
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
                          i < (novel.bpaLevel?.stars || 0)
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

      {/* Units/Chapters Section */}
      <div>
        {novel.units.length > 0 ? (
          // Display chapters grouped by units
          <div className="space-y-8">
            {novel.units.map((unit) => (
              <div key={unit.id}>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{unit.name}</h2>
                  {unit.description && (
                    <div
                      className="text-gray-600"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(unit.description) }}
                    />
                  )}
                </div>
                {unit.chapters.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {unit.chapters.map((chapter) => (
                      <BPAChapterCard
                        key={chapter.id}
                        chapter={chapter}
                        levelId={levelId}
                        novelId={novelId}
                        userHasPaidSubscription={session.user.hasPaidSubscription}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No chapters in this unit yet.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Fallback to flat chapter list if no units
          <>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Chapters</h2>
            {novel.chapters.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {novel.chapters.map((chapter) => (
                  <BPAChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    levelId={levelId}
                    novelId={novelId}
                    userHasPaidSubscription={session.user.hasPaidSubscription}
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
          </>
        )}
      </div>
    </div>
  );
}

function BPANovelPageSkeleton() {
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

export default async function BPANovelPage({ params }: NovelPageProps) {
  const { levelId, novelId } = await params;

  return (
    <Suspense fallback={<BPANovelPageSkeleton />}>
      <BPANovelContent levelId={levelId} novelId={novelId} />
    </Suspense>
  );
}
