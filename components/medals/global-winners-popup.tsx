"use client";

import { Medal } from "lucide-react";
import Image from "next/image";

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

interface GlobalWinnersPopupProps {
  popupId: string;
  title: string;
  year: number;
  month: number;
  leaderboards: Array<{
    levelType: string;
    levelId: string;
    levelName: string;
    grade: string;
    goldUser?: { nickname: string | null; image: string | null } | null;
    goldScore?: number | null;
    silverUser?: { nickname: string | null; image: string | null } | null;
    silverScore?: number | null;
    bronzeUser?: { nickname: string | null; image: string | null } | null;
    bronzeScore?: number | null;
  }>;
  onClose: () => void;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const medalColors = {
  gold: "text-amber-500",
  silver: "text-gray-400",
  bronze: "text-orange-600",
};

// Helper to combine scores across all levels for a grade
function getTopScorersForGrade(gradeLeaderboards: GlobalWinnersPopupProps["leaderboards"]) {
  // Collect all users with their scores across all levels
  const userScores = new Map<string, { user: any; totalScore: number }>();
  
  gradeLeaderboards.forEach(lb => {
    // Process gold user
    if (lb.goldUser && lb.goldScore) {
      const key = lb.goldUser.nickname || "Anonymous";
      const existing = userScores.get(key) || { user: lb.goldUser, totalScore: 0 };
      existing.totalScore += lb.goldScore;
      userScores.set(key, existing);
    }
    
    // Process silver user
    if (lb.silverUser && lb.silverScore) {
      const key = lb.silverUser.nickname || "Anonymous";
      const existing = userScores.get(key) || { user: lb.silverUser, totalScore: 0 };
      existing.totalScore += lb.silverScore;
      userScores.set(key, existing);
    }
    
    // Process bronze user
    if (lb.bronzeUser && lb.bronzeScore) {
      const key = lb.bronzeUser.nickname || "Anonymous";
      const existing = userScores.get(key) || { user: lb.bronzeUser, totalScore: 0 };
      existing.totalScore += lb.bronzeScore;
      userScores.set(key, existing);
    }
  });
  
  // Sort by total score and return top 3
  return Array.from(userScores.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 3);
}

// Helper to clean up grade display
function formatGradeDisplay(grade: string): string {
  // Remove duplicate "Grade" text if it exists
  if (grade.includes("Grade") && grade.endsWith("Grade")) {
    return grade.replace(/\s*Grade$/, "");
  }
  return grade;
}

// Grade order for sorting
const gradeOrder = ["Adult", "Grade 12", "Grade 11", "Grade 10", "Grade 9", "Grade 8", "Grade 7", "Grade 6", "Grade 5", "Grade 4", "Grade 3", "Grade 2", "Grade 1", "Kinder"];

export function GlobalWinnersPopup({
  popupId,
  title,
  year,
  month,
  leaderboards,
  onClose,
}: GlobalWinnersPopupProps) {
  const handleDismiss = async (dismissForMonth: boolean) => {
    try {
      await dismissPopup(popupId, dismissForMonth);
      onClose();
    } catch (error) {
      console.error("Failed to dismiss popup:", error);
    }
  };

  const monthName = monthNames[month - 1];

  // Group leaderboards by grade
  const leaderboardsByGrade = leaderboards.reduce((acc, lb) => {
    const cleanGrade = formatGradeDisplay(lb.grade);
    if (!acc[cleanGrade]) {
      acc[cleanGrade] = [];
    }
    acc[cleanGrade].push(lb);
    return acc;
  }, {} as Record<string, typeof leaderboards>);

  // Sort grades according to order
  const sortedGrades = Object.keys(leaderboardsByGrade).sort((a, b) => {
    const aIndex = gradeOrder.indexOf(a);
    const bIndex = gradeOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <Dialog open onOpenChange={() => handleDismiss(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {title || `${monthName} ${year} Medal Winners`}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Congratulations to all the winners! 🎉
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {sortedGrades.map((grade) => {
            const gradeLeaderboards = leaderboardsByGrade[grade];
            const topScorers = getTopScorersForGrade(gradeLeaderboards);
            
            // Only show grades that have winners
            if (topScorers.length === 0) return null;
            
            return (
              <div key={grade} className="space-y-3">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">
                  {grade}
                </h3>
                
                <div className="space-y-2">
                  {topScorers.map((scorer, index) => {
                    const medal = index === 0 ? "gold" : index === 1 ? "silver" : "bronze";
                    const place = index === 0 ? "1st" : index === 1 ? "2nd" : "3rd";
                    
                    return (
                      <div key={`${grade}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <Medal className={`h-6 w-6 ${medalColors[medal]}`} />
                        <span className="font-medium w-10">{place}</span>
                        <span className="flex-1 font-medium">
                          {scorer.user.nickname || "Anonymous"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {scorer.totalScore} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
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