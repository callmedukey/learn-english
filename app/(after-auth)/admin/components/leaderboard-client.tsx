"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CountryFilter from "./country-filter";
import GradeLeaderboard from "./grade-leaderboard";
import LeaderboardTable from "./leaderboard-table";
import { CountryOption, LeaderboardUser } from "../queries/leaderboard.query";

interface LeaderboardClientProps {
  initialUsers: LeaderboardUser[];
  countries: CountryOption[];
}

export default function LeaderboardClient({
  initialUsers,
  countries,
}: LeaderboardClientProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Filter users based on selected country
  const filteredUsers = selectedCountry
    ? initialUsers.filter((user) => user.country?.id === selectedCountry)
    : initialUsers;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            User Leaderboard
          </h2>
          <p className="text-sm text-gray-600">
            Showing {filteredUsers.length} users
            {selectedCountry && (
              <span>
                {" "}
                from {countries.find((c) => c.id === selectedCountry)?.name}
              </span>
            )}
          </p>
        </div>
        <CountryFilter
          countries={countries}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b border-gray-200 bg-transparent p-0">
          <TabsTrigger
            value="global"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Leaderboard
          </TabsTrigger>
          <TabsTrigger
            value="grades"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            By Grade Level
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <LeaderboardTable users={filteredUsers} />
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <GradeLeaderboard users={filteredUsers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
