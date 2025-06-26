import Image from "next/image";

interface MedalLevelDisplayProps {
  levelName: string;
  medals: {
    gold: { count: number; imageUrl: string };
    silver: { count: number; imageUrl: string };
    bronze: { count: number; imageUrl: string };
  };
}

export function MedalLevelDisplay({ levelName, medals }: MedalLevelDisplayProps) {
  const medalTypes = [
    { type: "gold", data: medals.gold },
    { type: "silver", data: medals.silver },
    { type: "bronze", data: medals.bronze },
  ];

  // Only show medals that have been earned
  const earnedMedals = medalTypes.filter(m => m.data.count > 0);

  if (earnedMedals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-700">{levelName}</div>
      <div className="flex gap-2">
        {earnedMedals.map(({ type, data }) => (
          <div key={type} className="flex items-center gap-1">
            <div className="relative h-8 w-8">
              <Image
                src={data.imageUrl}
                alt={`${type} medal`}
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            {data.count > 1 && (
              <span className="text-xs font-bold text-gray-600">×{data.count}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}