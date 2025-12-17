import { Text, TouchableOpacity, View } from "react-native";

import { HtmlContent } from "./HtmlContent";

// Static style objects to avoid re-renders
const QUESTION_BASE_STYLE = { fontSize: 16 };

// Choice text color styles (static to avoid re-renders)
const CHOICE_STYLES = {
  default: { fontSize: 15, color: "#1F2937" },
  selected: { fontSize: 15, color: "#5D3A29" },
  correct: { fontSize: 15, color: "#166534" },
  incorrect: { fontSize: 15, color: "#991B1B" },
  disabled: { fontSize: 15, color: "#6B7280" },
} as const;

interface QuizQuestionProps {
  question: string;
  choices: string[];
  selectedAnswer: string | null;
  correctAnswer: string | null; // Shown after answer
  isAnswered: boolean;
  onSelectAnswer: (answer: string) => void;
  points: number;
}

export function QuizQuestion({
  question,
  choices,
  selectedAnswer,
  correctAnswer,
  isAnswered,
  onSelectAnswer,
  points,
}: QuizQuestionProps) {
  const getChoiceStyle = (choice: string) => {
    if (!isAnswered) {
      if (selectedAnswer === choice) {
        return "border-primary bg-primary/10";
      }
      return "border-border bg-white";
    }

    // After answering
    if (choice === correctAnswer) {
      return "border-green-500 bg-green-50";
    }
    if (selectedAnswer === choice && choice !== correctAnswer) {
      return "border-red-500 bg-red-50";
    }
    return "border-border bg-gray-50 opacity-60";
  };

  const getChoiceTextStyle = (choice: string) => {
    if (!isAnswered) {
      if (selectedAnswer === choice) {
        return "text-primary";
      }
      return "text-foreground";
    }

    if (choice === correctAnswer) {
      return "text-green-800";
    }
    if (selectedAnswer === choice && choice !== correctAnswer) {
      return "text-red-800";
    }
    return "text-muted-foreground";
  };

  // Get the appropriate static style object for a choice
  const getChoiceBaseStyle = (choice: string) => {
    if (!isAnswered) {
      return selectedAnswer === choice ? CHOICE_STYLES.selected : CHOICE_STYLES.default;
    }
    if (choice === correctAnswer) {
      return CHOICE_STYLES.correct;
    }
    if (selectedAnswer === choice && choice !== correctAnswer) {
      return CHOICE_STYLES.incorrect;
    }
    return CHOICE_STYLES.disabled;
  };

  const letterLabels = ["A", "B", "C", "D", "E", "F"];

  return (
    <View className="gap-4">
      {/* Points Badge */}
      <View className="flex-row justify-end">
        <View className="rounded-full bg-amber-100 px-3 py-1">
          <Text className="text-sm font-medium text-amber-700">
            {points} point{points !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Question */}
      <View className="rounded-lg bg-white p-4 shadow-sm">
        <HtmlContent html={question} baseStyle={QUESTION_BASE_STYLE} />
      </View>

      {/* Choices */}
      <View className="gap-3">
        {choices.map((choice, index) => (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center gap-3 rounded-lg border-2 p-4 ${getChoiceStyle(choice)}`}
            onPress={() => !isAnswered && onSelectAnswer(choice)}
            disabled={isAnswered}
            activeOpacity={0.7}
          >
            <View
              className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
                selectedAnswer === choice
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedAnswer === choice
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {letterLabels[index]}
              </Text>
            </View>
            <View className="flex-1">
              <HtmlContent html={choice} baseStyle={getChoiceBaseStyle(choice)} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
