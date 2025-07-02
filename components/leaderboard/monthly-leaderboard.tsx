import { TrophyIcon } from "lucide-react";
import React, { Suspense } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MonthlyGradeRanking } from "./monthly-grade-ranking";
import { MonthlyOverallRanking } from "./monthly-overall-ranking";
import { MonthlyTotalGradeRanking } from "./monthly-total-grade-ranking";
import { MonthlyTotalOverallRanking } from "./monthly-total-overall-ranking";
import { MonthlyUserStats } from "./monthly-user-stats";

interface MonthlyLeaderboardProps {
  userId: string;
  userGrade?: string;
}

export function MonthlyLeaderboard({ userId, userGrade }: MonthlyLeaderboardProps) {
  return (
    <div className="p-4">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="text-4xl font-bold text-amber-900">Monthly Leaderboard</h1>
        <TrophyIcon className="h-8 w-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-6">
        {/* Overall Ranking */}
        <div className="lg:col-span-2">
          <Card className="h-full gap-0 bg-white py-0 shadow-lg">
            <CardHeader className="rounded-t-lg bg-primary text-white">
              <CardTitle className="py-1 text-center text-lg font-semibold">
                Overall Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="total" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none bg-gray-200">
                  <TabsTrigger
                    value="total"
                    className="font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
                  >
                    TOTAL
                  </TabsTrigger>
                  <TabsTrigger
                    value="novel"
                    className="font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
                  >
                    NOVEL
                  </TabsTrigger>
                  <TabsTrigger
                    value="rc"
                    className="font-semibold data-[state=active]:bg-white data-[state=active]:text-primary"
                  >
                    R.C
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="total" className="mt-0">
                  <Suspense fallback={<MonthlyLeaderboardSkeleton />}>
                    <MonthlyTotalOverallRanking userId={userId} />
                  </Suspense>
                </TabsContent>
                <TabsContent value="novel" className="mt-0">
                  <Suspense fallback={<MonthlyLeaderboardSkeleton />}>
                    <MonthlyOverallRanking type="novel" userId={userId} />
                  </Suspense>
                </TabsContent>
                <TabsContent value="rc" className="mt-0">
                  <Suspense fallback={<MonthlyLeaderboardSkeleton />}>
                    <MonthlyOverallRanking type="rc" userId={userId} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Grade Ranking */}
        <div className="lg:col-span-2">
          <Card className="h-full gap-0 bg-white py-0 shadow-lg">
            <CardHeader className="rounded-t-lg bg-primary text-white">
              <CardTitle className="py-1 text-center text-lg font-semibold">
                My Grade Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="total" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none bg-gray-200">
                  <TabsTrigger
                    value="total"
                    className="font-semibold data-[state=active]:bg-white data-[state=active]:text-amber-900"
                  >
                    TOTAL
                  </TabsTrigger>
                  <TabsTrigger
                    value="novel"
                    className="font-semibold data-[state=active]:bg-white data-[state=active]:text-amber-900"
                  >
                    NOVEL
                  </TabsTrigger>
                  <TabsTrigger
                    value="rc"
                    className="font-semibold data-[state=active]:bg-white data-[state=active]:text-amber-900"
                  >
                    R.C
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="total" className="mt-0">
                  <Suspense fallback={<MonthlyLeaderboardSkeleton />}>
                    <MonthlyTotalGradeRanking
                      userId={userId}
                      userGrade={userGrade}
                    />
                  </Suspense>
                </TabsContent>
                <TabsContent value="novel" className="mt-0">
                  <Suspense fallback={<MonthlyLeaderboardSkeleton />}>
                    <MonthlyGradeRanking
                      type="novel"
                      userId={userId}
                      userGrade={userGrade}
                    />
                  </Suspense>
                </TabsContent>
                <TabsContent value="rc" className="mt-0">
                  <Suspense fallback={<MonthlyLeaderboardSkeleton />}>
                    <MonthlyGradeRanking
                      type="rc"
                      userId={userId}
                      userGrade={userGrade}
                    />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* User Monthly Stats */}
        <div className="w-full lg:col-span-2">
          <Suspense fallback={<MonthlyUserStatsSkeleton />}>
            <MonthlyUserStats userId={userId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function MonthlyLeaderboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-4 px-2 text-xs font-semibold text-gray-600">
        <div>NICKNAME</div>
        <div>GRADE</div>
        <div>POINT</div>
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-2">
          <div className="w-6 text-center font-bold text-gray-600">{i}</div>
          <div className="flex flex-1 items-center gap-2">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 flex-1" />
          </div>
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function MonthlyUserStatsSkeleton() {
  return (
    <Card className="h-full gap-0 bg-white py-0 shadow-lg">
      <CardHeader className="rounded-t-lg bg-primary text-white">
        <CardTitle className="py-1 text-center text-lg font-semibold">
          My Monthly Points & Rank
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-amber-900">NOVEL</div>
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-amber-900">R.C</div>
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <div className="text-lg font-bold text-amber-900">TOTAL</div>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mx-auto h-8 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}