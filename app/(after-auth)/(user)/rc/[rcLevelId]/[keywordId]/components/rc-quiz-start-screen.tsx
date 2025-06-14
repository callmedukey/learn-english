import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StartScreenProps {
  timeLimit: number;
  totalQuestions: number;
  initialStatus: string;
  onStartReading: () => void;
  onGoBack: () => void;
}

export function RCQuizStartScreen({
  timeLimit,
  totalQuestions,
  initialStatus,
  onStartReading,
  onGoBack,
}: StartScreenProps) {
  return (
    <Card className="mx-auto max-w-4xl">
      <CardContent className="py-12 text-center">
        <div className="space-y-6">
          <div className="text-6xl">📖</div>
          <div>
            <h3 className="mb-2 text-xl font-semibold">Ready to Start?</h3>
            <p className="text-gray-600">
              You&apos;ll have {timeLimit || 60} seconds to read the passage
              before the questions begin.
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
            <Button variant="outline" onClick={onGoBack}>
              Go Back
            </Button>
            <Button onClick={onStartReading}>Start Reading</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
