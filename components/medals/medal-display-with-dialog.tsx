"use client";

import { useState } from "react";

import { MedalHistoryDialog } from "./medal-history-dialog";
import { MedalRowDisplay } from "./medal-row-display";

interface Medal {
  levelType: string;
  levelId: string;
  levelName: string;
  medalType: "GOLD" | "SILVER" | "BRONZE";
  count: number;
  imageUrl: string | null;
}

interface MedalDisplayWithDialogProps {
  medals: Medal[];
  userId: string;
  maxDisplay?: number;
}

export function MedalDisplayWithDialog({ medals, userId, maxDisplay = 6 }: MedalDisplayWithDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [medalHistory, setMedalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    setDialogOpen(true);
    
    // Fetch medal history if not already loaded
    if (medalHistory.length === 0 && !loading) {
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
        <MedalRowDisplay medals={medals} maxDisplay={maxDisplay} />
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