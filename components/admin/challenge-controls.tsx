"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChallengeControlsProps {
  onChallengeSettingsChange?: (settings: {
    createChallenge: boolean;
    year: number;
    month: number;
    scheduledActive: boolean;
  }) => void;
  defaultEnabled?: boolean;
}

export function ChallengeControls({
  onChallengeSettingsChange,
  defaultEnabled = false,
}: ChallengeControlsProps) {
  const [createChallenge, setCreateChallenge] = useState(defaultEnabled);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [scheduledActive, setScheduledActive] = useState(false);
  const [currentKoreaTime, setCurrentKoreaTime] = useState({ year: 0, month: 0 });

  useEffect(() => {
    // Get current Korea time on client
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    setCurrentKoreaTime({
      year: koreaTime.getFullYear(),
      month: koreaTime.getMonth() + 1,
    });
    setYear(koreaTime.getFullYear());
    setMonth(koreaTime.getMonth() + 1);
  }, []);

  useEffect(() => {
    onChallengeSettingsChange?.({
      createChallenge,
      year,
      month,
      scheduledActive,
    });
  }, [createChallenge, year, month, scheduledActive, onChallengeSettingsChange]);

  const isFutureChallenge = year > currentKoreaTime.year || 
    (year === currentKoreaTime.year && month > currentKoreaTime.month);

  const yearOptions = [];
  for (let y = currentKoreaTime.year; y <= currentKoreaTime.year + 2; y++) {
    yearOptions.push(y);
  }

  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="create-challenge"
          checked={createChallenge}
          onCheckedChange={(checked) => setCreateChallenge(checked as boolean)}
        />
        <Label htmlFor="create-challenge" className="font-medium">
          Create as Monthly Challenge
        </Label>
      </div>

      {createChallenge && (
        <div className="ml-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="challenge-year">Year</Label>
              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger id="challenge-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="challenge-month">Month</Label>
              <Select
                value={month.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger id="challenge-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isFutureChallenge && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scheduled-active"
                checked={scheduledActive}
                onCheckedChange={(checked) => setScheduledActive(checked as boolean)}
              />
              <Label htmlFor="scheduled-active" className="text-sm">
                Auto-activate when month arrives
              </Label>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {isFutureChallenge
              ? "This challenge will be created for a future month."
              : "This challenge will be active immediately."}
          </p>
        </div>
      )}
    </div>
  );
}

interface ExistingChallengesProps {
  challenges: Array<{
    id: string;
    year: number;
    month: number;
    active: boolean;
    scheduledActive: boolean;
    _count?: {
      medals: number;
    };
  }>;
  onEditChallenge?: (challengeId: string) => void;
}

export function ExistingChallenges({ challenges, onEditChallenge }: ExistingChallengesProps) {
  if (challenges.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        No challenges created for this level yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Existing Challenges</Label>
      <div className="space-y-2">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <span className="font-medium">
                {challenge.year}년 {challenge.month}월
              </span>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className={challenge.active ? "text-green-600" : "text-gray-500"}>
                  {challenge.active ? "Active" : "Inactive"}
                </span>
                {challenge.scheduledActive && (
                  <span className="text-blue-600">• Auto-activate scheduled</span>
                )}
                {challenge._count && challenge._count.medals > 0 && (
                  <span>• {challenge._count.medals} medals awarded</span>
                )}
              </div>
            </div>
            {onEditChallenge && (
              <button
                onClick={() => onEditChallenge(challenge.id)}
                className="text-sm text-blue-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface NovelKeywordChallengeToggleProps {
  levelId: string;
  levelType: "AR" | "RC";
  contentId?: string; // Novel or Keyword ID if editing existing content
  onIncludeInChallenge?: (include: boolean) => void;
}

export function NovelKeywordChallengeToggle({
  levelId,
  levelType,
  contentId,
  onIncludeInChallenge,
}: NovelKeywordChallengeToggleProps) {
  const [includeInChallenge, setIncludeInChallenge] = useState(false);
  const [hasCurrentChallenge, setHasCurrentChallenge] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a challenge for current month
    async function checkCurrentChallenge() {
      try {
        const response = await fetch(
          `/api/admin/challenges/check-current?levelType=${levelType}&levelId=${levelId}`
        );
        const data = await response.json();
        setHasCurrentChallenge(data.exists);
        
        // If editing existing content, check if it's already in the challenge
        if (contentId && data.exists && data.challenge) {
          const isIncluded = levelType === "AR" 
            ? data.challenge.novelIds?.includes(contentId)
            : data.challenge.keywordIds?.includes(contentId);
          setIncludeInChallenge(isIncluded || false);
        }
      } catch (error) {
        console.error("Failed to check current challenge:", error);
      } finally {
        setLoading(false);
      }
    }

    checkCurrentChallenge();
  }, [levelId, levelType, contentId]);

  useEffect(() => {
    onIncludeInChallenge?.(includeInChallenge);
  }, [includeInChallenge, onIncludeInChallenge]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading challenge info...</div>;
  }

  if (!hasCurrentChallenge) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm">
        <p className="text-yellow-800">
          No challenge exists for this {levelType === "AR" ? "AR level" : "RC level"} in the current month.
        </p>
        <p className="mt-1 text-xs text-yellow-700">
          Create a monthly challenge first, or use the option above to create one with this level.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="include-in-challenge"
        checked={includeInChallenge}
        onCheckedChange={(checked) => setIncludeInChallenge(checked as boolean)}
      />
      <Label htmlFor="include-in-challenge" className="text-sm">
        Include in current month&apos;s challenge
      </Label>
    </div>
  );
}