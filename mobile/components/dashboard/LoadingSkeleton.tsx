import { View } from "react-native";

function Skeleton({ className }: { className?: string }) {
  return <View className={`animate-pulse rounded bg-muted ${className || ""}`} />;
}

export function ContinueLearningSkeletons() {
  return (
    <View className="gap-3">
      {/* Novel Card Skeleton */}
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </View>
        <Skeleton className="mb-2 h-6 w-48" />
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-2 w-full rounded-full" />
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </View>
      </View>

      {/* RC Card Skeleton */}
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </View>
        <Skeleton className="mb-2 h-6 w-32" />
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </View>
    </View>
  );
}

export function LeaderboardCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-36" />
      </View>

      {/* Tabs */}
      <View className="mb-3 flex-row gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-12 rounded-full" />
      </View>

      {/* Rankings */}
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row items-center py-2">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="mx-2 h-5 w-5 rounded-full" />
          <View className="flex-1">
            <Skeleton className="h-4 w-24" />
          </View>
          <Skeleton className="mx-2 h-4 w-8" />
          <Skeleton className="h-4 w-16" />
        </View>
      ))}

      {/* View Tabs */}
      <View className="mt-3 flex-row border-t border-border pt-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </View>
    </View>
  );
}

export function MyStatsCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Header */}
      <View className="mb-3 flex-row items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </View>

      {/* Score Stats */}
      <View className="mb-3 gap-2">
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </View>
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
        </View>
        <View className="mt-2 flex-row items-center justify-between border-t border-border pt-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-6 w-24" />
        </View>
      </View>

      {/* Rankings */}
      <View className="rounded-lg bg-muted/50 p-3">
        <View className="mb-2 flex-row items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </View>
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </View>
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View className="gap-4 p-4">
      <ContinueLearningSkeletons />
      <LeaderboardCardSkeleton />
      <MyStatsCardSkeleton />
      <LeaderboardCardSkeleton />
      <MyStatsCardSkeleton />
    </View>
  );
}
