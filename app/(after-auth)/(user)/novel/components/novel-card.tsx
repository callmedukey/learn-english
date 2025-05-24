import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface NovelCardProps {
  novel: {
    id: string;
    title: string;
    description: string | null;
    image: {
      imageUrl: string;
      width: number;
      height: number;
    } | null;
    novelChapters: Array<{
      id: string;
      isFree: boolean;
      novelQuestionSet: {
        novelQuestions: Array<{
          novelQuestionCompleted: Array<{
            userId: string;
          }>;
        }>;
      } | null;
    }>;
  };
  arId: string;
  userId?: string;
}

export function NovelCard({ novel, arId, userId }: NovelCardProps) {
  // Calculate completion progress
  const totalChapters = novel.novelChapters.length;
  const completedChapters = userId
    ? novel.novelChapters.filter((chapter) => {
        if (!chapter.novelQuestionSet) return false;

        // Check if all questions in this chapter are completed by the user
        const totalQuestions = chapter.novelQuestionSet.novelQuestions.length;
        const completedQuestions =
          chapter.novelQuestionSet.novelQuestions.filter((question) =>
            question.novelQuestionCompleted.some(
              (completed) => completed.userId === userId,
            ),
          ).length;

        return totalQuestions > 0 && completedQuestions === totalQuestions;
      }).length
    : 0;

  const progressPercentage =
    totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
  const hasProgress = userId && completedChapters > 0;

  return (
    <Card className="group h-full border-border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg">
      <CardHeader className="pb-4">
        {novel.image && (
          <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={novel.image.imageUrl}
              alt={novel.title}
              fill
              className="object-fit transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            {hasProgress && (
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className="border-primary bg-primary/90 text-primary-foreground"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {Math.round(progressPercentage)}%
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardTitle className="line-clamp-2 text-lg font-semibold text-card-foreground">
          {novel.title}
        </CardTitle>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-muted-foreground/30 text-xs text-muted-foreground"
          >
            {novel.novelChapters.length} chapter
            {novel.novelChapters.length !== 1 ? "s" : ""}
          </Badge>
          {novel.novelChapters.some((chapter) => chapter.isFree) && (
            <Badge
              variant="secondary"
              className="border-amber-200 bg-amber-100 text-xs text-amber-800"
            >
              Free chapters
            </Badge>
          )}
          {hasProgress && (
            <Badge
              variant="secondary"
              className="border-primary/20 bg-primary/10 text-xs text-primary"
            >
              {completedChapters}/{totalChapters} completed
            </Badge>
          )}
        </div>

        {/* Progress bar for user progress */}
        {userId && totalChapters > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedChapters}/{totalChapters} chapters
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {novel.description && (
          <CardDescription className="mb-4 line-clamp-3 text-sm text-muted-foreground">
            {novel.description}
          </CardDescription>
        )}

        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          asChild
        >
          <Link href={`/novel/${arId}/${novel.id}`}>
            {hasProgress ? "Continue Reading" : "Start Reading"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
