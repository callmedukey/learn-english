"use client";

import { Trophy, Award } from "lucide-react";

import { dismissPopup } from "@/actions/popup-dismissal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PersonalAchievementPopupProps {
  popupId: string;
  year: number;
  month: number;
  rankings: Array<{
    levelType: "AR" | "RC";
    levelId: string;
    levelName: string;
    rank: number;
    totalParticipants: number;
    score: number;
    grade: string;
  }>;
  onClose: () => void;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const getRankSuffix = (rank: number) => {
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th";
  }
  
  switch (lastDigit) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

export function PersonalAchievementPopup({
  popupId,
  year,
  month,
  rankings,
  onClose,
}: PersonalAchievementPopupProps) {
  const handleDismiss = async (dismissForMonth: boolean) => {
    try {
      await dismissPopup(popupId, dismissForMonth);
      onClose();
    } catch (error) {
      console.error("Failed to dismiss popup:", error);
    }
  };

  const monthName = monthNames[month - 1];

  return (
    <Dialog open onOpenChange={() => handleDismiss(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Certificate of Achievement</DialogTitle>
        </DialogHeader>
        
        {/* Certificate-style header */}
        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Award className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-primary">
            Certificate of Achievement
          </h1>
          
          <p className="text-lg text-muted-foreground">
            {monthName} {year} Monthly Challenge
          </p>
        </div>

        {/* Achievement details */}
        <div className="space-y-6 py-4 px-6 bg-muted/20 rounded-lg border-2 border-primary/20">
          {rankings.map((ranking) => {
            const rankWithSuffix = `${ranking.rank}${getRankSuffix(ranking.rank)}`;
            const isTopThree = ranking.rank <= 3;
            
            return (
              <div key={`${ranking.levelType}-${ranking.levelId}`} className="text-center space-y-2">
                <div className="flex justify-center items-center gap-2">
                  {isTopThree && <Trophy className="h-6 w-6 text-amber-500" />}
                  <h2 className="text-xl font-semibold">
                    {ranking.levelType === "AR" ? "NOVEL" : "RC"} Achievement
                  </h2>
                  {isTopThree && <Trophy className="h-6 w-6 text-amber-500" />}
                </div>
                
                <p className="text-lg">
                  Congratulations! You have achieved{" "}
                  <span className={`font-bold ${isTopThree ? "text-amber-500" : "text-primary"}`}>
                    {rankWithSuffix} place
                  </span>{" "}
                  in{" "}
                  <span className="font-semibold">
                    ({ranking.levelName} {ranking.levelType === "AR" ? "NOVEL" : "Reading Comprehension"})
                  </span>{" "}
                  for {ranking.grade} grade for {monthName} {year}.
                </p>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Score: {ranking.score} points</p>
                  <p>Out of {ranking.totalParticipants} participants</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Certificate footer */}
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>Keep up the excellent work!</p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
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