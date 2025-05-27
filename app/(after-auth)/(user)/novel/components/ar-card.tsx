import { Star, BookOpen } from "lucide-react";
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
        } | null;
      }>;
    }>;
  };
  userId?: string;
}

export function ARCard({ ar, userId }: ARCardProps) {
  // Calculate overall progress across all novels in this AR level
  let totalChapters = 0;
  let completedChapters = 0;

  if (userId) {
    ar.novels.forEach((novel) => {
      novel.novelChapters.forEach((chapter) => {
        totalChapters++;

        if (chapter.novelQuestionSet) {
          const totalQuestions = chapter.novelQuestionSet.novelQuestions.length;
          const completedQuestions =
            chapter.novelQuestionSet.novelQuestions.filter((question) =>
              question.novelQuestionCompleted.some(
                (completed) => completed.userId === userId,
              ),
            ).length;

          if (totalQuestions > 0 && completedQuestions === totalQuestions) {
            completedChapters++;
          }
        }
      });
    });
  }

  const progressPercentage =
    totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const hasProgress = userId && completedChapters > 0;

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
            {hasProgress && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-100 text-amber-800"
              >
                <BookOpen className="mr-1 h-3 w-3" />
                {Math.round(progressPercentage)}% complete
              </Badge>
            )}
          </div>

          {/* Progress bar for overall AR level progress */}
          {userId && totalChapters > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>
                  {completedChapters}/{totalChapters} chapters
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
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
