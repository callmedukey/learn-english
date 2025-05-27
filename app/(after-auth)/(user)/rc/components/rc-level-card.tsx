import { Star, BookOpen, FileText } from "lucide-react";
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

interface RCLevelCardProps {
  rcLevel: {
    id: string;
    level: string;
    relevantGrade: string;
    stars: number;
    numberOfQuestions: number;
    description: string | null;
    RCKeyword: Array<{
      id: string;
      name: string;
      isFree: boolean;
      RCQuestionSet: {
        id: string;
        title: string;
        RCQuestion: Array<{
          id: string;
          RCQuestionCompleted: Array<{
            userId: string;
          }>;
        }>;
      } | null;
    }>;
  };
  userId?: string;
}

export function RCLevelCard({ rcLevel, userId }: RCLevelCardProps) {
  // Calculate overall progress across all question sets in this RC level
  let totalQuestions = 0;
  let completedQuestions = 0;
  const totalKeywords = rcLevel.RCKeyword.length;

  if (userId) {
    rcLevel.RCKeyword.forEach((keyword) => {
      if (keyword.RCQuestionSet) {
        const questions = keyword.RCQuestionSet.RCQuestion;
        totalQuestions += questions.length;

        const keywordCompletedQuestions = questions.filter((question) =>
          question.RCQuestionCompleted.some(
            (completed) => completed.userId === userId,
          ),
        ).length;

        completedQuestions += keywordCompletedQuestions;
      }
    });
  }

  const progressPercentage =
    totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
  const hasProgress = userId && completedQuestions > 0;

  return (
    <Link href={`/rc/${rcLevel.id}`} className="group">
      <Card className="h-full border-border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-card-foreground">
              {rcLevel.level}
            </CardTitle>
            <div className="flex items-center gap-1">
              {Array.from({ length: rcLevel.stars }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="border-primary/20 bg-primary/10 text-primary"
            >
              {rcLevel.relevantGrade}
            </Badge>
            <Badge
              variant="outline"
              className="border-muted-foreground/30 text-muted-foreground"
            >
              {rcLevel.numberOfQuestions} Questions
            </Badge>
            {hasProgress && (
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-100 text-amber-800"
              >
                <FileText className="mr-1 h-3 w-3" />
                {Math.round(progressPercentage)}% complete
              </Badge>
            )}
          </div>

          {/* Progress bar for overall RC level progress */}
          {userId && totalQuestions > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>
                  {completedQuestions}/{totalQuestions} questions
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {rcLevel.description && (
            <CardDescription className="mb-4 line-clamp-3 text-muted-foreground">
              {rcLevel.description}
            </CardDescription>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {totalKeywords} topic{totalKeywords !== 1 ? "s" : ""} available
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
