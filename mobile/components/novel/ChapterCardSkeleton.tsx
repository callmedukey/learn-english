import { View } from "react-native";

function Skeleton({ className }: { className?: string }) {
  return (
    <View className={`animate-pulse rounded bg-muted ${className || ""}`} />
  );
}

export function ChapterCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <View className="mb-2 flex-row items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </View>

      {/* Title */}
      <Skeleton className="mb-3 h-4 w-3/4" />

      {/* Progress */}
      <View className="mb-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </View>
        <Skeleton className="h-2 w-full rounded-full" />
      </View>

      {/* Button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </View>
  );
}

export function NovelDetailsSkeleton() {
  return (
    <View className="gap-4 p-4">
      {/* Header */}
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <Skeleton className="mb-2 h-7 w-3/4" />
        <View className="mb-3 flex-row gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </View>
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </View>

      {/* Progress Card */}
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <Skeleton className="mb-3 h-5 w-32" />
        <View className="flex-row justify-around">
          <View className="items-center">
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </View>
          <View className="items-center">
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </View>
          <View className="items-center">
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </View>
        </View>
      </View>

      {/* Chapter Cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <ChapterCardSkeleton key={i} />
      ))}
    </View>
  );
}
