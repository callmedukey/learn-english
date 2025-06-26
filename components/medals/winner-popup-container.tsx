"use client";

import { useState } from "react";

import { type MonthlyPopup } from "@/prisma/generated/prisma";

import { GlobalWinnersPopup } from "./global-winners-popup";
import { PersonalAchievementPopup } from "./personal-achievement-popup";

interface WinnerPopupContainerProps {
  popups: Array<MonthlyPopup & {
    dismissals?: Array<{ dismissedForMonth: boolean }>;
  }>;
  leaderboardData?: any; // For global winners popup
  personalRankings?: Array<{
    levelType: "AR" | "RC";
    levelId: string;
    levelName: string;
    rank: number;
    totalParticipants: number;
    score: number;
    grade: string;
  }>;
}

export function WinnerPopupContainer({
  popups,
  leaderboardData,
  personalRankings,
}: WinnerPopupContainerProps) {
  const [closedPopupIds, setClosedPopupIds] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Find the first popup that hasn't been closed and has required data
  const currentPopup = popups.find(popup => {
    if (closedPopupIds.has(popup.id)) return false;
    
    if (popup.type === "GLOBAL_WINNERS" && !leaderboardData) return false;
    if (popup.type === "PERSONAL_ACHIEVEMENT" && (!personalRankings || personalRankings.length === 0)) return false;
    
    return true;
  });

  const handleClose = () => {
    if (!currentPopup) return;
    
    // Add a small delay to prevent dialog overlap issues
    setIsTransitioning(true);
    setClosedPopupIds(prev => new Set(prev).add(currentPopup.id));
    
    // Reset transition state after a short delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  };

  // Don't render anything if no popup to show or transitioning
  if (!currentPopup || isTransitioning) {
    return null;
  }

  // Show appropriate popup based on type
  if (currentPopup.type === "GLOBAL_WINNERS" && leaderboardData) {
    return (
      <GlobalWinnersPopup
        popupId={currentPopup.id}
        title={currentPopup.title}
        year={currentPopup.year}
        month={currentPopup.month}
        leaderboards={leaderboardData}
        onClose={handleClose}
      />
    );
  }

  if (currentPopup.type === "PERSONAL_ACHIEVEMENT" && personalRankings && personalRankings.length > 0) {
    return (
      <PersonalAchievementPopup
        popupId={currentPopup.id}
        year={currentPopup.year}
        month={currentPopup.month}
        rankings={personalRankings}
        onClose={handleClose}
      />
    );
  }

  return null;
}