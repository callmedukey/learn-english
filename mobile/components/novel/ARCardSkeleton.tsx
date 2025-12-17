import { View } from "react-native";

function Skeleton({ className }: { className?: string }) {
  return (
    <View className={`animate-pulse rounded bg-muted ${className || ""}`} />
  );
}

export function ARCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header Row */}
      <View className="mb-3 flex-row items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <View className="flex-row gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-4" />
          ))}
        </View>
      </View>

      {/* Badges Row */}
      <View className="mb-3 flex-row gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </View>

      {/* Progress */}
      <View className="mb-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </View>
        <Skeleton className="h-2 w-full rounded-full" />
      </View>

      {/* Description */}
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </View>
  );
}

export function ARLevelsSkeleton() {
  return (
    <View className="gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ARCardSkeleton key={i} />
      ))}
    </View>
  );
}
