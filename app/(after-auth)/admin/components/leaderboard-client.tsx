"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import CampusFilter from "./campus-filter";
import CountryFilter from "./country-filter";
import GradeFilter from "./grade-filter";
import GradeLeaderboard from "./grade-leaderboard";
import LeaderboardTable from "./leaderboard-table";
import ScoreFilters, { ScoreFilterValues } from "./score-filters";
import SearchBar from "./search-bar";
import {
  CountryOption,
  LeaderboardResult,
} from "../queries/leaderboard.query";

interface LeaderboardClientProps {
  initialAllTimeData: LeaderboardResult;
  initialMonthlyData: LeaderboardResult;
  initialGradeData: LeaderboardResult;
  countries: CountryOption[];
  campuses: { id: string; name: string }[];
}

export default function LeaderboardClient({
  initialAllTimeData,
  initialMonthlyData,
  initialGradeData,
  countries,
  campuses,
}: LeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get("search") || ""
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    searchParams.get("country") || null
  );
  const [selectedGrade, setSelectedGrade] = useState<string | null>(
    searchParams.get("grade") || null
  );
  const [selectedCampus, setSelectedCampus] = useState<string | null>(
    searchParams.get("campus") || null
  );
  const [scoreFilters, setScoreFilters] = useState<ScoreFilterValues>({
    totalScoreMin: searchParams.get("totalScoreMin")
      ? Number(searchParams.get("totalScoreMin"))
      : undefined,
    totalScoreMax: searchParams.get("totalScoreMax")
      ? Number(searchParams.get("totalScoreMax"))
      : undefined,
    lexileScoreMin: searchParams.get("lexileScoreMin")
      ? Number(searchParams.get("lexileScoreMin"))
      : undefined,
    lexileScoreMax: searchParams.get("lexileScoreMax")
      ? Number(searchParams.get("lexileScoreMax"))
      : undefined,
    rcScoreMin: searchParams.get("rcScoreMin")
      ? Number(searchParams.get("rcScoreMin"))
      : undefined,
    rcScoreMax: searchParams.get("rcScoreMax")
      ? Number(searchParams.get("rcScoreMax"))
      : undefined,
  });

  // Pagination state for all-time leaderboard
  const [allTimePage, setAllTimePage] = useState<number>(
    Number(searchParams.get("allTimePage")) || 1
  );
  const [allTimePageSize, setAllTimePageSize] = useState<number>(
    Number(searchParams.get("allTimePageSize")) || 50
  );

  // Pagination state for monthly leaderboard
  const [monthlyPage, setMonthlyPage] = useState<number>(
    Number(searchParams.get("monthlyPage")) || 1
  );
  const [monthlyPageSize, setMonthlyPageSize] = useState<number>(
    Number(searchParams.get("monthlyPageSize")) || 50
  );

  // Grade tab state
  const [gradeTabSelectedGrade, setGradeTabSelectedGrade] = useState<string>(
    searchParams.get("gradeTabGrade") || "Grade 1"
  );
  const [gradeTabPage, setGradeTabPage] = useState<number>(
    Number(searchParams.get("gradeTabPage")) || 1
  );
  const [gradeTabPageSize, setGradeTabPageSize] = useState<number>(
    Number(searchParams.get("gradeTabPageSize")) || 100
  );

  // Data state
  const [allTimeData, setAllTimeData] =
    useState<LeaderboardResult>(initialAllTimeData);
  const [monthlyData, setMonthlyData] =
    useState<LeaderboardResult>(initialMonthlyData);
  const [gradeData, setGradeData] =
    useState<LeaderboardResult>(initialGradeData);

  // Update URL with current filter/pagination state
  const updateURL = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  // Refetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      const queryParams = new URLSearchParams();

      if (searchQuery) queryParams.set("search", searchQuery);
      if (selectedCountry) queryParams.set("country", selectedCountry);
      if (selectedGrade) queryParams.set("grade", selectedGrade);
      if (selectedCampus) queryParams.set("campus", selectedCampus);
      if (scoreFilters.totalScoreMin !== undefined)
        queryParams.set("totalScoreMin", String(scoreFilters.totalScoreMin));
      if (scoreFilters.totalScoreMax !== undefined)
        queryParams.set("totalScoreMax", String(scoreFilters.totalScoreMax));
      if (scoreFilters.lexileScoreMin !== undefined)
        queryParams.set("lexileScoreMin", String(scoreFilters.lexileScoreMin));
      if (scoreFilters.lexileScoreMax !== undefined)
        queryParams.set("lexileScoreMax", String(scoreFilters.lexileScoreMax));
      if (scoreFilters.rcScoreMin !== undefined)
        queryParams.set("rcScoreMin", String(scoreFilters.rcScoreMin));
      if (scoreFilters.rcScoreMax !== undefined)
        queryParams.set("rcScoreMax", String(scoreFilters.rcScoreMax));

      queryParams.set("allTimePage", String(allTimePage));
      queryParams.set("allTimePageSize", String(allTimePageSize));
      queryParams.set("monthlyPage", String(monthlyPage));
      queryParams.set("monthlyPageSize", String(monthlyPageSize));
      queryParams.set("gradeTabGrade", gradeTabSelectedGrade);
      queryParams.set("gradeTabPage", String(gradeTabPage));
      queryParams.set("gradeTabPageSize", String(gradeTabPageSize));

      try {
        const response = await fetch(`/api/admin/leaderboard?${queryParams}`);
        const data = await response.json();

        setAllTimeData(data.allTime);
        setMonthlyData(data.monthly);
        setGradeData(data.grade);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      }
    };

    fetchData();
  }, [
    searchQuery,
    selectedCountry,
    selectedGrade,
    selectedCampus,
    scoreFilters,
    allTimePage,
    allTimePageSize,
    monthlyPage,
    monthlyPageSize,
    gradeTabSelectedGrade,
    gradeTabPage,
    gradeTabPageSize,
  ]);

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setAllTimePage(1);
    setMonthlyPage(1);
    updateURL({ search: search || null, allTimePage: 1, monthlyPage: 1 });
  };

  const handleCountryChange = (country: string | null) => {
    setSelectedCountry(country);
    setAllTimePage(1);
    setMonthlyPage(1);
    updateURL({ country, allTimePage: 1, monthlyPage: 1 });
  };

  const handleGradeChange = (grade: string | null) => {
    setSelectedGrade(grade);
    setAllTimePage(1);
    setMonthlyPage(1);
    updateURL({ grade, allTimePage: 1, monthlyPage: 1 });
  };

  const handleCampusChange = (campus: string | null) => {
    setSelectedCampus(campus);
    setAllTimePage(1);
    setMonthlyPage(1);
    updateURL({ campus, allTimePage: 1, monthlyPage: 1 });
  };

  const handleScoreFiltersChange = (filters: ScoreFilterValues) => {
    setScoreFilters(filters);
    setAllTimePage(1);
    setMonthlyPage(1);
    updateURL({
      ...filters,
      totalScoreMin: filters.totalScoreMin,
      totalScoreMax: filters.totalScoreMax,
      lexileScoreMin: filters.lexileScoreMin,
      lexileScoreMax: filters.lexileScoreMax,
      rcScoreMin: filters.rcScoreMin,
      rcScoreMax: filters.rcScoreMax,
      allTimePage: 1,
      monthlyPage: 1,
    });
  };

  const handleAllTimePageChange = (page: number) => {
    setAllTimePage(page);
    updateURL({ allTimePage: page });
  };

  const handleAllTimePageSizeChange = (pageSize: number) => {
    setAllTimePageSize(pageSize);
    setAllTimePage(1);
    updateURL({ allTimePageSize: pageSize, allTimePage: 1 });
  };

  const handleMonthlyPageChange = (page: number) => {
    setMonthlyPage(page);
    updateURL({ monthlyPage: page });
  };

  const handleMonthlyPageSizeChange = (pageSize: number) => {
    setMonthlyPageSize(pageSize);
    setMonthlyPage(1);
    updateURL({ monthlyPageSize: pageSize, monthlyPage: 1 });
  };

  const handleGradeTabGradeChange = (grade: string) => {
    setGradeTabSelectedGrade(grade);
    setGradeTabPage(1);
    updateURL({ gradeTabGrade: grade, gradeTabPage: 1 });
  };

  const handleGradeTabPageChange = (page: number) => {
    setGradeTabPage(page);
    updateURL({ gradeTabPage: page });
  };

  const handleGradeTabPageSizeChange = (pageSize: number) => {
    setGradeTabPageSize(pageSize);
    setGradeTabPage(1);
    updateURL({ gradeTabPageSize: pageSize, gradeTabPage: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header with filter controls */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            User Leaderboard
          </h2>
          <p className="text-base text-gray-600">
            Showing {allTimeData.total} total users
            {selectedCountry && (
              <span>
                {" "}
                from {countries.find((c) => c.id === selectedCountry)?.name}
              </span>
            )}
            {selectedCampus && (
              <span>
                {" "}
                at {campuses.find((c) => c.id === selectedCampus)?.name}
              </span>
            )}
            {selectedGrade && <span> in {selectedGrade}</span>}
            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
          </p>
        </div>

        {/* Search bar */}
        <SearchBar value={searchQuery} onChange={handleSearchChange} />

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <CountryFilter
            countries={countries}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
          />
          <CampusFilter
            campuses={campuses}
            selectedCampus={selectedCampus}
            onCampusChange={handleCampusChange}
          />
          <GradeFilter
            selectedGrade={selectedGrade}
            onGradeChange={handleGradeChange}
          />
          <ScoreFilters
            filters={scoreFilters}
            onFiltersChange={handleScoreFiltersChange}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border-b border-gray-200 bg-transparent p-0">
          <TabsTrigger
            value="global"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            All Time
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Monthly
          </TabsTrigger>
          <TabsTrigger
            value="grades"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            By Grade Level
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6">
          <LeaderboardTable
            users={allTimeData.users}
            currentPage={allTimePage}
            pageSize={allTimePageSize}
            total={allTimeData.total}
            totalPages={allTimeData.totalPages}
            onPageChange={handleAllTimePageChange}
            onPageSizeChange={handleAllTimePageSizeChange}
          />
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <div className="mb-4">
            <p className="text-base text-gray-600">
              Showing rankings for{" "}
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <LeaderboardTable
            users={monthlyData.users}
            currentPage={monthlyPage}
            pageSize={monthlyPageSize}
            total={monthlyData.total}
            totalPages={monthlyData.totalPages}
            onPageChange={handleMonthlyPageChange}
            onPageSizeChange={handleMonthlyPageSizeChange}
          />
        </TabsContent>

        <TabsContent value="grades" className="mt-6">
          <GradeLeaderboard
            selectedGrade={gradeTabSelectedGrade}
            onGradeChange={handleGradeTabGradeChange}
            gradeData={gradeData}
            currentPage={gradeTabPage}
            pageSize={gradeTabPageSize}
            onPageChange={handleGradeTabPageChange}
            onPageSizeChange={handleGradeTabPageSizeChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
