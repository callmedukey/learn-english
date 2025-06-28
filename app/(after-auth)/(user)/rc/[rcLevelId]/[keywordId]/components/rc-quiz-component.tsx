"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState, useMemo } from "react";

import { confirmChallengeParticipation } from "@/actions/challenge-confirmation";
import { ChallengeParticipationDialog } from "@/components/challenge-participation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRCPageVisibility } from "@/hooks/use-rc-page-visibility";
import { useRCQuizState } from "@/hooks/use-rc-quiz-state";
import { useRCTimer } from "@/hooks/use-rc-timer";

import { RCQuizCompletionScreen } from "./rc-quiz-completion-screen";
import { RCQuizPassage } from "./rc-quiz-passage";
import { RCQuizProgress } from "./rc-quiz-progress";
import { RCQuizQuestion } from "./rc-quiz-question";
import { RCQuizReadingPhase } from "./rc-quiz-reading-phase";
import { RCQuizStartScreen } from "./rc-quiz-start-screen";
import {
  submitRCAnswer,
  saveRCQuizCompletion,
  markRCQuestionAsStarted,
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
  fontSizeClasses: string;
  challengeInfo?: {
    isChallengeContent: boolean;
    hasJoinedChallenge: boolean;
    isLockedToDifferentLevel: boolean;
    currentLockedLevelId: string | null;
    challengeDetails: {
      year: number;
      month: number;
      totalContent: number;
      levelName: string;
      challengeId: string;
    } | null;
  };
  keywordName?: string;
}

export function RCQuizComponent({
  questionSet,
  userId,
  keywordId,
  rcLevelId,
  status,
  fontSizeClasses,
  challengeInfo,
  keywordName = "Keyword",
}: RCQuizComponentProps) {
  const router = useRouter();
  const [initialStatus] = useState(status);
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [hasCheckedChallenge, setHasCheckedChallenge] = useState(false);

  // Use our custom hook for state management
  const {
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
    setIsReadingPhase,
    setReadingTimeLeft,
    setHasStartedReading,
    resetQuestionState,
    resetQuiz,
  } = useRCQuizState(questionSet.timeLimit);

  const questions = useMemo(
    () => questionSet.RCQuestion || [],
    [questionSet.RCQuestion],
  );

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
    resetQuiz();
  };

  // Actually start the reading phase
  const startReadingImmediately = () => {
    setIsReadingPhase(true);
    setHasStartedReading(true);
    setReadingTimeLeft(questionSet.timeLimit || 60); // Default to 60 seconds if not set
  };

  // Handle starting reading phase with challenge check
  const handleStartReading = () => {
    // Check if this is challenge content and user hasn't joined
    if (
      challengeInfo?.isChallengeContent &&
      !challengeInfo.hasJoinedChallenge &&
      !hasCheckedChallenge
    ) {
      setShowChallengeDialog(true);
      return;
    }

    // If no challenge dialog needed, start reading immediately
    startReadingImmediately();
  };

  // Handle joining the challenge
  const handleJoinChallenge = async () => {
    try {
      await confirmChallengeParticipation("RC", rcLevelId);
      setShowChallengeDialog(false);
      setHasCheckedChallenge(true);
      // Start the reading phase after successfully joining
      startReadingImmediately();
    } catch (error) {
      console.error("Failed to join challenge:", error);
      // Still allow them to continue
      setShowChallengeDialog(false);
      setHasCheckedChallenge(true);
      startReadingImmediately();
    }
  };

  // Handle continuing without joining
  const handleContinueWithoutJoining = () => {
    setShowChallengeDialog(false);
    setHasCheckedChallenge(true);
    // Start the reading phase
    startReadingImmediately();
  };

  // New function to handle finishing reading and starting quiz
  const handleFinishReading = () => {
    setIsReadingPhase(false);
    handleStartQuiz();
  };

  // Use timer hook for reading phase
  useRCTimer({
    timeLeft: readingTimeLeft,
    setTimeLeft: setReadingTimeLeft,
    isActive: isReadingPhase,
    onTimeOut:
      isReadingPhase && readingTimeLeft === 0 ? handleFinishReading : undefined,
  });

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

      // Mark question as started immediately when displayed
      // This prevents users from exiting and coming back
      markRCQuestionAsStarted(currentQuestion.id, keywordId, rcLevelId)
        .then((result) => {
          if (!result.success) {
            console.error("Failed to mark question as started:", result.error);
          }
        })
        .catch((error) => {
          console.error("Error marking question as started:", error);
        });
    }
  }, [
    currentQuestion,
    quizStarted,
    userId,
    keywordId,
    rcLevelId,
    lastQuestionIdRef,
    setShuffledChoices,
    setTimeLeft,
    setSelectedAnswer,
    setIsAnswered,
    setShowExplanation,
    setIsCorrect,
    setPointsAwarded,
    timerEffectRanAtLeastOnce,
  ]);

  const handleTimeOut = useCallback(async () => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    try {
      // Points are only disallowed in retry mode
      const disallowPoints = initialStatus === "retry";

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
  }, [currentQuestion, keywordId, rcLevelId, initialStatus]);

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

  // Use page visibility hook
  useRCPageVisibility({
    currentQuestionId: currentQuestion?.id,
    isAnswered,
    showExplanation,
    quizStarted,
    keywordId,
    rcLevelId,
    initialStatus,
  });

  const handleAnswerSelect = (answer: string) => {
    if (!isAnswered && timeLeft > 0 && !showExplanation) {
      setSelectedAnswer(answer);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Points are only disallowed in retry mode
      const disallowPoints = initialStatus === "retry";

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
      resetQuestionState();
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
    return (
      <RCQuizCompletionScreen
        questionSetTitle={questionSet.title}
        correctAnswersCount={correctAnswersCount}
        totalQuestions={totalQuestions}
        totalPointsEarned={totalPointsEarned}
        effectiveStatus={initialStatus}
        onRetryQuiz={handleRetryQuiz}
        onFinishQuiz={handleFinishQuiz}
      />
    );
  }

  if (!currentQuestion) return null;

  // Show start quiz screen if quiz hasn't started and reading hasn't started
  if (!hasStartedReading) {
    return (
      <RCQuizStartScreen
        timeLimit={questionSet.timeLimit}
        totalQuestions={totalQuestions}
        initialStatus={initialStatus}
        onStartReading={handleStartReading}
        onGoBack={() => router.back()}
      />
    );
  }

  // Show reading phase if in reading phase
  if (isReadingPhase) {
    return (
      <RCQuizReadingPhase
        title={questionSet.title}
        passage={questionSet.passage}
        timeLimit={questionSet.timeLimit || 60}
        readingTimeLeft={readingTimeLeft}
        onFinishReading={handleFinishReading}
        fontSizeClasses={fontSizeClasses}
      />
    );
  }

  // Show quiz only after reading phase is complete
  if (!quizStarted) {
    return null;
  }

  const questionCompleted =
    initialStatus !== "retry" &&
    currentQuestion.RCQuestionCompleted.some(
      (completed) => completed.userId === userId && completed.score >= 0,
    ) &&
    getCompletedScore(currentQuestion.id) > 0; // Only consider it truly completed if they've submitted an answer
  const completedScore = getCompletedScore(currentQuestion.id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left side - Passage */}
      <div className="space-y-4">
        <RCQuizPassage
          title={questionSet.title}
          passage={questionSet.passage}
          fontSizeClasses={fontSizeClasses}
        />
      </div>

      {/* Right side - Progress, Timer, and Question */}
      <div className="space-y-4">
        <RCQuizProgress
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          userId={userId}
          initialStatus={initialStatus}
        />

        <RCQuizQuestion
          question={currentQuestion}
          shuffledChoices={shuffledChoices}
          selectedAnswer={selectedAnswer}
          timeLeft={timeLeft}
          isAnswered={isAnswered}
          showExplanation={showExplanation}
          isCorrect={isCorrect}
          pointsAwarded={pointsAwarded}
          isSubmitting={isSubmitting}
          questionCompleted={questionCompleted}
          completedScore={completedScore}
          onAnswerSelect={handleAnswerSelect}
          onSubmitAnswer={handleSubmitAnswer}
          onNextQuestion={handleNextQuestion}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          initialStatus={initialStatus}
          fontSizeClasses={fontSizeClasses}
        />
      </div>

      {/* Challenge Participation Dialog */}
      {challengeInfo && (
        <ChallengeParticipationDialog
          isOpen={showChallengeDialog}
          onClose={() => setShowChallengeDialog(false)}
          onConfirmJoin={handleJoinChallenge}
          onContinueWithoutJoining={handleContinueWithoutJoining}
          levelName={challengeInfo.challengeDetails?.levelName || ""}
          contentType="keyword"
          contentName={keywordName}
          currentMonth={
            challengeInfo.challengeDetails
              ? new Date(
                  challengeInfo.challengeDetails.year,
                  challengeInfo.challengeDetails.month - 1,
                ).toLocaleString("default", { month: "long" })
              : ""
          }
          currentYear={
            challengeInfo.challengeDetails?.year || new Date().getFullYear()
          }
          totalChallengeContent={
            challengeInfo.challengeDetails?.totalContent || 0
          }
          isLockedToDifferentLevel={challengeInfo.isLockedToDifferentLevel}
          currentLockedLevel={challengeInfo.currentLockedLevelId || undefined}
        />
      )}
    </div>
  );
}
