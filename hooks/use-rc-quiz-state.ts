import { useState, useRef } from "react";

export interface RCQuizState {
  // Quiz flow
  currentQuestionIndex: number;
  quizStarted: boolean;
  quizCompleted: boolean;

  // Reading phase
  isReadingPhase: boolean;
  readingTimeLeft: number;
  hasStartedReading: boolean;

  // Question state
  selectedAnswer: string;
  isAnswered: boolean;
  showExplanation: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
  isSubmitting: boolean;
  timeLeft: number;
  shuffledChoices: string[];

  // Overall progress
  totalPointsEarned: number;
  correctAnswersCount: number;
}

export function useRCQuizState(initialTimeLimit: number) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(initialTimeLimit || 0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shuffledChoices, setShuffledChoices] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [totalPointsEarned, setTotalPointsEarned] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  // Reading phase states
  const [isReadingPhase, setIsReadingPhase] = useState(false);
  const [readingTimeLeft, setReadingTimeLeft] = useState(0);
  const [hasStartedReading, setHasStartedReading] = useState(false);

  const lastQuestionIdRef = useRef<string | null>(null);
  const timerEffectRanAtLeastOnce = useRef(false);

  const resetQuestionState = () => {
    setSelectedAnswer("");
    setIsAnswered(false);
    setShowExplanation(false);
    setIsCorrect(false);
    setPointsAwarded(0);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswered(false);
    setShowExplanation(false);
    setQuizCompleted(false);
    setTotalPointsEarned(0);
    setCorrectAnswersCount(0);
    setQuizStarted(true);
  };

  return {
    // State values
    currentQuestionIndex,
    selectedAnswer,
    timeLeft,
    isAnswered,
    showExplanation,
    isCorrect,
    pointsAwarded,
    isSubmitting,
    shuffledChoices,
    quizCompleted,
    totalPointsEarned,
    correctAnswersCount,
    quizStarted,
    isReadingPhase,
    readingTimeLeft,
    hasStartedReading,
    lastQuestionIdRef,
    timerEffectRanAtLeastOnce,

    // State setters
    setCurrentQuestionIndex,
    setSelectedAnswer,
    setTimeLeft,
    setIsAnswered,
    setShowExplanation,
    setIsCorrect,
    setPointsAwarded,
    setIsSubmitting,
    setShuffledChoices,
    setQuizCompleted,
    setTotalPointsEarned,
    setCorrectAnswersCount,
    setQuizStarted,
    setIsReadingPhase,
    setReadingTimeLeft,
    setHasStartedReading,

    // Helper functions
    resetQuestionState,
    resetQuiz,
  };
}
