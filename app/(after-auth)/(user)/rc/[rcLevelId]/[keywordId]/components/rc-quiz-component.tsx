"use client";

import DOMPurify from "isomorphic-dompurify";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  submitRCAnswer,
  saveRCQuizCompletion,
} from "../actions/rc-question.actions";

interface RCQuizComponentProps {
  questionSet: {
    id: string;
    title: string;
    passage: string;
    timeLimit: number;
    RCQuestion: Array<{
      id: string;
      orderNumber: number;
      question: string;
      choices: string[];
      answer: string;
      explanation: string;
      score: number;
      timeLimit: number;
      RCQuestionCompleted: Array<{
        userId: string;
        score: number;
      }>;
    }>;
  };
  userId: string;
  keywordId: string;
  rcLevelId: string;
  userHasPaidSubscription: boolean;
  status: "start" | "continue" | "retry";
}

export function RCQuizComponent({
  questionSet,
  userId,
  keywordId,
  rcLevelId,
  status,
}: RCQuizComponentProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(0);
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
  const lastQuestionIdRef = useRef<string | null>(null);
  const timerEffectRanAtLeastOnce = useRef(false);

  // Store the initial status to use throughout the quiz
  const [initialStatus] = useState(status);

  // New states for reading phase
  const [isReadingPhase, setIsReadingPhase] = useState(false);
  const [readingTimeLeft, setReadingTimeLeft] = useState(0);
  const [hasStartedReading, setHasStartedReading] = useState(false);

  const questions = useMemo(
    () => questionSet.RCQuestion || [],
    [questionSet.RCQuestion],
  );

  // Check if question is already completed
  const isQuestionCompleted = useCallback(
    (questionId: string) => {
      const question = questions.find((q) => q.id === questionId);
      return (
        question?.RCQuestionCompleted.some(
          (completed) => completed.userId === userId,
        ) || false
      );
    },
    [questions, userId],
  );

  // Filter questions based on status (similar to novel quiz)
  // const getQuestionsToShow = useCallback(() => {
  //   if (status === "retry") {
  //     return questions; // Show all questions for retry
  //   } else if (status === "continue") {
  //     // return questions.filter((q) => !isQuestionCompleted(q.id)); // Show only incomplete questions - REPLACED
  //     return questions; // For "continue", we now restart from the beginning, so show all.
  //   } else {
  //     return questions; // Show all questions for start
  //   }
  // }, [questions, status, isQuestionCompleted]);

  // const questionsToShow = getQuestionsToShow(); // Now directly use 'questions'
  const currentQuestion = questions[currentQuestionIndex];

  // Get completed score for a question
  const getCompletedScore = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    const completed = question?.RCQuestionCompleted.find(
      (completed) => completed.userId === userId,
    );
    return completed?.score || 0;
  };

  // Reset quiz state when starting
  const handleStartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswered(false);
    setShowExplanation(false);
    setQuizCompleted(false);
    setTotalPointsEarned(0);
    setCorrectAnswersCount(0);
    setQuizStarted(true);
  };

  // New function to handle starting reading phase
  const handleStartReading = () => {
    setIsReadingPhase(true);
    setHasStartedReading(true);
    setReadingTimeLeft(questionSet.timeLimit || 60); // Default to 60 seconds if not set
  };

  // New function to handle finishing reading and starting quiz
  const handleFinishReading = () => {
    setIsReadingPhase(false);
    handleStartQuiz();
  };

  // Timer effect for reading phase
  useEffect(() => {
    if (readingTimeLeft > 0 && isReadingPhase) {
      const timer = setTimeout(() => {
        setReadingTimeLeft(readingTimeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (readingTimeLeft === 0 && isReadingPhase) {
      // Time's up - automatically move to quiz
      handleFinishReading();
    }
  }, [readingTimeLeft, isReadingPhase]);

  // Shuffle choices when question changes
  useEffect(() => {
    if (
      currentQuestion &&
      quizStarted &&
      currentQuestion.id !== lastQuestionIdRef.current
    ) {
      lastQuestionIdRef.current = currentQuestion.id;
      const shuffled = [...currentQuestion.choices].sort(
        () => Math.random() - 0.5,
      );
      setShuffledChoices(shuffled);
      setTimeLeft(currentQuestion.timeLimit);
      setSelectedAnswer("");
      setIsAnswered(false);
      setShowExplanation(false);
      setIsCorrect(false);
      setPointsAwarded(0);
      timerEffectRanAtLeastOnce.current = false; // Reset for new question

      // For retry mode, don't check if question is completed - always allow fresh attempt
      // if (status !== "retry" && isQuestionCompleted(currentQuestion.id)) {
      //   setIsAnswered(true);
      //   setShowExplanation(true);
      //   setTimeLeft(0);
      // }
    }
  }, [
    currentQuestion,
    quizStarted,
    userId,
    initialStatus,
    isQuestionCompleted,
  ]);

  const handleTimeOut = useCallback(async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    try {
      // Determine if points should be disallowed
      const disallowPoints =
        initialStatus === "retry" ||
        (initialStatus === "continue" &&
          isQuestionCompleted(currentQuestion.id));

      const result = await submitRCAnswer(
        currentQuestion.id,
        "", // No answer selected
        keywordId,
        rcLevelId,
        true, // isTimedOut = true
        disallowPoints,
      );

      if (result.success) {
        setIsCorrect(result.isCorrect || false);
        setPointsAwarded(result.pointsAwarded || 0);
        setShowExplanation(true);
        setIsAnswered(true);
      }
    } catch (error) {
      console.error("Error submitting timeout:", error);
    }
    setIsSubmitting(false);
  }, [
    currentQuestion,
    keywordId,
    rcLevelId,
    initialStatus,
    isQuestionCompleted,
  ]);

  // Timer effect
  useEffect(() => {
    if (
      timeLeft > 0 &&
      !isAnswered &&
      !showExplanation &&
      quizStarted &&
      currentQuestion
    ) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      timerEffectRanAtLeastOnce.current = true; // Mark that timer logic has started for this question with timeLeft > 0
      return () => clearTimeout(timer);
    } else if (
      timeLeft === 0 &&
      timerEffectRanAtLeastOnce.current && // Only if timer was active
      !isAnswered &&
      !showExplanation &&
      quizStarted &&
      currentQuestion &&
      shuffledChoices.length > 0
    ) {
      // Time's up - auto submit
      handleTimeOut();
    }
  }, [
    timeLeft,
    isAnswered,
    showExplanation,
    quizStarted,
    currentQuestion,
    shuffledChoices.length,
    handleTimeOut,
  ]);

  // Handle page visibility and cleanup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        currentQuestion &&
        !isAnswered &&
        !showExplanation &&
        quizStarted
      ) {
        // User switched tabs or minimized window - mark as timeout
        submitRCAnswer(
          currentQuestion.id,
          "", // No answer selected
          keywordId,
          rcLevelId,
          true, // Timed out/left page
          initialStatus === "retry",
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentQuestion && !isAnswered && !showExplanation && quizStarted) {
        // User is leaving the page - mark as timeout
        submitRCAnswer(
          currentQuestion.id,
          "", // No answer selected
          keywordId,
          rcLevelId,
          true, // Timed out/left page
          initialStatus === "retry",
        );

        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = "";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    currentQuestion,
    isAnswered,
    showExplanation,
    quizStarted,
    keywordId,
    rcLevelId,
    initialStatus,
  ]);

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswered && timeLeft > 0 && !showExplanation) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Determine if points should be disallowed
      const disallowPoints =
        initialStatus === "retry" ||
        (initialStatus === "continue" &&
          isQuestionCompleted(currentQuestion.id));

      const result = await submitRCAnswer(
        currentQuestion.id,
        selectedAnswer,
        keywordId,
        rcLevelId,
        false, // isTimedOut = false
        disallowPoints,
      );

      if (result.success) {
        setIsCorrect(result.isCorrect || false);
        setPointsAwarded(result.pointsAwarded || 0);
        setTotalPointsEarned((prev) => prev + (result.pointsAwarded || 0));
        setShowExplanation(true);
        setIsAnswered(true);
        if (result.isCorrect) {
          setCorrectAnswersCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
    setIsSubmitting(false);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Reset states for the upcoming question
      setSelectedAnswer("");
      setIsAnswered(false);
      setShowExplanation(false);
      setIsCorrect(false);
      setPointsAwarded(0);
      // lastQuestionIdRef will be updated by the useEffect for the new question.
      // timeLeft will be set by the useEffect for the new question.

      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);

      // Save quiz completion result for first/second try tracking
      try {
        await saveRCQuizCompletion(
          questionSet.id,
          keywordId,
          rcLevelId,
          questions.length,
          correctAnswersCount,
        );
      } catch (error) {
        console.error("Error saving quiz completion:", error);
        // Don't prevent quiz completion if saving fails
      }
    }
  };

  const handleFinishQuiz = () => {
    router.push(`/rc/${rcLevelId}`);
  };

  const handleRetryQuiz = () => {
    window.location.href = `/rc/${rcLevelId}/${keywordId}?status=retry`;
  };

  // Calculate overall progress
  const totalQuestions = questions.length;

  if (questions.length === 0) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="py-12 text-center">
          <div className="text-gray-500">
            <div className="mb-4 text-4xl">📝</div>
            <h3 className="mb-2 text-lg font-medium">No Questions Available</h3>
            <p>
              This reading comprehension doesn&apos;t have any questions yet.
            </p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    // Use the initial status that was set when the quiz started
    const effectiveStatus = initialStatus;

    return (
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="mb-4 text-4xl">🎉</div>
          <div className="space-y-4">
            <p className="text-lg">
              You&apos;ve completed the reading comprehension quiz for:
            </p>
            <p
              className="text-lg"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(questionSet.title),
              }}
            />

            {/* Score Display */}
            <div className="mx-auto flex w-fit gap-8">
              <div className="rounded-full border-2 border-primary/20 bg-primary/10 px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {correctAnswersCount}/{totalQuestions}
                  </div>
                  <div className="text-sm font-medium text-primary/80">
                    Correct Answers
                  </div>
                </div>
              </div>
              {effectiveStatus !== "retry" && (
                <div className="rounded-full border-2 border-amber-500/20 bg-amber-500/10 px-6 py-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {totalPointsEarned}
                    </div>
                    <div className="text-sm font-medium text-amber-600/80">
                      Total Score
                    </div>
                  </div>
                </div>
              )}
            </div>

            {effectiveStatus === "start" && totalPointsEarned > 0 && (
              <p className="text-sm text-green-600">
                Great job! You earned {totalPointsEarned} points
              </p>
            )}
            {effectiveStatus === "continue" && (
              <p className="text-sm text-amber-600">
                {totalPointsEarned > 0
                  ? `Points earned this session: ${totalPointsEarned} (Previously completed questions do not award new points)`
                  : "Previously completed questions do not award new points"}
              </p>
            )}
            {effectiveStatus === "retry" && (
              <p className="text-sm text-amber-600">
                Retry mode - no points awarded
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={handleRetryQuiz}>
              Retry Quiz
            </Button>
            <Button onClick={handleFinishQuiz}>Back to RC Level</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  // Show start quiz screen if quiz hasn't started and reading hasn't started
  if (!hasStartedReading) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="py-12 text-center">
          <div className="space-y-6">
            <div className="text-6xl">📖</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">Ready to Start?</h3>
              <p className="text-gray-600">
                You&apos;ll have {questionSet.timeLimit || 60} seconds to read
                the passage before the questions begin.
              </p>
            </div>
            <div className="mx-auto max-w-md space-y-2 text-left text-sm text-gray-600">
              <p>• Read the passage carefully during the reading time</p>
              <p>
                • After reading time, you&apos;ll answer {totalQuestions}{" "}
                questions
              </p>
              <p>• Each question has its own time limit</p>
              <p>• You can start the quiz early if you finish reading</p>
              {initialStatus === "retry" && (
                <p className="font-medium text-amber-600">
                  • No points will be awarded for retry attempts
                </p>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={handleStartReading}>Start Reading</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show reading phase if in reading phase
  if (isReadingPhase) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        {/* Timer and Controls */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Reading Time</CardTitle>
                <CardDescription>
                  Read the passage carefully before the questions begin
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Time Remaining:</span>
                  <div className="w-24">
                    <Progress
                      value={
                        (readingTimeLeft / (questionSet.timeLimit || 60)) * 100
                      }
                      className={`h-2 ${readingTimeLeft <= 10 ? "bg-red-100" : ""}`}
                    />
                  </div>
                  <span
                    className={`text-lg font-medium ${readingTimeLeft <= 10 ? "text-red-600" : "text-gray-700"}`}
                  >
                    {Math.floor(readingTimeLeft / 60)}:
                    {String(readingTimeLeft % 60).padStart(2, "0")}
                  </span>
                </div>
                <Button onClick={handleFinishReading} variant="outline">
                  Start Quiz Early
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Passage */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(questionSet.title),
                }}
              />
            </CardTitle>
            <CardDescription>Reading Passage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="text-base leading-relaxed whitespace-pre-wrap">
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(questionSet.passage),
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show quiz only after reading phase is complete
  if (!quizStarted) {
    return null;
  }

  const questionCompleted =
    initialStatus !== "retry" && isQuestionCompleted(currentQuestion.id);
  const completedScore = getCompletedScore(currentQuestion.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left side - Passage */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(questionSet.title),
                }}
              />
            </CardTitle>
            <CardDescription>Reading Passage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                <span
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(questionSet.passage),
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Progress, Timer, and Question */}
      <div className="space-y-4">
        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Progress</CardTitle>
              <Badge variant="outline">
                {currentQuestionIndex + 1}/{totalQuestions}
              </Badge>
            </div>
            <Progress
              value={((currentQuestionIndex + 1) / totalQuestions) * 100}
              className="h-2"
            />
          </CardHeader>
        </Card>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => {
            const completed =
              initialStatus !== "retry" && isQuestionCompleted(question.id);
            const isCurrent = index === currentQuestionIndex;
            return (
              <div
                key={question.id}
                className={`relative inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border bg-background shadow-xs"
                } ${completed && !isCurrent ? "border-green-500" : ""}`}
              >
                {index + 1}
                {completed && (
                  <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Timer and Current Question */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between">
              <CardTitle className="text-lg">
                Question {currentQuestion.orderNumber}
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Points: {currentQuestion.score}
                </div>
                {/* Show timer if question is not answered in current session */}
                {!isAnswered && !showExplanation && timeLeft > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Time:</span>
                    <div className="w-16">
                      <Progress
                        value={(timeLeft / currentQuestion.timeLimit) * 100}
                        className={`h-2 ${timeLeft <= 10 ? "bg-red-100" : ""}`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium ${timeLeft <= 10 ? "text-red-600" : "text-gray-700"}`}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                )}
                {/* Show completed badge only after answering in current session */}
                {(isAnswered || showExplanation) && questionCompleted && (
                  <Badge
                    variant="secondary"
                    className="border-green-200 bg-green-100 text-green-800"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed ({completedScore}/{currentQuestion.score})
                  </Badge>
                )}
                {/* Show timeout message if time ran out */}
                {!isAnswered && !showExplanation && timeLeft === 0 && (
                  <Badge
                    variant="secondary"
                    className="border-red-200 bg-red-100 text-red-800"
                  >
                    Time&apos;s Up
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription className="text-base leading-relaxed">
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(currentQuestion.question),
                }}
              />
            </CardDescription>
          </CardHeader>

          <CardContent>
            <RadioGroup
              value={selectedAnswer || ""}
              onValueChange={handleAnswerSelect}
              disabled={showExplanation || timeLeft === 0 || isAnswered}
            >
              {shuffledChoices.map((choice, index) => {
                const choiceLabel = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = selectedAnswer === choice;
                const isCorrectAnswer = choice === currentQuestion.answer;

                let choiceClassName =
                  "flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors";

                if (showExplanation) {
                  if (isCorrectAnswer) {
                    choiceClassName += " border-green-500 bg-green-50";
                  } else if (isSelected && !isCorrectAnswer) {
                    choiceClassName += " border-red-500 bg-red-50";
                  }
                }

                const isDisabled = showExplanation || timeLeft === 0;

                if (isDisabled) {
                  choiceClassName += " cursor-not-allowed opacity-75";
                  choiceClassName = choiceClassName.replace(
                    "hover:bg-accent",
                    "",
                  );
                }

                return (
                  <div
                    key={index}
                    className={choiceClassName}
                    onClick={() => !isDisabled && handleAnswerSelect(choice)}
                    role="button"
                    tabIndex={isDisabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                        e.preventDefault();
                        handleAnswerSelect(choice);
                      }
                    }}
                  >
                    <div className="pointer-events-none">
                      <RadioGroupItem value={choice} id={`choice-${index}`} />
                    </div>
                    <Label
                      htmlFor={`choice-${index}`}
                      className="pointer-events-none flex flex-1 cursor-pointer flex-wrap font-medium"
                    >
                      <span className="mr-2 font-bold">{choiceLabel}.</span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(choice),
                        }}
                      />
                    </Label>
                    {showExplanation && isCorrectAnswer && (
                      <CheckCircle className="pointer-events-none h-5 w-5 text-green-600" />
                    )}
                    {showExplanation && isSelected && !isCorrectAnswer && (
                      <XCircle className="pointer-events-none h-5 w-5 text-red-600" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>

            {/* Submit Button */}
            {!showExplanation && timeLeft > 0 && (
              <div className="mt-6">
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Answer"}
                </Button>
              </div>
            )}

            {/* Next Question Button */}
            {showExplanation && (
              <div className="mt-6">
                <Button onClick={handleNextQuestion} className="w-full">
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}
                </Button>
              </div>
            )}

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-2 font-semibold text-amber-800">
                  Explanation
                </h4>
                <p
                  className="text-amber-700"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(currentQuestion.explanation),
                  }}
                />
                <p className="mt-2 text-sm text-amber-600">
                  {isCorrect
                    ? pointsAwarded > 0
                      ? `Correct! +${pointsAwarded} points`
                      : initialStatus === "retry"
                        ? "Correct! (No points awarded for retry)"
                        : "Correct! (Previously completed, no new points)"
                    : timeLeft === 0
                      ? "Time's up! No points awarded."
                      : "Incorrect. No points awarded."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
