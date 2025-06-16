import DOMPurify from "isomorphic-dompurify";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ReadingPhaseProps {
  title: string;
  passage: string;
  timeLimit: number;
  readingTimeLeft: number;
  onFinishReading: () => void;
}

export function RCQuizReadingPhase({
  title,
  passage,
  timeLimit,
  readingTimeLeft,
  onFinishReading,
}: ReadingPhaseProps) {
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
                    value={(readingTimeLeft / timeLimit) * 100}
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
              <Button onClick={onFinishReading} variant="outline">
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
                __html: DOMPurify.sanitize(title),
              }}
            />
          </CardTitle>
          <CardDescription>Reading Passage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="text-base leading-relaxed whitespace-pre-wrap [&_p]:mb-2 [&_p:empty]:h-4 [&_p:last-child]:mb-0">
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(passage),
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
