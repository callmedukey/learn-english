import { View } from "react-native";

// Individual skeleton components
export function BPALevelCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="h-6 w-24 animate-pulse rounded bg-muted" />
            <View className="h-5 w-12 animate-pulse rounded bg-muted" />
          </View>
          <View className="mb-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
          <View className="flex-row items-center gap-2">
            <View className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <View className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          </View>
        </View>
        <View className="h-8 w-4 animate-pulse rounded bg-muted" />
      </View>
    </View>
  );
}

export function BPANovelCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-2 h-5 w-3/4 animate-pulse rounded bg-muted" />
      <View className="mb-3 h-4 w-full animate-pulse rounded bg-muted" />
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-5 w-20 animate-pulse rounded-full bg-muted" />
      </View>
      <View className="mb-1 flex-row items-center justify-between">
        <View className="h-3 w-12 animate-pulse rounded bg-muted" />
        <View className="h-3 w-8 animate-pulse rounded bg-muted" />
      </View>
      <View className="h-2 w-full animate-pulse rounded-full bg-muted" />
    </View>
  );
}

export function BPAChapterCardSkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="flex-row items-start">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <View className="h-5 w-32 animate-pulse rounded bg-muted" />
          </View>
          <View className="mb-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
          <View className="flex-row items-center gap-2">
            <View className="h-5 w-14 animate-pulse rounded-full bg-muted" />
            <View className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function BPAProgressSummarySkeleton() {
  return (
    <View className="rounded-2xl bg-white p-4 shadow-sm">
      <View className="mb-4 h-6 w-28 animate-pulse rounded bg-muted" />
      <View className="flex-row flex-wrap justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="mb-2 w-1/2 items-center">
            <View className="mb-1 h-8 w-12 animate-pulse rounded bg-muted" />
            <View className="h-4 w-20 animate-pulse rounded bg-muted" />
          </View>
        ))}
      </View>
    </View>
  );
}

// Combined skeleton loaders for screens
export function BPALevelsSkeleton() {
  return (
    <View className="flex-1 p-4">
      <View className="mb-4">
        <View className="mb-1 h-8 w-48 animate-pulse rounded bg-muted" />
        <View className="h-5 w-64 animate-pulse rounded bg-muted" />
      </View>
      <View className="gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <BPALevelCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

export function BPANovelsSkeleton() {
  return (
    <View className="flex-1 p-4">
      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-2 h-7 w-32 animate-pulse rounded bg-muted" />
        <View className="h-5 w-48 animate-pulse rounded bg-muted" />
      </View>
      <View className="gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <BPANovelCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

export function BPANovelDetailsSkeleton() {
  return (
    <View className="flex-1 p-4">
      <View className="mb-4">
        <View className="mb-2 h-8 w-3/4 animate-pulse rounded bg-muted" />
        <View className="mb-4 flex-row items-center gap-2">
          <View className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <View className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </View>
        <View className="h-4 w-full animate-pulse rounded bg-muted" />
      </View>
      <BPAProgressSummarySkeleton />
      <View className="mt-6 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <BPAChapterCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

export function BPAQuizSkeleton() {
  return (
    <View className="flex-1 p-4">
      <View className="gap-4">
        {/* Progress skeleton */}
        <View className="h-24 animate-pulse rounded-2xl bg-muted" />

        {/* Question card skeleton */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-6 w-32 animate-pulse rounded bg-muted" />
            <View className="h-6 w-20 animate-pulse rounded bg-muted" />
          </View>

          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <View
                key={i}
                className="h-12 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </View>

          <View className="mt-6 h-12 animate-pulse rounded-lg bg-muted" />
        </View>
      </View>
    </View>
  );
}
