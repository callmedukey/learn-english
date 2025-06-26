"use client";

import { TrophyIcon } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDummyMonthlyRankings, getDummyMonthlyUserStats } from "@/lib/dummy-data/medal-dummy-data";

import { MonthlyRankingList } from "./monthly-ranking-list";

interface MonthlyLeaderboardDemoProps {
  userId: string;
  userGrade?: string;
}

export function MonthlyLeaderboardDemo({ userId, userGrade }: MonthlyLeaderboardDemoProps) {
  // Get dummy data
  const overallNovelRankings = getDummyMonthlyRankings("novel");
  const overallRcRankings = getDummyMonthlyRankings("rc");
  const gradeNovelRankings = getDummyMonthlyRankings("novel", userGrade);
  const gradeRcRankings = getDummyMonthlyRankings("rc", userGrade);
  const monthlyStats = getDummyMonthlyUserStats(userId);

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
              <Tabs defaultValue="novel" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-gray-200">
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
                <TabsContent value="novel" className="mt-0">
                  <MonthlyRankingList rankings={overallNovelRankings} currentUserId={userId} />
                </TabsContent>
                <TabsContent value="rc" className="mt-0">
                  <MonthlyRankingList rankings={overallRcRankings} currentUserId={userId} />
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
              <Tabs defaultValue="novel" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-gray-200">
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
                <TabsContent value="novel" className="mt-0">
                  <MonthlyRankingList rankings={gradeNovelRankings} currentUserId={userId} />
                </TabsContent>
                <TabsContent value="rc" className="mt-0">
                  <MonthlyRankingList rankings={gradeRcRankings} currentUserId={userId} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* User Monthly Stats */}
        <div className="w-full lg:col-span-2">
          <Card className="h-full gap-0 bg-white py-0 shadow-lg">
            <CardHeader className="rounded-t-lg bg-primary text-white">
              <CardTitle className="py-1 text-center text-lg font-semibold">
                My {monthlyStats.monthName} Points
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-center">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-amber-900">NOVEL</div>
                  <div className="text-2xl font-bold text-primary">
                    {monthlyStats.novelScore.toLocaleString()}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg font-bold text-amber-900">R.C</div>
                  <div className="text-2xl font-bold text-primary">
                    {monthlyStats.rcScore.toLocaleString()}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-amber-900">TOTAL</div>
                    <div className="text-3xl font-bold text-primary">
                      {(monthlyStats.novelScore + monthlyStats.rcScore).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}