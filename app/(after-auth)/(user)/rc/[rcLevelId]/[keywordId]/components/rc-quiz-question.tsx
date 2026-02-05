import DOMPurify from "isomorphic-dompurify";
import { CheckCircle, XCircle } from "lucide-react";

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

interface QuestionProps {
  question: {
    id: string;
    orderNumber: number;
    question: string;
    answer: string;
    explanation: string;
    score: number;
    timeLimit: number;
  };
  shuffledChoices: string[];
  selectedAnswer: string;
  timeLeft: number;
  isAnswered: boolean;
  showExplanation: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
  isSubmitting: boolean;
  onAnswerSelect: (answer: string) => void;
  onSubmitAnswer: () => void;
  onNextQuestion: () => void;
  currentQuestionIndex: number;
  totalQuestions: number;
  initialStatus: string;
  fontSizeClasses: string;
}

export function RCQuizQuestion({
  question,
  shuffledChoices,
  selectedAnswer,
  timeLeft,
  isAnswered,
  showExplanation,
  isCorrect,
  pointsAwarded,
  isSubmitting,
  onAnswerSelect,
  onSubmitAnswer,
  onNextQuestion,
  currentQuestionIndex,
  totalQuestions,
  initialStatus,
  fontSizeClasses,
}: QuestionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between">
          <CardTitle className="text-lg">
            Question {question.orderNumber}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Points: {question.score}
            </div>
            {/* Show timer if question is not answered in current session */}
            {!isAnswered && !showExplanation && timeLeft > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Time:</span>
                <div className="w-16">
                  <Progress
                    value={(timeLeft / question.timeLimit) * 100}
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
        <CardDescription
          className={`text-base leading-relaxed ${fontSizeClasses}`}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(question.question),
            }}
          />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <RadioGroup
          value={selectedAnswer || ""}
          onValueChange={onAnswerSelect}
          disabled={showExplanation || timeLeft === 0 || isAnswered}
        >
          {shuffledChoices.map((choice, index) => {
            const choiceLabel = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === choice;
            const isCorrectAnswer = choice === question.answer;

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
              choiceClassName = choiceClassName.replace("hover:bg-accent", "");
            }

            return (
              <div
                key={index}
                className={choiceClassName}
                onClick={() => !isDisabled && onAnswerSelect(choice)}
                role="button"
                tabIndex={isDisabled ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                    e.preventDefault();
                    onAnswerSelect(choice);
                  }
                }}
              >
                <div className="pointer-events-none">
                  <RadioGroupItem value={choice} id={`choice-${index}`} />
                </div>
                <Label
                  htmlFor={`choice-${index}`}
                  className={`pointer-events-none flex flex-1 cursor-pointer flex-wrap font-medium ${fontSizeClasses}`}
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
              onClick={onSubmitAnswer}
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
            <Button onClick={onNextQuestion} className="w-full">
              {currentQuestionIndex < totalQuestions - 1
                ? "Next Question"
                : "Finish Quiz"}
            </Button>
          </div>
        )}

        {/* Explanation */}
        {showExplanation && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            {timeLeft > 0 && (
              <>
                <h4 className="mb-2 font-semibold text-amber-800">Explanation</h4>
                <p
                  className={`text-amber-700 ${fontSizeClasses}`}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(question.explanation),
                  }}
                />
              </>
            )}
            <p className={`${timeLeft > 0 ? "mt-2" : ""} text-sm text-amber-600`}>
              {isCorrect
                ? pointsAwarded > 0
                  ? `Correct! +${pointsAwarded} points`
                  : initialStatus === "retry"
                    ? "Correct! (No points awarded for retry)"
                    : "Correct! (Previously completed, no new points)"
                : timeLeft === 0
                  ? "Time&apos;s up! No points awarded."
                  : "Incorrect. No points awarded."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
