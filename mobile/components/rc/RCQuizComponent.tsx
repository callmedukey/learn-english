import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { HtmlContent } from "@/components/novel/HtmlContent";
import { QuizQuestion } from "@/components/novel/QuizQuestion";
import { QuizTimer } from "@/components/novel/QuizTimer";
import {
  useCompleteRCQuestion,
  useCompleteRCQuiz,
  useMarkRCQuestionStarted,
} from "@/hooks/useRC";
import type { RCQuestion, RCQuizData, RCQuizStatus } from "@/types/rc";

import { RCQuizResult } from "./RCQuizResult";
import { RCQuizStartCard } from "./RCQuizStartCard";
import { RCReadingPhase } from "./RCReadingPhase";

// Static style objects to avoid re-renders
const EXPLANATION_STYLE = { fontSize: 14, color: "#6B7280" };
const ANSWER_STYLE = { fontSize: 14, color: "#1F2937" };

type QuizPhase = "not-started" | "reading" | "questions" | "completed";

interface RCQuizComponentProps {
  quizData: RCQuizData;
  userHasPaidSubscription: boolean;
}

export function RCQuizComponent({
  quizData,
  userHasPaidSubscription,
}: RCQuizComponentProps) {
  const router = useRouter();
  const navigation = useNavigation();

  const [phase, setPhase] = useState<QuizPhase>("not-started");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);
  const lastQuestionIdRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const [initialStatus] = useState<RCQuizStatus>(quizData.status);

  const markStartedMutation = useMarkRCQuestionStarted();
  const completeQuestionMutation = useCompleteRCQuestion();
  const completeQuizMutation = useCompleteRCQuiz();

  const questions = useMemo(
    () => quizData.questionSet?.questions || [],
    [quizData.questionSet?.questions]
  );

  const canAccess = quizData.isFree || userHasPaidSubscription;
  const currentQuestion = questions[currentQuestionIndex];

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appStateRef.current === "active" &&
        nextAppState.match(/inactive|background/) &&
        currentQuestion &&
        !isAnswered &&
        phase === "questions"
      ) {
        // App going to background - auto-submit
        handleTimeUp();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentQuestion, isAnswered, phase]);

  // Handle back button / navigation gestures - auto-submit if question in progress
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Only intercept if quiz questions in progress and not answered
      if (phase !== "questions" || !currentQuestion || isAnswered) {
        return; // Allow normal navigation
      }

      // Prevent default behavior
      e.preventDefault();

      // Auto-submit as wrong and then navigate
      const disallowPoints =
        initialStatus === "retry" ||
        (initialStatus === "continue" && currentQuestion.isCompleted);

      completeQuestionMutation.mutate(
        {
          questionId: currentQuestion.id,
          selectedAnswer: "",
          isTimedOut: true,
          isRetry: disallowPoints,
        },
        {
          onSuccess: () => {
            // After submission, allow navigation
            navigation.dispatch(e.data.action);
          },
        }
      );
    });

    return unsubscribe;
  }, [
    phase,
    currentQuestion,
    isAnswered,
    initialStatus,
    navigation,
    completeQuestionMutation,
  ]);

  // Shuffle choices when question changes
  useEffect(() => {
    if (
      currentQuestion &&
      phase === "questions" &&
      currentQuestion.id !== lastQuestionIdRef.current
    ) {
      lastQuestionIdRef.current = currentQuestion.id;
      const shuffled = [...currentQuestion.choices].sort(
        () => Math.random() - 0.5
      );
      setShuffledChoices(shuffled);
      setTimeLeft(currentQuestion.timeLimit);

      // Mark question as started
      markStartedMutation.mutate({
        questionId: currentQuestion.id,
        keywordId: quizData.keyword.id,
        rcLevelId: quizData.rcLevel.id,
      });
    }
  }, [currentQuestion, phase, quizData.keyword.id, quizData.rcLevel.id]);

  const handleTimeUp = useCallback(async () => {
    if (!currentQuestion || isAnswered) return;

    const disallowPoints =
      initialStatus === "retry" ||
      (initialStatus === "continue" && currentQuestion.isCompleted);

    completeQuestionMutation.mutate(
      {
        questionId: currentQuestion.id,
        selectedAnswer: "",
        isTimedOut: true,
        isRetry: disallowPoints,
      },
      {
        onSuccess: (result) => {
          setIsCorrect(false);
          setPointsAwarded(result.pointsAwarded || 0);
          setShowExplanation(true);
          setIsAnswered(true);
        },
      }
    );
  }, [currentQuestion, isAnswered, initialStatus, completeQuestionMutation]);

  const handleTick = useCallback(() => {
    setTimeLeft((prev) => prev - 1);
  }, []);

  const handleStartQuiz = () => {
    setPhase("reading");
  };

  const handleReadingComplete = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setTotalPointsEarned(0);
    setCorrectAnswersCount(0);
    setPhase("questions");
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSelectAnswer = (answer: string) => {
    if (!isAnswered && timeLeft > 0) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    const disallowPoints =
      initialStatus === "retry" ||
      (initialStatus === "continue" && currentQuestion.isCompleted);

    completeQuestionMutation.mutate(
      {
        questionId: currentQuestion.id,
        selectedAnswer,
        isTimedOut: false,
        isRetry: disallowPoints,
      },
      {
        onSuccess: (result) => {
          setIsCorrect(result.isCorrect || false);
          setPointsAwarded(result.pointsAwarded || 0);
          setTotalPointsEarned((prev) => prev + (result.pointsAwarded || 0));
          setShowExplanation(true);
          setIsAnswered(true);
          if (result.isCorrect) {
            setCorrectAnswersCount((prev) => prev + 1);
          }
        },
      }
    );
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setIsCorrect(false);
      setPointsAwarded(0);
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setPhase("completed");

      // Save quiz completion
      if (quizData.questionSet) {
        completeQuizMutation.mutate({
          questionSetId: quizData.questionSet.id,
          keywordId: quizData.keyword.id,
          rcLevelId: quizData.rcLevel.id,
          totalQuestions: questions.length,
          correctAnswers: correctAnswersCount + (isCorrect ? 1 : 0),
        });
      }
    }
  };

  const handleRetry = () => {
    router.replace(
      `/rc/${quizData.rcLevel.id}/${quizData.keyword.id}?status=retry`
    );
  };

  const handleBackToKeywords = useCallback(async () => {
    // If quiz questions in progress and not answered, auto-submit as wrong
    if (phase === "questions" && currentQuestion && !isAnswered) {
      const disallowPoints =
        initialStatus === "retry" ||
        (initialStatus === "continue" && currentQuestion.isCompleted);

      await completeQuestionMutation.mutateAsync({
        questionId: currentQuestion.id,
        selectedAnswer: "",
        isTimedOut: true,
        isRetry: disallowPoints,
      });
    }
    router.replace(`/rc/${quizData.rcLevel.id}`);
  }, [
    phase,
    currentQuestion,
    isAnswered,
    initialStatus,
    completeQuestionMutation,
    router,
    quizData.rcLevel.id,
  ]);

  // No access
  if (!canAccess) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <View className="items-center gap-4">
            <Text className="text-5xl">🔒</Text>
            <Text className="text-xl font-semibold text-foreground">
              Premium Content
            </Text>
            <Text className="text-center text-muted-foreground">
              Upgrade to premium to access this content.
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-lg bg-primary px-6 py-3"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Text className="font-medium text-primary-foreground">
                Upgrade Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // No questions
  if (!quizData.questionSet || questions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <View className="rounded-2xl bg-white p-6 shadow-sm">
          <View className="items-center gap-4">
            <Text className="text-5xl">📝</Text>
            <Text className="text-xl font-semibold text-foreground">
              No Questions Available
            </Text>
            <Text className="text-center text-muted-foreground">
              This keyword doesn&apos;t have any questions yet.
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-lg bg-primary px-6 py-3"
              onPress={handleCancel}
            >
              <Text className="font-medium text-primary-foreground">
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Quiz completed
  if (phase === "completed") {
    return (
      <ScrollView className="flex-1 p-4">
        <RCQuizResult
          correctAnswers={correctAnswersCount}
          totalQuestions={questions.length}
          pointsEarned={totalPointsEarned}
          isRetry={initialStatus === "retry"}
          onRetry={handleRetry}
          onBackToKeywords={handleBackToKeywords}
        />
      </ScrollView>
    );
  }

  // Not started
  if (phase === "not-started") {
    return (
      <ScrollView className="flex-1 p-4">
        <RCQuizStartCard
          questionCount={questions.length}
          readingTimeLimit={quizData.questionSet.timeLimit}
          isRetry={initialStatus === "retry"}
          onStart={handleStartQuiz}
          onCancel={handleCancel}
        />
      </ScrollView>
    );
  }

  // Reading phase
  if (phase === "reading") {
    return (
      <View className="flex-1 p-4">
        <RCReadingPhase
          passage={quizData.questionSet.passage}
          timeLimit={quizData.questionSet.timeLimit}
          onComplete={handleReadingComplete}
        />
      </View>
    );
  }

  // Questions phase
  if (!currentQuestion) return null;

  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <ScrollView className="flex-1 p-4">
      <View className="gap-4">
        {/* Progress Bar */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">Progress</Text>
            <Text className="text-sm font-medium text-foreground">
              {currentQuestionIndex + 1} of {questions.length}
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>
        </View>

        {/* Question Navigation Pills */}
        <View className="flex-row flex-wrap gap-2">
          {questions.map((q, index) => {
            const isCompleted = initialStatus !== "retry" && q.isCompleted;
            const isCurrent = index === currentQuestionIndex;
            return (
              <View
                key={q.id}
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  isCurrent
                    ? "bg-primary"
                    : isCompleted
                      ? "border-2 border-green-500 bg-white"
                      : "bg-muted"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-primary-foreground"
                      : isCompleted
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Question Card */}
        <View className="rounded-2xl bg-white p-4 shadow-sm">
          {/* Header with Timer */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">
              Question {currentQuestion.orderNumber}
            </Text>
            <QuizTimer
              timeLeft={timeLeft}
              timeLimit={currentQuestion.timeLimit}
              onTimeUp={handleTimeUp}
              isPaused={isAnswered}
              onTick={handleTick}
            />
          </View>

          {/* Question & Choices */}
          <QuizQuestion
            question={currentQuestion.question}
            choices={shuffledChoices}
            selectedAnswer={selectedAnswer}
            correctAnswer={showExplanation ? currentQuestion.answer : null}
            isAnswered={isAnswered}
            onSelectAnswer={handleSelectAnswer}
            points={currentQuestion.score}
          />

          {/* Explanation */}
          {showExplanation && (
            <View className="mt-4 border-t border-border pt-4">
              <View className="mb-3 flex-row flex-wrap gap-2">
                <View
                  className={`rounded-full px-3 py-1 ${
                    isCorrect ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isCorrect ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {timeLeft === 0 && !selectedAnswer
                      ? "Time's Up!"
                      : isCorrect
                        ? "Correct!"
                        : "Incorrect"}
                  </Text>
                </View>
                {pointsAwarded > 0 && (
                  <View className="rounded-full bg-amber-100 px-3 py-1">
                    <Text className="text-sm font-medium text-amber-800">
                      +{pointsAwarded} points
                    </Text>
                  </View>
                )}
                {initialStatus === "retry" && (
                  <View className="rounded-full bg-gray-100 px-3 py-1">
                    <Text className="text-sm font-medium text-gray-600">
                      Retry Mode
                    </Text>
                  </View>
                )}
              </View>

              <Text className="mb-2 font-medium text-foreground">
                Explanation:
              </Text>
              <HtmlContent
                html={currentQuestion.explanation}
                baseStyle={EXPLANATION_STYLE}
              />

              <View className="mt-3 rounded-lg bg-muted/50 p-3">
                <Text className="text-sm text-muted-foreground">
                  <Text className="font-medium">Correct Answer: </Text>
                </Text>
                <HtmlContent
                  html={currentQuestion.answer}
                  baseStyle={ANSWER_STYLE}
                />
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="mt-4 flex-row justify-between">
            <TouchableOpacity
              className="rounded-lg border border-border px-4 py-3"
              onPress={handleBackToKeywords}
            >
              <Text className="font-medium text-foreground">Exit Quiz</Text>
            </TouchableOpacity>

            {!showExplanation && selectedAnswer && timeLeft > 0 && (
              <TouchableOpacity
                className="rounded-lg bg-primary px-6 py-3"
                onPress={handleSubmitAnswer}
                disabled={completeQuestionMutation.isPending}
              >
                <Text className="font-medium text-primary-foreground">
                  {completeQuestionMutation.isPending
                    ? "Submitting..."
                    : "Submit Answer"}
                </Text>
              </TouchableOpacity>
            )}

            {showExplanation && (
              <TouchableOpacity
                className="rounded-lg bg-primary px-6 py-3"
                onPress={handleNextQuestion}
              >
                <Text className="font-medium text-primary-foreground">
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
