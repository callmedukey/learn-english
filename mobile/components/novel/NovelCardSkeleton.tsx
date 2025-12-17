import { View } from "react-native";

function Skeleton({ className }: { className?: string }) {
  return (
    <View className={`animate-pulse rounded bg-muted ${className || ""}`} />
  );
}

export function NovelCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Title */}
      <Skeleton className="mb-2 h-5 w-3/4" />

      {/* Badges */}
      <View className="mb-3 flex-row gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </View>

      {/* Progress */}
      <View className="mb-2">
        <View className="mb-1 flex-row items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </View>
        <Skeleton className="h-2 w-full rounded-full" />
      </View>

      {/* Description */}
      <Skeleton className="h-4 w-full" />
    </View>
  );
}

export function NovelListSkeleton() {
  return (
    <View className="gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <NovelCardSkeleton key={i} />
      ))}
    </View>
  );
}
