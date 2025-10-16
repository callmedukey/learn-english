"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import CampusFilter from "./campus-filter";
import CampusLeaderboardTable from "./campus-leaderboard-table";
import SemesterSelector from "./semester-selector";
import { CampusLeaderboardResult } from "../queries/campus-leaderboard.query";

interface BPASemester {
  id: string;
  season: "SPRING" | "SUMMER" | "FALL" | "WINTER";
  startDate: Date;
  endDate: Date;
}

interface BPATimeframe {
  id: string;
  year: number;
  startDate: Date;
  endDate: Date;
  semesters: BPASemester[];
}

interface CampusLeaderboardClientProps {
  initialData: CampusLeaderboardResult;
  timeframes: BPATimeframe[];
  campuses: { id: string; name: string }[];
  bpaLevels: { id: string; name: string; orderNumber: number }[];
}

export default function CampusLeaderboardClient({
  initialData,
  timeframes,
  campuses,
  bpaLevels,
}: CampusLeaderboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Find timeframe and semester that match today's date
  const today = new Date();
  const activeTimeframe = timeframes.find(tf =>
    new Date(tf.startDate) <= today && new Date(tf.endDate) >= today
  );
  const activeSemester = activeTimeframe?.semesters.find(sem =>
    new Date(sem.startDate) <= today && new Date(sem.endDate) >= today
  );

  // State for filters (with campus prefix to avoid conflicts with user leaderboard)
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string | null>(
    searchParams.get("timeframeId") || activeTimeframe?.id || (timeframes.length > 0 ? timeframes[0].id : null)
  );
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(
    searchParams.get("semesterId") || activeSemester?.id || null
  );
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(
    searchParams.get("campusId") || null
  );
  const [selectedBPALevelId, setSelectedBPALevelId] = useState<string | null>(
    searchParams.get("bpaLevelId") || null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    searchParams.get("unitId") || null
  );
  const [selectedGrade, setSelectedGrade] = useState<string | null>(
    searchParams.get("grade") || null
  );
  const [availableUnits, setAvailableUnits] = useState<
    { id: string; name: string; orderNumber: number }[]
  >([]);

  // Pagination state (with campus prefix)
  const [page, setPage] = useState<number>(Number(searchParams.get("campusPage")) || 1);
  const [pageSize, setPageSize] = useState<number>(
    Number(searchParams.get("campusPageSize")) || 20
  );

  // Data state
  const [data, setData] = useState<CampusLeaderboardResult>(initialData);

  // Update URL with current state
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

  // Fetch units when BPA level changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedBPALevelId) {
        setAvailableUnits([]);
        return;
      }

      try {
        const response = await fetch(`/api/admin/bpa/units?levelId=${selectedBPALevelId}`);
        if (response.ok) {
          const result = await response.json();
          setAvailableUnits(result.units || []);
        }
      } catch (error) {
        console.error("Failed to fetch units:", error);
        setAvailableUnits([]);
      }
    };

    fetchUnits();
  }, [selectedBPALevelId]);

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedSemesterId && !selectedTimeframeId) {
        return;
      }

      const queryParams = new URLSearchParams();

      if (selectedTimeframeId) queryParams.set("timeframeId", selectedTimeframeId);
      if (selectedSemesterId) queryParams.set("semesterId", selectedSemesterId);
      if (selectedCampusId) queryParams.set("campusId", selectedCampusId);
      if (selectedBPALevelId) queryParams.set("bpaLevelId", selectedBPALevelId);
      if (selectedUnitId) queryParams.set("unitId", selectedUnitId);
      if (selectedGrade) queryParams.set("grade", selectedGrade);
      queryParams.set("campusPage", String(page));
      queryParams.set("campusPageSize", String(pageSize));

      try {
        const response = await fetch(`/api/admin/campus-leaderboard?${queryParams}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch campus leaderboard data:", error);
      }
    };

    fetchData();
  }, [
    selectedTimeframeId,
    selectedSemesterId,
    selectedCampusId,
    selectedBPALevelId,
    selectedUnitId,
    selectedGrade,
    page,
    pageSize,
  ]);

  const handleTimeframeChange = (timeframeId: string) => {
    setSelectedTimeframeId(timeframeId);
    setSelectedSemesterId(null);
    setPage(1);
    updateURL({ timeframeId, semesterId: null, campusPage: 1 });
  };

  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setPage(1);
    updateURL({ semesterId, campusPage: 1 });
  };

  const handleCampusChange = (campusId: string | null) => {
    setSelectedCampusId(campusId);
    setPage(1);
    updateURL({ campusId, campusPage: 1 });
  };

  const handleBPALevelChange = (levelId: string | null) => {
    setSelectedBPALevelId(levelId);
    setSelectedUnitId(null);
    setPage(1);
    updateURL({ bpaLevelId: levelId, unitId: null, campusPage: 1 });
  };

  const handleUnitChange = (unitId: string | null) => {
    setSelectedUnitId(unitId);
    setPage(1);
    updateURL({ unitId, campusPage: 1 });
  };

  const handleGradeChange = (grade: string | null) => {
    setSelectedGrade(grade);
    setPage(1);
    updateURL({ grade, campusPage: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ campusPage: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    updateURL({ campusPageSize: newPageSize, campusPage: 1 });
  };

  const selectedTimeframe = timeframes.find((t) => t.id === selectedTimeframeId);
  const selectedSemester = selectedTimeframe?.semesters.find(
    (s) => s.id === selectedSemesterId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Campus Student Rankings</h2>
        <p className="text-base text-gray-600">
          Showing {data.total} students
          {selectedSemester && <span> for {selectedSemester.season} semester</span>}
          {selectedCampusId && (
            <span>
              {" "}
              - filtering {campuses.find((c) => c.id === selectedCampusId)?.name}
            </span>
          )}
          {selectedBPALevelId && (
            <span>
              {" "}
              - {bpaLevels.find((l) => l.id === selectedBPALevelId)?.name}
            </span>
          )}
          {selectedGrade && (
            <span>
              {" "}
              - {selectedGrade}
            </span>
          )}
        </p>
      </div>

      {/* Semester Selector */}
      <SemesterSelector
        timeframes={timeframes}
        selectedTimeframeId={selectedTimeframeId}
        selectedSemesterId={selectedSemesterId}
        onTimeframeChange={handleTimeframeChange}
        onSemesterChange={handleSemesterChange}
      />

      {/* Filters */}
      {(selectedSemesterId || selectedTimeframeId) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <CampusFilter
            campuses={campuses}
            selectedCampus={selectedCampusId}
            onCampusChange={handleCampusChange}
          />

          <div className="flex items-center gap-2">
            <label htmlFor="bpa-level-select" className="text-base font-medium">
              BPA Level:
            </label>
            <select
              id="bpa-level-select"
              value={selectedBPALevelId || ""}
              onChange={(e) => handleBPALevelChange(e.target.value || null)}
              className="rounded-md border border-gray-300 px-3 py-2 text-base"
            >
              <option value="">All Levels</option>
              {bpaLevels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="unit-select" className="text-base font-medium">
              Unit:
            </label>
            <select
              id="unit-select"
              value={selectedUnitId || ""}
              onChange={(e) => handleUnitChange(e.target.value || null)}
              disabled={!selectedBPALevelId || availableUnits.length === 0}
              className="rounded-md border border-gray-300 px-3 py-2 text-base disabled:opacity-50"
            >
              <option value="">All Units</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="grade-select" className="text-base font-medium">
              Grade:
            </label>
            <select
              id="grade-select"
              value={selectedGrade || ""}
              onChange={(e) => handleGradeChange(e.target.value || null)}
              className="rounded-md border border-gray-300 px-3 py-2 text-base"
            >
              <option value="">All Grades</option>
              <option value="Kinder">Kinder</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                <option key={grade} value={`Grade ${grade}`}>
                  Grade {grade}
                </option>
              ))}
              <option value="Adult">Adult</option>
            </select>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Results Table */}
      {selectedSemesterId || selectedTimeframeId ? (
        <CampusLeaderboardTable
          students={data.students}
          currentPage={page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          Please select a timeframe to view student rankings
        </div>
      )}
    </div>
  );
}
