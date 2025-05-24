"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { completeQuestionAction } from "../actions/question.actions";
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
  const [quizStarted, setQuizStarted] = useState(false);
  const lastQuestionIdRef = useRef<string | null>(null);

  const questions = useMemo(
    () => chapter.novelQuestionSet?.novelQuestions || [],
    [chapter.novelQuestionSet?.novelQuestions],
  );
  const canAccess = chapter.isFree || userHasPaidSubscription;

  // Filter questions based on status
  const getQuestionsToShow = useCallback(() => {
    if (status === "retry") {
      return questions; // Show all questions for retry
    } else if (status === "continue") {
      return questions.filter((q) => !q.isCompleted); // Show only incomplete questions
    } else {
      return questions; // Show all questions for start
    }
  }, [questions, status]);

  const questionsToShow = getQuestionsToShow();
  const currentQuestion = questionsToShow[currentQuestionIndex];

  // Reset quiz state when starting
  const handleStartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswered(false);
    setShowExplanation(false);
    setQuizCompleted(false);
    setTotalPointsEarned(0);
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
      setSelectedAnswer("");
      setIsAnswered(false);
      setShowExplanation(false);
      setIsCorrect(false);
      setPointsAwarded(0);
    }
  }, [currentQuestion, quizStarted]);

  const handleTimeOut = useCallback(async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    const result = await completeQuestionAction(
      currentQuestion.id,
      userId,
      "", // No answer selected
      true, // Timed out
      status === "retry",
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
      currentQuestion
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
      shuffledChoices.length > 0 // Ensure question is fully loaded
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
    const result = await completeQuestionAction(
      currentQuestion.id,
      userId,
      selectedAnswer,
      false, // Not timed out
      status === "retry",
    );

    if (result.success) {
      setIsCorrect(result.isCorrect || false);
      setPointsAwarded(result.pointsAwarded || 0);
      setTotalPointsEarned((prev) => prev + (result.pointsAwarded || 0));
      setShowExplanation(true);
      setIsAnswered(true);
    }
    setIsSubmitting(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsToShow.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
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
            <Button className="mt-4" onClick={() => router.push("/pricing")}>
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chapter.novelQuestionSet || questionsToShow.length === 0) {
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
          <div className="space-y-2">
            <p className="text-lg">
              You&apos;ve completed Chapter {chapter.orderNumber}:{" "}
              {chapter.title}
            </p>
            {status !== "retry" && (
              <p className="font-medium text-green-600">
                Points earned: {totalPointsEarned}
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
              <p>• {questionsToShow.length} questions total</p>
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
    ((currentQuestionIndex + 1) / questionsToShow.length) * 100;
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
                {currentQuestionIndex + 1} of {questionsToShow.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

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
                  "w-full text-left p-4 border rounded-lg transition-colors ";

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

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(choice)}
                    disabled={isAnswered || timeLeft === 0 || showExplanation}
                    className={buttonClass}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{choice}</span>
                    </div>
                  </button>
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
                  {currentQuestionIndex < questionsToShow.length - 1
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
