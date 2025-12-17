import { useEffect } from "react";
import { Text, View } from "react-native";

interface QuizTimerProps {
  timeLeft: number;
  timeLimit: number;
  onTimeUp: () => void;
  isPaused: boolean;
  onTick: () => void;
}

export function QuizTimer({
  timeLeft,
  timeLimit,
  onTimeUp,
  isPaused,
  onTick,
}: QuizTimerProps) {
  const percentage = (timeLeft / timeLimit) * 100;
  const isLow = timeLeft <= 10;

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      if (timeLeft <= 1) {
        onTimeUp();
      } else {
        onTick();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isPaused, onTimeUp, onTick]);

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm text-muted-foreground">Time:</Text>
      <View className="h-2 w-16 overflow-hidden rounded-full bg-muted">
        <View
          className={`h-full rounded-full ${isLow ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text
        className={`min-w-[24px] text-sm font-medium ${isLow ? "text-red-600" : "text-foreground"}`}
      >
        {timeLeft}s
      </Text>
    </View>
  );
}
