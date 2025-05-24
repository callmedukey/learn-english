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

import { NovelCard } from "../components/novel-card";

interface PageProps {
  params: Promise<{ arId: string }>;
}

async function ARNovels({ arId }: { arId: string }) {
  const session = await auth();
  const userId = session?.user?.id;

  const ar = await prisma.aR.findUnique({
    where: { id: arId },
    include: {
      novels: {
        include: {
          image: true,
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
        orderBy: {
          title: "asc",
        },
      },
    },
  });

  if (!ar) {
    notFound();
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
            Back to AR Levels
          </Button>
        </Link>

        <div className="mb-4 flex items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">
            AR Level {ar.level}
          </h1>
          <div className="flex items-center gap-1">
            {Array.from({ length: ar.stars }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            Grade {ar.relevantGrade}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            Score: {ar.score}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            {ar.novels.length} novel{ar.novels.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {ar.description && (
          <p className="text-lg text-muted-foreground">{ar.description}</p>
        )}
      </div>

      {/* Novels Grid */}
      {ar.novels.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            No novels available
          </h3>
          <p className="text-muted-foreground">
            Novels for this AR level are coming soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ar.novels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              arId={arId}
              userId={userId}
            />
          ))}
        </div>
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

export default async function Page({ params }: PageProps) {
  const { arId } = await params;

  return (
    <Suspense fallback={<ARNovelsSkeleton />}>
      <ARNovels arId={arId} />
    </Suspense>
  );
}
