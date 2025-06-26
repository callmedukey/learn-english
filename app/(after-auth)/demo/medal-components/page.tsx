"use client";

import { useState } from "react";

import { MonthlyLeaderboardDemo } from "@/components/leaderboard/monthly-leaderboard-demo";
import { UserStatsContent } from "@/components/leaderboard/user-stats-content";
import { MedalLevelDisplayWithDialog } from "@/components/medals/medal-level-display-with-dialog";
import { WinnerPopupContainer } from "@/components/medals/winner-popup-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getCompleteDummyData, 
  dummyUsers,
  getDummyGlobalWinnersData,
  getDummyPersonalRankings,
  getDummyPopups,
  getDummyUserStats
} from "@/lib/dummy-data/medal-dummy-data";

// Mock the API calls that components make
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    
    // Intercept user stats API calls
    if (url.includes("/api/user-stats/")) {
      const userId = url.split("/api/user-stats/")[1].split("/")[0];
      const isModalRequest = url.includes("/medals");
      
      if (isModalRequest) {
        // Return medal history for modal
        const userStats = getDummyUserStats(userId);
        return new Response(JSON.stringify({ medals: userStats.medals?.recent || [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // Return full user stats
        const userStats = getDummyUserStats(userId);
        return new Response(JSON.stringify(userStats), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    
    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };
}

export default function MedalComponentsDemo() {
  const [selectedUserId, setSelectedUserId] = useState("user-1");
  const [showPopups, setShowPopups] = useState(true);
  
  const selectedUser = dummyUsers.find(u => u.id === selectedUserId) || dummyUsers[0];
  const dummyData = getCompleteDummyData(selectedUserId);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Medal Components Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="user-select" className="text-sm font-medium">
              Select User:
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dummyUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nickname} ({user.grade})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setShowPopups(!showPopups)}
            >
              {showPopups ? "Hide" : "Show"} Popups
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Current User: <strong>{selectedUser.nickname}</strong> - Grade: <strong>{selectedUser.grade}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Winner Popups */}
      {showPopups && (
        <WinnerPopupContainer
          popups={getDummyPopups()}
          leaderboardData={getDummyGlobalWinnersData()}
          personalRankings={getDummyPersonalRankings(selectedUserId)}
        />
      )}

      {/* Monthly Leaderboard */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Monthly Leaderboard Component</h2>
        <div className="bg-gray-50 rounded-lg">
          <MonthlyLeaderboardDemo 
            userId={selectedUserId} 
            userGrade={selectedUser.grade}
          />
        </div>
      </section>

      {/* User Stats Content (as shown in popover) */}
      <section>
        <h2 className="text-2xl font-bold mb-4">User Stats Content Component</h2>
        <Card className="max-w-md">
          <UserStatsContent userId={selectedUserId} />
        </Card>
      </section>

      {/* Medal Level Display */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Medal Level Display Component</h2>
        <Card className="max-w-md">
          <CardContent className="pt-6 space-y-4">
            {dummyData.userStats.medals?.medalsByLevel?.map((level) => (
              <MedalLevelDisplayWithDialog
                key={`${level.levelType}-${level.levelId}`}
                levelName={level.levelName}
                medals={level.medals}
                userId={selectedUserId}
                preloadedHistory={dummyData.userStats.medals?.recent || []}
              />
            ))}
            {(!dummyData.userStats.medals?.medalsByLevel || 
              dummyData.userStats.medals.medalsByLevel.length === 0) && (
              <p className="text-center text-muted-foreground">
                No medals earned yet for this user
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Data Preview */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Current User Data (Debug)</h2>
        <Card>
          <CardContent className="pt-6">
            <pre className="text-xs overflow-auto max-h-96 bg-gray-100 p-4 rounded">
              {JSON.stringify(dummyData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}