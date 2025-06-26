"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { setDialogInteracting } from "@/components/leaderboard/user-stats-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MedalType } from "@/prisma/generated/prisma";

interface MedalHistoryItem {
  id: string;
  medalType: MedalType;
  levelType: string;
  levelName: string;
  year: number;
  month: number;
  score: number;
  imageUrl?: string | null;
  earnedAt?: Date;
}

interface MedalHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  medalHistory?: MedalHistoryItem[];
}

// Default medal colors as fallback
const medalColors = {
  GOLD: "#FFD700",
  SILVER: "#C0C0C0",
  BRONZE: "#CD7F32",
} as const;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MedalHistoryDialog({ 
  open, 
  onOpenChange, 
  medalHistory = []
}: MedalHistoryDialogProps) {
  const [selectedType, setSelectedType] = useState<MedalType | "ALL">("ALL");

  // Set flag when dialog is open
  useEffect(() => {
    if (open) {
      setDialogInteracting(true);
      // Keep the flag active for a bit after dialog opens
      const timeout = setTimeout(() => {
        setDialogInteracting(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Filter medals by type
  const filteredMedals = selectedType === "ALL" 
    ? medalHistory 
    : medalHistory.filter(m => m.medalType === selectedType);

  // Group medals by year and month
  const groupedMedals = filteredMedals.reduce((acc, medal) => {
    const key = `${medal.year}-${medal.month}`;
    if (!acc[key]) {
      acc[key] = {
        year: medal.year,
        month: medal.month,
        medals: []
      };
    }
    acc[key].medals.push(medal);
    return acc;
  }, {} as Record<string, { year: number; month: number; medals: MedalHistoryItem[] }>);

  // Sort by year and month (newest first)
  const sortedGroups = Object.values(groupedMedals).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Set flag before closing to prevent popover from opening
      setDialogInteracting(true);
      setTimeout(() => {
        setDialogInteracting(false);
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange} modal={true}>
      <DialogContent 
        className="max-h-[80vh] max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Medal History</DialogTitle>
          <DialogDescription>
            Your complete medal collection and when you earned them
          </DialogDescription>
        </DialogHeader>

        {/* Filter buttons */}
        <div className="flex gap-2 border-b pb-3">
          <button
            onClick={() => setSelectedType("ALL")}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              selectedType === "ALL" 
                ? "bg-primary text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Medals
          </button>
          <button
            onClick={() => setSelectedType("GOLD")}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              selectedType === "GOLD" 
                ? "bg-yellow-500 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Gold
          </button>
          <button
            onClick={() => setSelectedType("SILVER")}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              selectedType === "SILVER" 
                ? "bg-gray-400 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Silver
          </button>
          <button
            onClick={() => setSelectedType("BRONZE")}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              selectedType === "BRONZE" 
                ? "bg-orange-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Bronze
          </button>
        </div>

        {/* Medal history list */}
        <div className="max-h-[50vh] overflow-y-auto">
          {sortedGroups.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No medals earned yet
            </div>
          ) : (
            <div className="space-y-4">
              {sortedGroups.map(({ year, month, medals }) => (
                <div key={`${year}-${month}`} className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {monthNames[month - 1]} {year}
                  </h3>
                  <div className="space-y-2">
                    {medals.map((medal) => (
                      <div 
                        key={medal.id} 
                        className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                      >
                        {/* Medal Image */}
                        {medal.imageUrl ? (
                          <div className="relative h-10 w-10 flex-shrink-0">
                            <Image
                              src={medal.imageUrl}
                              alt={`${medal.medalType} medal`}
                              width={40}
                              height={40}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: medalColors[medal.medalType] }}
                          >
                            {medal.medalType[0]}
                          </div>
                        )}

                        {/* Medal Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {medal.medalType.toLowerCase()} Medal
                            </span>
                            <span className="text-sm text-gray-600">
                              • {medal.levelName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Score: {medal.score.toLocaleString()} points
                          </div>
                        </div>

                        {/* Date earned */}
                        {medal.earnedAt && (
                          <div className="text-right text-sm text-gray-500">
                            {new Date(medal.earnedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {medalHistory.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Medals:</span>
              <span className="font-semibold">{medalHistory.length}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}