import React, { Suspense } from "react";

import LeaderboardClient from "./components/leaderboard-client";
import LeaderboardStats from "./components/leaderboard-stats";
import { getCountries, getLeaderboardData, getMonthlyLeaderboardData } from "./queries/leaderboard.query";

async function LeaderboardData() {
  const [users, monthlyUsers, countries] = await Promise.all([
    getLeaderboardData(),
    getMonthlyLeaderboardData(),
    getCountries(),
  ]);

  return (
    <div className="space-y-8">
      <LeaderboardStats users={users} />
      <LeaderboardClient 
        initialUsers={users} 
        monthlyUsers={monthlyUsers}
        countries={countries} 
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
  );
}

const page = () => {
  return (
    <div className="px-1">
      <div className="mb-8">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Monitor user performance and engagement across countries and grades
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <LeaderboardData />
      </Suspense>
    </div>
  );
};

export default page;
