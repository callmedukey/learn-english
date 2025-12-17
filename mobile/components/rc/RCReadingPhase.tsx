import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { HtmlContent } from "@/components/novel/HtmlContent";

// Static style for passage text
const PASSAGE_STYLE = { fontSize: 16, lineHeight: 26, color: "#1F2937" };

interface RCReadingPhaseProps {
  passage: string;
  timeLimit: number;
  onComplete: () => void;
}

export function RCReadingPhase({
  passage,
  timeLimit,
  onComplete,
}: RCReadingPhaseProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const percentage = (timeLeft / timeLimit) * 100;
  const isLow = timeLeft <= 30;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="flex-1">
      {/* Header with Timer */}
      <View className="rounded-2xl bg-white p-4 shadow-sm">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-foreground">
              Reading Phase
            </Text>
            <Text className="text-sm text-muted-foreground">
              Read the passage carefully before answering questions
            </Text>
          </View>
        </View>

        {/* Timer */}
        <View className="flex-row items-center gap-3">
          <Text className="text-sm text-muted-foreground">Time remaining:</Text>
          <View className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <View
              className={`h-full rounded-full ${isLow ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${percentage}%` }}
            />
          </View>
          <Text
            className={`min-w-[48px] text-sm font-medium ${isLow ? "text-red-600" : "text-foreground"}`}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Passage */}
      <ScrollView className="mt-4 flex-1 rounded-2xl bg-white p-4 shadow-sm">
        <HtmlContent html={passage} baseStyle={PASSAGE_STYLE} />
      </ScrollView>

      {/* Action Button */}
      <View className="mt-4">
        <TouchableOpacity
          className="rounded-lg bg-primary py-4"
          onPress={onComplete}
        >
          <Text className="text-center font-semibold text-primary-foreground">
            {timeLeft > 0
              ? "I'm Ready - Start Questions"
              : "Time's Up - Start Questions"}
          </Text>
        </TouchableOpacity>
        {timeLeft > 0 && (
          <Text className="mt-2 text-center text-xs text-muted-foreground">
            You can start the questions anytime, even before the timer ends
          </Text>
        )}
      </View>
    </View>
  );
}
