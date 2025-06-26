import { Suspense } from "react";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/prisma/prisma-client";
import { getUserLevelLock } from "@/server-queries/level-locks";

import { ARCard } from "./components/ar-card";

async function ARChoices() {
  const session = await auth();
  const userId = session?.user?.id;

  const arChoices = await prisma.aR.findMany({
    include: {
      novels: {
        where: {
          hidden: false,
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
                  NovelQuestionFirstTry: userId
                    ? {
                        where: {
                          userId: userId,
                        },
                      }
                    : undefined,
                  NovelQuestionSecondTry: userId
                    ? {
                        where: {
                          userId: userId,
                        },
                      }
                    : undefined,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      stars: "asc",
    },
  });

  // Fetch medal images for each AR level
  const medalImages = await prisma.medalImage.findMany({
    where: {
      levelType: "AR",
      levelId: {
        in: arChoices.map((ar) => ar.id),
      },
    },
  });

  // Create a map for easy lookup
  const medalImageMap = new Map<string, typeof medalImages>();
  medalImages.forEach((medalImage) => {
    const key = medalImage.levelId;
    if (!medalImageMap.has(key)) {
      medalImageMap.set(key, []);
    }
    medalImageMap.get(key)!.push(medalImage);
  });

  // Add medal images to each AR choice
  const arChoicesWithMedals = arChoices.map((ar) => ({
    ...ar,
    medalImages: medalImageMap.get(ar.id) || [],
  }));

  // Get user's level lock for AR if they're logged in
  const userLevelLock = userId ? await getUserLevelLock(userId, "AR") : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Choose Your Reading Level
        </h1>
        <p className="text-muted-foreground">
          Select a Lexile level to explore novels tailored to your reading
          ability.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {arChoicesWithMedals.map((ar) => (
          <ARCard
            key={ar.id}
            ar={ar}
            userId={userId}
            isUserSelectedLevel={userLevelLock?.levelId === ar.id}
          />
        ))}
      </div>
    </div>
  );
}

function ARChoicesSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <div className="flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-4" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-4 h-4 w-3/4" />

              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const page = () => {
  return (
    <Suspense fallback={<ARChoicesSkeleton />}>
      <ARChoices />
    </Suspense>
  );
};

export default page;
