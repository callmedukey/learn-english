import { CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  questions: Array<{
    id: string;
    RCQuestionCompleted: Array<{
      userId: string;
      score: number;
    }>;
  }>;
  currentQuestionIndex: number;
  userId: string;
  initialStatus: string;
}

export function RCQuizProgress({
  questions,
  currentQuestionIndex,
  userId,
  initialStatus,
}: QuizProgressProps) {
  const totalQuestions = questions.length;

  const isQuestionCompleted = (question: (typeof questions)[0]) => {
    return (
      question.RCQuestionCompleted.some(
        (completed) => completed.userId === userId,
      ) || false
    );
  };

  return (
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
            initialStatus !== "retry" && isQuestionCompleted(question);
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
    </div>
  );
}
