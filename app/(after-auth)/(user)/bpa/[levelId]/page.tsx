import { ArrowLeft, BookOpen, Lock, Star } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserAccessibleNovels } from "@/lib/bpa/access-control";
import { prisma } from "@/prisma/prisma-client";

interface PageProps {
  params: Promise<{ levelId: string }>;
}

async function BPALevelNovels({ levelId }: { levelId: string }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if user has an assigned campus
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { campusId: true },
  });

  // If no campus is assigned, redirect to dashboard (super users bypass this)
  if (!user?.campusId && !session.user.isSuperUser) {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  // Get the BPA level info
  const level = await prisma.bPALevel.findUnique({
    where: { id: levelId },
  });

  if (!level) {
    notFound();
  }

  // Get accessible novel IDs for this user in this level
  const accessibleNovelIds = await getUserAccessibleNovels(userId, levelId);

  // Get all novels for this level
  const allNovels = await prisma.bPANovel.findMany({
    where: {
      bpaLevelId: levelId,
      hidden: false,
    },
    include: {
      chapters: {
        include: {
          questionSet: {
            include: {
              questions: {
                include: {
                  completed: {
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
    orderBy: {
      title: "asc",
    },
  });

  // Get total count for display
  const totalNovelsCount = allNovels.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/bpa">
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to BPA Levels
          </Button>
        </Link>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">{level.name}</h1>
            <div className="flex items-center gap-1">
              {Array.from({ length: level.stars }).map((_, i) => (
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
            {totalNovelsCount} unit{totalNovelsCount !== 1 ? "s" : ""}
          </Badge>
        </div>

        {level.description && (
          <p className="text-lg text-muted-foreground">{level.description}</p>
        )}
      </div>

      {/* Novels Grid */}
      {allNovels.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            No units available
          </h3>
          <p className="text-muted-foreground">
            Units for this BPA level are coming soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allNovels.map((novel) => {
            const isAccessible = accessibleNovelIds.includes(novel.id);
            const totalChapters = novel.chapters.length;
            const completedChapters = novel.chapters.filter((chapter) => {
              if (!chapter.questionSet) return false;

              const totalQuestions = chapter.questionSet.questions.length;
              const completedQuestions = chapter.questionSet.questions.filter(
                (question) =>
                  question.completed.some(
                    (comp) => comp.userId === userId,
                  ),
              ).length;

              return totalQuestions > 0 && completedQuestions === totalQuestions;
            }).length;

            const progressPercentage =
              totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

            if (isAccessible) {
              return (
                <Link key={novel.id} href={`/bpa/${levelId}/${novel.id}`}>
                  <Card className="h-full transition-all hover:shadow-lg cursor-pointer">
                    <CardHeader className="pb-4">
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
                        {novel.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{totalChapters} chapters</Badge>
                      </div>
                      {totalChapters > 0 && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>
                              {completedChapters}/{totalChapters}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0">
                      {novel.description && (
                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                          {novel.description}
                        </p>
                      )}
                      <Button className="w-full" variant="outline">
                        View Chapters
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            }

            return (
              <div key={novel.id}>
                <Card className="h-full transition-all opacity-75 cursor-not-allowed">
                  <CardHeader className="pb-4">
                    <h3 className="mb-2 line-clamp-2 text-lg font-semibold">
                      {novel.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{totalChapters} chapters</Badge>
                      {novel.comingSoon && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {novel.description && (
                      <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                        {novel.description}
                      </p>
                    )}
                    <Button className="w-full" variant="outline" disabled>
                      Not Your Level
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BPALevelNovelsSkeleton() {
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
          <Skeleton className="h-6 w-24" />
        </div>

        <Skeleton className="h-6 w-96" />
      </div>

      {/* Novels Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="pb-4">
              <Skeleton className="mb-2 h-6 w-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
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

export default async function Page({ params }: PageProps) {
  const { levelId } = await params;

  return (
    <Suspense fallback={<BPALevelNovelsSkeleton />}>
      <BPALevelNovels levelId={levelId} />
    </Suspense>
  );
}
