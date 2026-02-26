import FontAwesome from "@expo/vector-icons/FontAwesome";
import { format } from "date-fns";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from "react-native";

import {
  Dialog,
  DialogContent,
  DialogCloseButton,
} from "@/components/ui/Dialog";
import { useScoreLog } from "@/hooks/useScoreLog";
import type { ScoreSourceFilter } from "@/services/api/score-log";
import type { ScoreLogEntry } from "@shared/types/score-log.types";

interface ScoreLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCE_COLORS = {
  RC: { bg: "#DBEAFE", text: "#1E40AF" },
  Novel: { bg: "#F3E8FF", text: "#6B21A8" },
  BPA: { bg: "#DCFCE7", text: "#166534" },
};

function FilterButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-lg px-3 py-1.5 ${
        isActive ? "bg-primary" : "bg-gray-100"
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ScoreLogItem({
  log,
  isExpanded,
  onToggle,
}: {
  log: ScoreLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isLegacyRecord = !log.selectedAnswer;
  const sourceColor = SOURCE_COLORS[log.source];

  return (
    <Pressable
      onPress={isLegacyRecord ? undefined : onToggle}
      className="mb-2 rounded-lg border border-gray-200 bg-white"
    >
      <View className="p-3">
        {/* Header row */}
        <View className="mb-1 flex-row flex-wrap items-center gap-1.5">
          {/* Source badge */}
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: sourceColor.bg }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: sourceColor.text }}
            >
              {log.source}
            </Text>
          </View>

          {/* Score */}
          <Text className="text-sm font-medium text-primary">
            +{log.score} pts
          </Text>

          {/* Status badges */}
          {isLegacyRecord && (
            <View className="rounded-full bg-gray-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-gray-600">Legacy</Text>
            </View>
          )}
          {!isLegacyRecord && log.isRetry && (
            <View className="rounded-full bg-orange-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-orange-800">
                Retry
              </Text>
            </View>
          )}
          {!isLegacyRecord && log.isTimedOut && (
            <View className="rounded-full bg-red-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-red-800">
                Timed Out
              </Text>
            </View>
          )}
          {log.isCorrect && (
            <View className="rounded-full bg-green-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-green-800">
                {isLegacyRecord ? "Correct*" : "Correct"}
              </Text>
            </View>
          )}
          {!log.isCorrect && !isLegacyRecord && !log.isTimedOut && (
            <View className="rounded-full bg-red-100 px-2 py-0.5">
              <Text className="text-xs font-semibold text-red-800">
                Incorrect
              </Text>
            </View>
          )}
        </View>

        {/* Source details */}
        <Text className="mb-1 text-sm text-gray-600" numberOfLines={1}>
          {log.sourceDetails}
        </Text>

        {/* Date and expand indicator */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-400">
            {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
          </Text>
          {!isLegacyRecord && (
            <FontAwesome
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={12}
              color="#9CA3AF"
            />
          )}
        </View>
      </View>

      {/* Expanded content */}
      {isExpanded && !isLegacyRecord && (
        <View className="border-t border-gray-100 bg-gray-50 p-3">
          {/* Question */}
          <View className="mb-3">
            <Text className="mb-1 text-xs font-semibold text-gray-500">
              Question
            </Text>
            <Text className="text-sm text-gray-900">{log.questionText}</Text>
          </View>

          {/* Answers */}
          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold text-gray-500">
                Your Answer
              </Text>
              <Text
                className={`text-sm font-medium ${
                  log.isCorrect ? "text-green-700" : "text-red-700"
                }`}
              >
                {log.selectedAnswer || "No answer"}
              </Text>
            </View>
            {!log.isCorrect && log.correctAnswer && (
              <View className="flex-1">
                <Text className="mb-1 text-xs font-semibold text-gray-500">
                  Correct Answer
                </Text>
                <Text className="text-sm font-medium text-green-700">
                  {log.correctAnswer}
                </Text>
              </View>
            )}
          </View>

          {/* Explanation */}
          {log.explanation && (
            <View>
              <Text className="mb-1 text-xs font-semibold text-gray-500">
                Explanation
              </Text>
              <Text className="text-sm text-gray-600">{log.explanation}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function ScoreLogModal({ open, onOpenChange }: ScoreLogModalProps) {
  const [sourceFilter, setSourceFilter] = useState<ScoreSourceFilter>(undefined);
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data, isLoading, error, isFetching } = useScoreLog({
    enabled: open,
    page,
    source: sourceFilter,
  });

  const handleSourceChange = useCallback(
    (source: ScoreSourceFilter) => {
      setSourceFilter(source);
      setPage(1);
      setExpandedLogId(null);
    },
    []
  );

  const handleLoadMore = useCallback(() => {
    if (data && page < data.totalPages && !isFetching) {
      setPage((prev) => prev + 1);
    }
  }, [data, page, isFetching]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ScoreLogEntry }) => (
      <ScoreLogItem
        log={item}
        isExpanded={expandedLogId === item.id}
        onToggle={() => toggleExpand(item.id)}
      />
    ),
    [expandedLogId, toggleExpand]
  );

  const renderFooter = useCallback(() => {
    if (!isFetching || !data) return null;
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color="#5D3A29" />
      </View>
    );
  }, [isFetching, data]);

  const keyExtractor = useCallback((item: ScoreLogEntry) => item.id, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxHeight: "85%", padding: 0 }}>
        <DialogCloseButton onPress={() => onOpenChange(false)} />

        {/* Header */}
        <View className="border-b border-gray-100 p-4 pb-3 pr-12">
          <Text className="text-lg font-semibold text-gray-900">
            My Score History
          </Text>
          <Text className="mt-0.5 text-sm text-gray-500">
            Your activity history from RC, Novel, and BPA
          </Text>
        </View>

        {/* Filter tabs */}
        <View className="flex-row gap-2 px-4 py-3">
          <FilterButton
            label="All"
            isActive={sourceFilter === undefined}
            onPress={() => handleSourceChange(undefined)}
          />
          <FilterButton
            label="RC"
            isActive={sourceFilter === "RC"}
            onPress={() => handleSourceChange("RC")}
          />
          <FilterButton
            label="Novel"
            isActive={sourceFilter === "Novel"}
            onPress={() => handleSourceChange("Novel")}
          />
          <FilterButton
            label="BPA"
            isActive={sourceFilter === "BPA"}
            onPress={() => handleSourceChange("BPA")}
          />
        </View>

        {/* Content */}
        <View className="flex-1 px-4">
          {isLoading && !data && (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#5D3A29" />
              <Text className="mt-2 text-sm text-gray-500">
                Loading history...
              </Text>
            </View>
          )}

          {error && (
            <View className="flex-1 items-center justify-center py-12">
              <FontAwesome name="exclamation-circle" size={32} color="#EF4444" />
              <Text className="mt-2 text-sm text-gray-500">
                Failed to load score history
              </Text>
            </View>
          )}

          {data && data.logs.length === 0 && (
            <View className="flex-1 items-center justify-center py-12">
              <FontAwesome name="history" size={32} color="#9CA3AF" />
              <Text className="mt-2 text-sm text-gray-500">
                No score history found
              </Text>
            </View>
          )}

          {data && data.logs.length > 0 && (
            <FlatList
              data={data.logs}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}
        </View>

        {/* Pagination info */}
        {data && data.totalPages > 1 && (
          <View className="border-t border-gray-100 px-4 py-3">
            <Text className="text-center text-xs text-gray-500">
              Page {data.page} of {data.totalPages} ({data.total} entries)
            </Text>
          </View>
        )}
      </DialogContent>
    </Dialog>
  );
}
