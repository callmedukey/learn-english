import { Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ARCardProps {
  ar: {
    id: string;
    level: string;
    score: string;
    stars: number;
    description: string | null;
    novels: Array<{
      id: string;
      novelChapters: Array<{
        id: string;
        novelQuestionSet: {
          novelQuestions: Array<{
            novelQuestionCompleted: Array<{
              userId: string;
            }>;
          }>;
          NovelQuestionFirstTry?: Array<{
            totalQuestions: number;
            correctAnswers: number;
          }>;
          NovelQuestionSecondTry?: Array<{
            totalQuestions: number;
            correctAnswers: number;
          }>;
        } | null;
      }>;
    }>;
  };
  userId?: string;
}

export function ARCard({ ar, userId }: ARCardProps) {
  // Calculate first and second try statistics across all novels and chapters
  let totalChaptersAttempted = 0;
  let firstTryCorrect = 0;
  let firstTryTotal = 0;
  let secondTryCorrect = 0;
  let secondTryTotal = 0;

  if (userId) {
    ar.novels.forEach((novel) => {
      novel.novelChapters.forEach((chapter) => {
        if (chapter.novelQuestionSet) {
          // First Try Data
          if (
            chapter.novelQuestionSet.NovelQuestionFirstTry &&
            chapter.novelQuestionSet.NovelQuestionFirstTry.length > 0
          ) {
            totalChaptersAttempted++;
            const firstTry = chapter.novelQuestionSet.NovelQuestionFirstTry[0];
            firstTryCorrect += firstTry.correctAnswers;
            firstTryTotal += firstTry.totalQuestions;
          }

          // Second Try Data
          if (
            chapter.novelQuestionSet.NovelQuestionSecondTry &&
            chapter.novelQuestionSet.NovelQuestionSecondTry.length > 0
          ) {
            const secondTry =
              chapter.novelQuestionSet.NovelQuestionSecondTry[0];
            secondTryCorrect += secondTry.correctAnswers;
            secondTryTotal += secondTry.totalQuestions;
          }
        }
      });
    });
  }

  const firstTryPercentage =
    firstTryTotal > 0 ? (firstTryCorrect / firstTryTotal) * 100 : 0;
  const secondTryPercentage =
    secondTryTotal > 0 ? (secondTryCorrect / secondTryTotal) * 100 : 0;
  const hasProgress = userId && totalChaptersAttempted > 0;

  return (
    <Link href={`/novel/${ar.id}`} className="group">
      <Card className="h-full border-border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-card-foreground">
              {ar.level}
            </CardTitle>
            <div className="flex items-center gap-1">
              {Array.from({ length: ar.stars }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              AR: {ar.score}
            </Badge>
          </div>

          {/* Progress bars for first and second try */}
          {userId && totalChaptersAttempted > 0 && (
            <div className="mt-3 space-y-2">
              {firstTryTotal > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>First Try</span>
                    <span>
                      {firstTryCorrect}/{firstTryTotal} correct (
                      {Math.round(firstTryPercentage)}%)
                    </span>
                  </div>
                  <Progress value={firstTryPercentage} className="h-2" />
                </div>
              )}

              {secondTryTotal > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Second Try</span>
                    <span>
                      {secondTryCorrect}/{secondTryTotal} correct (
                      {Math.round(secondTryPercentage)}%)
                    </span>
                  </div>
                  <Progress value={secondTryPercentage} className="h-2" />
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {ar.description && (
            <CardDescription className="mb-4 line-clamp-3 text-muted-foreground">
              {ar.description}
            </CardDescription>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {ar.novels.length} novel{ar.novels.length !== 1 ? "s" : ""}{" "}
              available
            </span>
            <span className="text-primary transition-colors group-hover:text-primary/80">
              {hasProgress ? "Continue →" : "Explore →"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
