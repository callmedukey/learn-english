"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  year: number;
  month: number;
  active: boolean;
  scheduledActive: boolean;
  _count?: {
    medals: number;
  };
}

interface ChallengeBadgeProps {
  challenges: Challenge[];
  currentYear?: number;
  currentMonth?: number;
}

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function ChallengeBadge({ 
  challenges, 
  currentYear = new Date().getFullYear(),
  currentMonth = new Date().getMonth() + 1 
}: ChallengeBadgeProps) {
  if (!challenges || challenges.length === 0) {
    return null;
  }

  // Sort challenges by date (newest first)
  const sortedChallenges = [...challenges].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Find current, scheduled, and past challenges
  const currentChallenge = sortedChallenges.find(
    c => c.year === currentYear && c.month === currentMonth && c.active
  );
  
  const scheduledChallenges = sortedChallenges.filter(c => {
    const isFuture = c.year > currentYear || 
      (c.year === currentYear && c.month > currentMonth);
    return isFuture && c.scheduledActive;
  });

  const pastChallenges = sortedChallenges.filter(c => {
    const isPast = c.year < currentYear || 
      (c.year === currentYear && c.month < currentMonth);
    return isPast || (!c.active && !c.scheduledActive);
  });

  // Show only the most relevant badge
  if (currentChallenge) {
    return (
      <Badge 
        className={cn(
          "animate-pulse bg-green-500 hover:bg-green-600",
          "text-white border-green-600"
        )}
      >
        {monthNames[currentChallenge.month - 1]} {currentChallenge.year}
      </Badge>
    );
  }

  if (scheduledChallenges.length > 0) {
    const nextChallenge = scheduledChallenges[0];
    return (
      <Badge 
        className={cn(
          "bg-blue-500 hover:bg-blue-600",
          "text-white border-blue-600"
        )}
      >
        {monthNames[nextChallenge.month - 1]} {nextChallenge.year} (Scheduled)
      </Badge>
    );
  }

  if (pastChallenges.length > 0) {
    return (
      <Badge 
        variant="secondary"
        className="text-gray-600"
      >
        {pastChallenges.length} Past Challenge{pastChallenges.length > 1 ? 's' : ''}
      </Badge>
    );
  }

  return null;
}