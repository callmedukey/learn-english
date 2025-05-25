import { ArrowLeft, FileText, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/prisma/prisma-client";

import { RCQuestionInterface } from "./components/rc-question-interface";

interface PageProps {
  params: Promise<{ rcLevelId: string; keywordId: string }>;
}

async function RCKeywordContent({
  rcLevelId,
  keywordId,
}: {
  rcLevelId: string;
  keywordId: string;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const keyword = await prisma.rCKeyword.findUnique({
    where: { id: keywordId },
    include: {
      RCLevel: true,
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

  if (!keyword || keyword.rcLevelId !== rcLevelId) {
    notFound();
  }

  // Check if user has access
  if (!keyword.isFree && !userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href={`/rc/${rcLevelId}`}>
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>

        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            Premium Content
          </h3>
          <p className="mb-4 text-muted-foreground">
            This topic requires a premium subscription to access.
          </p>
          <Button>Upgrade to Premium</Button>
        </div>
      </div>
    );
  }

  if (!keyword.RCQuestionSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href={`/rc/${rcLevelId}`}>
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>

        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">
            Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Questions for this topic are being prepared.
          </p>
        </div>
      </div>
    );
  }

  // Calculate progress
  const totalQuestions = keyword.RCQuestionSet.RCQuestion.length;
  const completedQuestions = keyword.RCQuestionSet.RCQuestion.filter(
    (question) =>
      question.RCQuestionCompleted.some(
        (completed) => completed.userId === userId,
      ),
  ).length;

  const progressPercentage =
    totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/rc/${rcLevelId}`}>
          <Button
            variant="ghost"
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Topics
          </Button>
        </Link>

        <div className="mb-4 flex items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">{keyword.name}</h1>
          <div className="flex items-center gap-1">
            {Array.from({ length: keyword.RCLevel.stars }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            RC Level {keyword.RCLevel.level}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            Grade {keyword.RCLevel.relevantGrade}
          </Badge>
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-muted-foreground"
          >
            <FileText className="mr-1 h-3 w-3" />
            {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
          </Badge>
          {userId && (
            <Badge
              variant="secondary"
              className="border-amber-200 bg-amber-100 text-amber-800"
            >
              {Math.round(progressPercentage)}% complete
            </Badge>
          )}
        </div>

        {keyword.description && (
          <p className="text-lg text-muted-foreground">{keyword.description}</p>
        )}
      </div>

      {/* Reading Passage and Questions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Reading Passage */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {keyword.RCQuestionSet.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-foreground">
              {keyword.RCQuestionSet.passage
                .split("\n")
                .map((paragraph, index) => (
                  <p key={index} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions Interface */}
        <div className="space-y-6">
          <RCQuestionInterface
            questionSet={keyword.RCQuestionSet}
            userId={userId}
            keywordId={keywordId}
            rcLevelId={rcLevelId}
          />
        </div>
      </div>
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

export default async function Page({ params }: PageProps) {
  const { rcLevelId, keywordId } = await params;

  return (
    <Suspense fallback={<RCKeywordContentSkeleton />}>
      <RCKeywordContent rcLevelId={rcLevelId} keywordId={keywordId} />
    </Suspense>
  );
}
