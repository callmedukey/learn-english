import Image from "next/image";

import type { MedalType } from "@/prisma/generated/prisma";

interface MedalCountProps {
  type: MedalType;
  count: number;
  imageUrl?: string | null;
  width?: number;
  height?: number;
}

// Default medal colors as fallback when no image is available
const medalColors = {
  GOLD: "#FFD700",
  SILVER: "#C0C0C0",
  BRONZE: "#CD7F32",
} as const;

export function MedalCount({ type, count, imageUrl, width = 40, height = 40 }: MedalCountProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {imageUrl ? (
        <div className="relative h-10 w-10">
          <Image
            src={imageUrl}
            alt={`${type} Medal`}
            width={width}
            height={height}
            className="h-full w-full object-contain"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>
      ) : (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: medalColors[type] }}
        >
          {type[0]}
        </div>
      )}
      <span className="text-sm font-bold text-gray-700">×{count}</span>
    </div>
  );
}