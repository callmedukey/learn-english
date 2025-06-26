"use client";

import { useState } from "react";

import { MedalHistoryDialog } from "./medal-history-dialog";
import { MedalLevelDisplay } from "./medal-level-display";

interface MedalLevelDisplayWithDialogProps {
  levelName: string;
  medals: {
    gold: { count: number; imageUrl: string };
    silver: { count: number; imageUrl: string };
    bronze: { count: number; imageUrl: string };
  };
  userId: string;
  preloadedHistory?: any[]; // Pre-loaded medal history for demo
}

export function MedalLevelDisplayWithDialog({ 
  levelName, 
  medals, 
  userId,
  preloadedHistory = []
}: MedalLevelDisplayWithDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [medalHistory, setMedalHistory] = useState<any[]>(preloadedHistory);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    setDialogOpen(true);
    
    // Fetch medal history if not already loaded and no preloaded data
    if (medalHistory.length === 0 && !loading && preloadedHistory.length === 0) {
      setLoading(true);
      try {
        const response = await fetch(`/api/user-stats/${userId}/medals`);
        if (response.ok) {
          const data = await response.json();
          setMedalHistory(data.medals || []);
        }
      } catch (error) {
        console.error("Failed to fetch medal history:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className="cursor-pointer transition-opacity hover:opacity-80"
      >
        <MedalLevelDisplay levelName={levelName} medals={medals} />
      </div>
      <MedalHistoryDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        userId={userId}
        medalHistory={medalHistory}
      />
    </>
  );
}