import DOMPurify from "isomorphic-dompurify";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionScreenProps {
  questionSetTitle: string;
  correctAnswersCount: number;
  totalQuestions: number;
  totalPointsEarned: number;
  effectiveStatus: string;
  onRetryQuiz: () => void;
  onFinishQuiz: () => void;
}

export function RCQuizCompletionScreen({
  questionSetTitle,
  correctAnswersCount,
  totalQuestions,
  totalPointsEarned,
  effectiveStatus,
  onRetryQuiz,
  onFinishQuiz,
}: CompletionScreenProps) {
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
              __html: DOMPurify.sanitize(questionSetTitle),
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
          <Button variant="outline" onClick={onRetryQuiz}>
            Retry Quiz
          </Button>
          <Button onClick={onFinishQuiz}>Back to RC Level</Button>
        </div>
      </CardContent>
    </Card>
  );
}
