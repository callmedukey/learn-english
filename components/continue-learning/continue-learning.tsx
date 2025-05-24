import { BookOpen, Brain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { getContinueLearningData } from "./queries/continue-learning.query";

interface ContinueLearningProps {
  userId: string;
}

export function ContinueLearning({ userId }: ContinueLearningProps) {
  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-3xl font-bold text-amber-900">Continue Learning</h2>
        <BookOpen className="h-7 w-7 text-primary" />
      </div>

      <Suspense fallback={<ContinueLearningSkeletons />}>
        <ContinueLearningContent userId={userId} />
      </Suspense>
    </div>
  );
}

async function ContinueLearningContent({ userId }: { userId: string }) {
  const data = await getContinueLearningData(userId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Novel Progress Card */}
      <Card className="gap-0 overflow-hidden py-0 shadow-lg">
        <CardHeader className="rounded-t-lg bg-primary py-2">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <BookOpen className="h-5 w-5" />
            Novel Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-full min-h-[250px] flex-col p-6">
          {data.novelProgress ? (
            <>
              <div className="flex flex-1 flex-col justify-center space-y-4">
                <div className="flex items-start gap-4">
                  {data.novelProgress.novel.image ? (
                    <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={data.novelProgress.novel.image.imageUrl}
                        alt={data.novelProgress.novel.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                      No Image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">
                      {data.novelProgress.novel.title}
                    </h3>
                    {data.novelProgress.novel.AR && (
                      <p className="text-sm text-gray-600">
                        Level: {data.novelProgress.novel.AR.level}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {data.novelProgress.completedChapters} of{" "}
                      {data.novelProgress.totalChapters} chapters completed
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {data.novelProgress.progressPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={data.novelProgress.progressPercentage}
                    className="h-2"
                  />
                </div>
              </div>

              <Button asChild className="mt-4 w-full">
                <Link href={`/novels/${data.novelProgress.novel.id}`}>
                  Continue Novel
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-1 flex-col items-center justify-center py-8">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="mb-4 text-gray-500">No novel progress yet</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/novels">Start Reading</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* RC Progress Card */}
      <Card className="gap-0 overflow-hidden py-0 shadow-lg">
        <CardHeader className="rounded-t-lg bg-primary py-2">
          <CardTitle className="flex items-center justify-center gap-2 text-white">
            <Brain className="h-5 w-5" />
            Reading Comprehension
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-full min-h-[250px] flex-col p-6">
          {data.rcProgress ? (
            <>
              <div className="flex flex-1 flex-col justify-center space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">
                    {data.rcProgress.keyword.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Level: {data.rcProgress.keyword.RCLevel.level}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last practiced:{" "}
                    {new Date(data.rcProgress.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button asChild className="mt-4 w-full">
                <Link
                  href={`/reading-comprehension/${data.rcProgress.keyword.id}`}
                >
                  Continue Reading Comprehension
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-1 flex-col items-center justify-center py-8">
                <Brain className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="mb-4 text-gray-500">No RC progress yet</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/reading-comprehension">Start Practice</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContinueLearningSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Novel Progress Skeleton */}
      <Card className="shadow-lg">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <BookOpen className="h-5 w-5" />
            Novel Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-20 w-14 flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* RC Progress Skeleton */}
      <Card className="shadow-lg">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Brain className="h-5 w-5" />
            Reading Comprehension
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
