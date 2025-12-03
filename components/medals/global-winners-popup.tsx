"use client";

import { Medal, Trophy, BookOpen, ChartBar } from "lucide-react";
import { useState } from "react";

import { dismissPopup } from "@/actions/popup-dismissal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type CategoryLeaderboard } from "@/server-queries/medals";

interface GlobalWinnersPopupProps {
  popupId: string;
  title: string;
  year: number;
  month: number;
  categoryLeaderboards: CategoryLeaderboard[];
  onClose: () => void;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const medalColors = {
  1: "text-amber-500",
  2: "text-gray-400",
  3: "text-orange-600",
} as const;

const medalLabels = {
  1: "1st",
  2: "2nd",
  3: "3rd",
} as const;

// Grade order for sorting
const gradeOrder = [
  "Adult",
  "Grade 12",
  "Grade 11",
  "Grade 10",
  "Grade 9",
  "Grade 8",
  "Grade 7",
  "Grade 6",
  "Grade 5",
  "Grade 4",
  "Grade 3",
  "Grade 2",
  "Grade 1",
  "Kinder",
];

export function GlobalWinnersPopup({
  popupId,
  title,
  year,
  month,
  categoryLeaderboards,
  onClose,
}: GlobalWinnersPopupProps) {
  const [activeTab, setActiveTab] = useState<"OVERALL" | "RC" | "AR">(
    "OVERALL"
  );

  const handleDismiss = async (dismissForMonth: boolean) => {
    try {
      await dismissPopup(popupId, dismissForMonth);
      onClose();
    } catch (error) {
      console.error("Failed to dismiss popup:", error);
    }
  };

  const monthName = monthNames[month - 1];

  // Group leaderboards by grade and category
  const leaderboardsByGradeAndCategory = categoryLeaderboards.reduce(
    (acc, lb) => {
      if (!acc[lb.grade]) {
        acc[lb.grade] = {
          OVERALL: null,
          RC: null,
          AR: null,
        };
      }
      acc[lb.grade][lb.category] = lb;
      return acc;
    },
    {} as Record<
      string,
      Record<"OVERALL" | "RC" | "AR", CategoryLeaderboard | null>
    >
  );

  // Sort grades according to order
  const sortedGrades = Object.keys(leaderboardsByGradeAndCategory).sort(
    (a, b) => {
      const aIndex = gradeOrder.indexOf(a);
      const bIndex = gradeOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
  );

  const getCategoryIcon = (category: "OVERALL" | "RC" | "AR") => {
    switch (category) {
      case "OVERALL":
        return <Trophy className="h-4 w-4" />;
      case "RC":
        return <BookOpen className="h-4 w-4" />;
      case "AR":
        return <ChartBar className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: "OVERALL" | "RC" | "AR") => {
    switch (category) {
      case "OVERALL":
        return "Overall";
      case "RC":
        return "RC";
      case "AR":
        return "Novel";
    }
  };

  const renderLeaderboardContent = (category: "OVERALL" | "RC" | "AR") => {
    return (
      <div className="space-y-6 py-4">
        {sortedGrades.map((grade) => {
          const leaderboard = leaderboardsByGradeAndCategory[grade][category];

          // Skip grades that don't have data for this category
          if (!leaderboard || leaderboard.topThree.length === 0) return null;

          return (
            <div key={`${grade}-${category}`} className="space-y-3">
              <h3 className="border-b pb-2 text-lg font-semibold text-primary">
                {grade}
              </h3>

              <div className="space-y-2">
                {leaderboard.topThree.map((winner) => (
                  <div
                    key={`${grade}-${category}-${winner.rank}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/50"
                  >
                    <Medal className={`h-6 w-6 ${medalColors[winner.rank]}`} />
                    <span className="w-10 font-medium">
                      {medalLabels[winner.rank]}
                    </span>
                    <span className="flex-1 font-medium">
                      {winner.user.nickname || "Anonymous"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {winner.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {sortedGrades.every(
          (grade) => !leaderboardsByGradeAndCategory[grade][category]
        ) && (
          <div className="py-8 text-center text-muted-foreground">
            No winners for {getCategoryLabel(category)} category this month.
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={() => handleDismiss(false)}>
      <DialogContent className="max-h-[85vh] w-full max-w-[calc(100%-1rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {title || `${monthName} ${year} Medal Winners`}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Congratulations to all the winners! 🎉
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="OVERALL" className="flex items-center gap-2">
              {getCategoryIcon("OVERALL")}
              Overall
            </TabsTrigger>
            <TabsTrigger value="RC" className="flex items-center gap-2">
              {getCategoryIcon("RC")}
              RC
            </TabsTrigger>
            <TabsTrigger value="AR" className="flex items-center gap-2">
              {getCategoryIcon("AR")}
              Novel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="OVERALL">
            {renderLeaderboardContent("OVERALL")}
          </TabsContent>

          <TabsContent value="RC">{renderLeaderboardContent("RC")}</TabsContent>

          <TabsContent value="AR">{renderLeaderboardContent("AR")}</TabsContent>
        </Tabs>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handleDismiss(true)}
            className="w-full sm:w-auto"
          >
            Don&apos;t show again this month
          </Button>
          <Button
            onClick={() => handleDismiss(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
