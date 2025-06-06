"use client";

import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import {
  completeQuestionAction,
  saveNovelQuizCompletion,
} from "../actions/question.actions";
import type {
  ChapterDetailsData,
  ChapterStatus,
} from "../query/chapter-details.query";

interface QuizComponentProps {
  chapter: ChapterDetailsData;
  userId: string;
  status: ChapterStatus;
  arId: string;
  novelId: string;
  userHasPaidSubscription: boolean;
}

// interface QuestionData {
//   id: string;
//   orderNumber: number;
//   question: string;
//   choices: string[];
//   answer: string;
//   explanation: string;
//   score: number;
//   timeLimit: number;
//   isCompleted: boolean;
// }

const QuizComponent: React.FC<QuizComponentProps> = ({
  chapter,
  userId,
  status,
  arId,
  novelId,
  userHasPaidSubscription,
}) => {
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const questions = useMemo(
    () => chapter.novelQuestionSet?.novelQuestions || [],
    [chapter.novelQuestionSet?.novelQuestions],
  );
  const canAccess = chapter.isFree || userHasPaidSubscription;

  // Filter questions based on status
  // const getQuestionsToShow = useCallback(() => {
  //   if (status === "retry") {
  //     return questions; // Show all questions for retry
  //   } else if (status === "continue") {
  //     // return questions.filter((q) => !q.isCompleted); // Show only incomplete questions - REPLACED BY NEW LOGIC
  //     return questions; // For "continue", we now restart from the beginning, so show all.
  //   } else {
  //     return questions; // Show all questions for start
  //   }
  // }, [questions, status]);

  // const questionsToShow = getQuestionsToShow(); // Now directly use 'questions' as it's always the full list.
  const currentQuestion = questions[currentQuestionIndex];

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
      setIsTransitioning(false); // Clear transition flag when new question is ready
    }
  }, [currentQuestion?.id, quizStarted]);

  const handleTimeOut = useCallback(async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    // Determine if points should be disallowed
    // Points are disallowed if status is retry, OR if status is continue and the question was already completed.
    const disallowPoints =
      status === "retry" ||
      (status === "continue" && currentQuestion.isCompleted);

    const result = await completeQuestionAction(
      currentQuestion.id,
      userId,
      "", // No answer selected
      true, // Timed out
      // status === "retry", // Old logic
      disallowPoints,
    );

    if (result.success) {
      setIsCorrect(false);
      setPointsAwarded(result.pointsAwarded || 0);
      setShowExplanation(true);
      setIsAnswered(true);
    }
    setIsSubmitting(false);
  }, [currentQuestion, userId, status]);

  // Timer effect
  useEffect(() => {
    if (
      timeLeft > 0 &&
      !isAnswered &&
      !showExplanation &&
      quizStarted &&
      currentQuestion &&
      !isTransitioning // Don't run timer during transition
    ) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      timeLeft === 0 &&
      !isAnswered &&
      !showExplanation &&
      quizStarted &&
      currentQuestion &&
      shuffledChoices.length > 0 && // Ensure question is fully loaded
      !isTransitioning // Don't auto-submit during transition
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
    isTransitioning,
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
        // User switched tabs or minimized window - mark as incomplete
        completeQuestionAction(
          currentQuestion.id,
          userId,
          "", // No answer selected
          true, // Timed out/left page
          status === "retry",
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentQuestion && !isAnswered && !showExplanation && quizStarted) {
        // User is leaving the page - mark as incomplete
        completeQuestionAction(
          currentQuestion.id,
          userId,
          "", // No answer selected
          true, // Timed out/left page
          status === "retry",
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
    userId,
    status,
    quizStarted,
  ]);

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswered && timeLeft > 0 && !showExplanation) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || isSubmitting) return;

    setIsSubmitting(true);

    // Determine if points should be disallowed
    // Points are disallowed if status is retry, OR if status is continue and the question was already completed.
    const disallowPoints =
      status === "retry" ||
      (status === "continue" && currentQuestion.isCompleted);

    const result = await completeQuestionAction(
      currentQuestion.id,
      userId,
      selectedAnswer,
      false, // Not timed out
      // status === "retry", // Old logic
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
    setIsSubmitting(false);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Set transition flag to prevent timer from auto-submitting
      setIsTransitioning(true);

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
      if (chapter.novelQuestionSet) {
        try {
          await saveNovelQuizCompletion(
            chapter.novelQuestionSet.id,
            chapter.id,
            novelId,
            arId,
            questions.length,
            correctAnswersCount,
            userId,
          );
        } catch (error) {
          console.error("Error saving quiz completion:", error);
          // Don't prevent quiz completion if saving fails
        }
      }
    }
  };

  const handleFinishQuiz = () => {
    if (chapter.nextChapter) {
      router.push(`/novel/${arId}/${novelId}/${chapter.nextChapter.id}`);
    } else {
      router.push(`/novel/${arId}/${novelId}`);
    }
  };

  const handleRetryQuiz = () => {
    window.location.href = `/novel/${arId}/${novelId}/${chapter.id}?status=retry`;
  };

  if (!canAccess) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="py-12 text-center">
          <div className="text-gray-500">
            <div className="mb-4 text-4xl">🔒</div>
            <h3 className="mb-2 text-lg font-medium">Premium Content</h3>
            <p>Upgrade to premium to access this chapter.</p>
            <Button className="mt-4" onClick={() => router.push("/profile")}>
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chapter.novelQuestionSet || questions.length === 0) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="py-12 text-center">
          <div className="text-gray-500">
            <div className="mb-4 text-4xl">📝</div>
            <h3 className="mb-2 text-lg font-medium">No Questions Available</h3>
            <p>This chapter doesn&apos;t have any questions yet.</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="mb-4 text-4xl">🎉</div>
          <div className="space-y-4">
            <p className="text-lg">
              You&apos;ve completed Chapter {chapter.orderNumber}:{" "}
              {chapter.title}
            </p>

            {/* Score Display */}
            <div className="mx-auto w-fit rounded-full border-2 border-primary/20 bg-primary/10 px-6 py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {correctAnswersCount}/{questions.length}
                </div>
                <div className="text-sm font-medium text-primary/80">
                  Correct Answers
                </div>
              </div>
            </div>

            {status === "start" && (
              <p className="font-medium text-green-600">
                Points earned: {totalPointsEarned}
              </p>
            )}
            {status === "continue" && (
              <p className="font-medium text-amber-600">
                Points earned this session: {totalPointsEarned} (Previously
                completed questions do not award new points)
              </p>
            )}
            {status === "retry" && (
              <p className="font-medium text-amber-600">
                Quiz completed (no points awarded for retry)
              </p>
            )}
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" onClick={handleRetryQuiz}>
              Retry Quiz
            </Button>
            <Button onClick={handleFinishQuiz}>
              {chapter.nextChapter ? "Next Chapter" : "Back to Novel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) return null;

  // Show start quiz screen if quiz hasn't started
  if (!quizStarted) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardContent className="py-12 text-center">
          <div className="space-y-6">
            <div className="text-6xl">🚀</div>
            <div>
              <h3 className="mb-2 text-xl font-semibold">Ready to Start?</h3>
              <p className="text-gray-600">
                Once you click start, the timer will begin for each question.
              </p>
            </div>
            <div className="mx-auto max-w-md space-y-2 text-left text-sm text-gray-600">
              <p>• {questions.length} questions total</p>
              <p>• Each question has a time limit</p>
              <p>• You&apos;ll see explanations after each answer</p>
              {status === "retry" && (
                <p className="font-medium text-amber-600">
                  • No points will be awarded for retry attempts
                </p>
              )}
            </div>
            {chapter.novelQuestionSet.instructions && (
              <div className="border-t pt-4">
                <h4 className="mb-2 font-medium">Instructions:</h4>
                <p className="text-sm text-gray-700">
                  {chapter.novelQuestionSet.instructions}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/novel/${arId}/${novelId}`)}
              >
                Cancel
              </Button>
              <Button onClick={handleStartQuiz} size="lg">
                Start Quiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage =
    ((currentQuestionIndex + 1) / questions.length) * 100;
  const timePercentage = (timeLeft / currentQuestion.timeLimit) * 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Question Progress</span>
              <span>
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => {
          const completed = status !== "retry" && question.isCompleted;
          return (
            <Button
              key={question.id}
              variant={index === currentQuestionIndex ? "default" : "outline"}
              size="sm"
              onClick={() => {
                // Set transition flag to prevent timer issues when switching questions
                setIsTransitioning(true);

                // Reset states for the new question
                setSelectedAnswer("");
                setIsAnswered(false);
                setShowExplanation(false);
                setIsCorrect(false);
                setPointsAwarded(0);

                setCurrentQuestionIndex(index);
              }}
              className={`relative ${completed ? "border-green-500" : ""}`}
              disabled={!quizStarted}
            >
              {index + 1}
              {completed && (
                <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestion.orderNumber}
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Points: {currentQuestion.score}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Time:</span>
                <div className="w-16">
                  <Progress
                    value={timePercentage}
                    className={`h-2 ${timeLeft <= 10 ? "bg-red-100" : ""}`}
                  />
                </div>
                <span
                  className={`text-sm font-medium ${timeLeft <= 10 ? "text-red-600" : "text-gray-700"}`}
                >
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-medium">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {shuffledChoices.map((choice, index) => {
                const isSelected = selectedAnswer === choice;
                const isCorrectAnswer = choice === currentQuestion.answer;

                let buttonClass =
                  "w-full text-left p-4 border rounded-lg transition-colors cursor-pointer ";

                if (showExplanation) {
                  if (isCorrectAnswer) {
                    buttonClass +=
                      "bg-green-100 border-green-300 text-green-800";
                  } else if (isSelected && !isCorrectAnswer) {
                    buttonClass += "bg-red-100 border-red-300 text-red-800";
                  } else {
                    buttonClass += "bg-gray-50 border-gray-200 text-gray-600";
                  }
                } else if (isSelected) {
                  buttonClass += "bg-primary/10 border-primary text-primary";
                } else {
                  buttonClass += "bg-white border-gray-200 hover:bg-gray-50";
                }

                const isDisabled =
                  isAnswered || timeLeft === 0 || showExplanation;

                if (isDisabled) {
                  buttonClass += " cursor-not-allowed opacity-75";
                }

                return (
                  <div
                    key={index}
                    onClick={() => !isDisabled && handleAnswerSelect(choice)}
                    className={buttonClass}
                    role="button"
                    tabIndex={isDisabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                        e.preventDefault();
                        handleAnswerSelect(choice);
                      }
                    }}
                  >
                    <div className="pointer-events-none flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{choice}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {showExplanation && (
            <div className="border-t pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <Badge className="bg-green-100 text-green-800">
                      Correct!
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="bg-red-100 text-red-800"
                    >
                      {timeLeft === 0 ? "Time's Up!" : "Incorrect"}
                    </Badge>
                  )}
                  {pointsAwarded > 0 && (
                    <Badge className="bg-amber-100 text-amber-800">
                      +{pointsAwarded} points
                    </Badge>
                  )}
                  {status === "retry" && (
                    <Badge className="bg-gray-100 text-gray-600">
                      Retry Mode
                    </Badge>
                  )}
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Explanation:</h4>
                  <p className="text-gray-700">{currentQuestion.explanation}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Correct Answer:</strong> {currentQuestion.answer}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/novel/${arId}/${novelId}`)}
            >
              Exit Quiz
            </Button>

            <div className="flex gap-2">
              {!showExplanation && selectedAnswer && timeLeft > 0 && (
                <Button onClick={handleSubmitAnswer} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Answer"}
                </Button>
              )}

              {showExplanation && (
                <Button onClick={handleNextQuestion}>
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizComponent;
