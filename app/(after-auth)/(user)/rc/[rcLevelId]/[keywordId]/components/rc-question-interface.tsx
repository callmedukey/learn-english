"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { submitRCAnswer } from "@/app/actions/rc-actions";
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

interface RCQuestionInterfaceProps {
  questionSet: {
    id: string;
    title: string;
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
  userId?: string;
  keywordId: string;
  rcLevelId: string;
}

export function RCQuestionInterface({
  questionSet,
  userId,
  keywordId,
  rcLevelId,
}: RCQuestionInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const questions = questionSet.RCQuestion;
  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No questions available.</p>
        </CardContent>
      </Card>
    );
  }

  const isCompleted = () => {
    return currentQuestion.RCQuestionCompleted.some(
      (completed) => completed.userId === userId,
    );
  };

  const getCompletedScore = () => {
    const completed = currentQuestion.RCQuestionCompleted.find(
      (completed) => completed.userId === userId,
    );
    return completed?.score || 0;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitAnswer = async (questionId: string) => {
    if (!userId || !selectedAnswers[questionId]) return;

    startTransition(async () => {
      try {
        const result = await submitRCAnswer(
          questionId,
          selectedAnswers[questionId],
          keywordId,
          rcLevelId,
        );

        if (result.success) {
          setShowResults((prev) => ({
            ...prev,
            [questionId]: true,
          }));
        }
      } catch (error) {
        console.error("Error submitting answer:", error);
        // You could add toast notification here for error handling
      }
    });
  };

  const selectedAnswer = selectedAnswers[currentQuestion.id];
  const showResult = showResults[currentQuestion.id];
  const questionCompleted = isCompleted();
  const completedScore = getCompletedScore();

  const canSubmit = selectedAnswer && !questionCompleted && !showResult;

  // Calculate overall progress
  const totalQuestions = questions.length;
  const completedQuestions = questions.filter((q) =>
    q.RCQuestionCompleted.some((completed) => completed.userId === userId),
  ).length;
  const progressPercentage =
    totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question Progress</CardTitle>
            <Badge variant="outline">
              {completedQuestions}/{totalQuestions} completed
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
      </Card>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => {
          const completed = question.RCQuestionCompleted.some(
            (completed) => completed.userId === userId,
          );
          return (
            <Button
              key={question.id}
              variant={index === currentQuestionIndex ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentQuestionIndex(index)}
              className={`relative ${completed ? "border-green-500" : ""}`}
            >
              {index + 1}
              {completed && (
                <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestion.orderNumber}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                {currentQuestion.timeLimit}min
              </Badge>
              <Badge variant="outline">{currentQuestion.score} points</Badge>
              {questionCompleted && (
                <Badge
                  variant="secondary"
                  className="border-green-200 bg-green-100 text-green-800"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed ({completedScore}/{currentQuestion.score})
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className="text-base leading-relaxed">
            {currentQuestion.question}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <RadioGroup
            value={selectedAnswer || ""}
            onValueChange={(value: string) =>
              handleAnswerSelect(currentQuestion.id, value)
            }
            disabled={questionCompleted || showResult}
          >
            {currentQuestion.choices.map((choice, index) => {
              const choiceLabel = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = selectedAnswer === choice;
              const isCorrectAnswer = choice === currentQuestion.answer;

              let choiceClassName =
                "flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent";

              if (showResult || questionCompleted) {
                if (isCorrectAnswer) {
                  choiceClassName += " border-green-500 bg-green-50";
                } else if (isSelected && !isCorrectAnswer) {
                  choiceClassName += " border-red-500 bg-red-50";
                }
              }

              return (
                <div key={index} className={choiceClassName}>
                  <RadioGroupItem value={choice} id={`choice-${index}`} />
                  <Label
                    htmlFor={`choice-${index}`}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    <span className="mr-2 font-bold">{choiceLabel}.</span>
                    {choice}
                  </Label>
                  {(showResult || questionCompleted) && isCorrectAnswer && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {(showResult || questionCompleted) &&
                    isSelected &&
                    !isCorrectAnswer && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                </div>
              );
            })}
          </RadioGroup>

          {/* Submit Button */}
          {!questionCompleted && (
            <div className="mt-6">
              <Button
                onClick={() => handleSubmitAnswer(currentQuestion.id)}
                disabled={!canSubmit || isPending}
                className="w-full"
              >
                {isPending ? "Submitting..." : "Submit Answer"}
              </Button>
            </div>
          )}

          {/* Explanation */}
          {(showResult || questionCompleted) && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 font-semibold text-amber-800">Explanation</h4>
              <p className="text-amber-700">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
