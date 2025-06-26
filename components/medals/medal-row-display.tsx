import Image from "next/image";

import type { MedalType } from "@/prisma/generated/prisma";

interface Medal {
  levelType: string;
  levelId: string;
  levelName: string;
  medalType: MedalType;
  count: number;
  imageUrl: string | null;
}

interface MedalRowDisplayProps {
  medals: Medal[];
  maxDisplay?: number; // Maximum number of medals to display
}

// Default medal colors as fallback
const medalColors = {
  GOLD: "#FFD700",
  SILVER: "#C0C0C0",
  BRONZE: "#CD7F32",
} as const;

export function MedalRowDisplay({ medals, maxDisplay = 6 }: MedalRowDisplayProps) {
  if (medals.length === 0) {
    return null;
  }

  // Limit the number of medals displayed
  const displayMedals = maxDisplay ? medals.slice(0, maxDisplay) : medals;
  const remainingCount = medals.length - displayMedals.length;

  return (
    <div className="flex items-center justify-center gap-2">
      {displayMedals.map((medal, index) => (
        <div key={`${medal.levelType}-${medal.levelId}-${medal.medalType}-${index}`} className="flex items-center gap-1">
          {medal.imageUrl ? (
            <div className="relative h-8 w-8">
              <Image
                src={medal.imageUrl}
                alt={`${medal.medalType} medal from ${medal.levelName}`}
                width={32}
                height={32}
                className="h-full w-full object-contain"
                title={`${medal.levelName} - ${medal.medalType}`}
              />
            </div>
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: medalColors[medal.medalType] }}
              title={`${medal.levelName} - ${medal.medalType}`}
            >
              {medal.medalType[0]}
            </div>
          )}
          {medal.count > 1 && (
            <span className="text-xs font-bold text-gray-600">×{medal.count}</span>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500">+{remainingCount} more</span>
      )}
    </div>
  );
}