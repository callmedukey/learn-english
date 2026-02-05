import { Star, BookOpen, CheckCircle } from "lucide-react";
import Image from "next/image";
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
        RCQuestionFirstTry: Array<{
          id: string;
          totalQuestions: number;
          correctAnswers: number;
          createdAt: Date;
        }>;
      } | null;
    }>;
    medalImages?: Array<{
      id: string;
      levelType: string;
      levelId: string;
      medalType: "GOLD" | "SILVER" | "BRONZE";
      imageUrl: string;
      width: number;
      height: number;
    }>;
  };
  userId?: string;
  isUserSelectedLevel?: boolean;
  defaultScore?: number;
}

export function RCLevelCard({ rcLevel, userId, isUserSelectedLevel, defaultScore }: RCLevelCardProps) {
  // Calculate completion progress
  const totalKeywords = rcLevel.RCKeyword.length;
  const completedKeywords = userId
    ? rcLevel.RCKeyword.filter((keyword) => {
        if (!keyword.RCQuestionSet) return false;

        // Check if all questions in this keyword are completed by the user
        const totalQuestions = keyword.RCQuestionSet.RCQuestion.length;
        const completedQuestions = keyword.RCQuestionSet.RCQuestion.filter(
          (question) =>
            question.RCQuestionCompleted.some(
              (completed) => completed.userId === userId,
            ),
        ).length;

        return totalQuestions > 0 && completedQuestions === totalQuestions;
      }).length
    : 0;

  const progressPercentage =
    totalKeywords > 0 ? (completedKeywords / totalKeywords) * 100 : 0;
  const hasProgress = userId && completedKeywords > 0;

  // Calculate total first try statistics across all question sets
  let totalFirstTryQuestions = 0;
  let totalFirstTryCorrect = 0;
  let keywordsWithFirstTry = 0;

  if (userId) {
    rcLevel.RCKeyword.forEach((keyword) => {
      if (keyword.RCQuestionSet) {
        const firstTryData = keyword.RCQuestionSet.RCQuestionFirstTry[0];

        if (firstTryData) {
          keywordsWithFirstTry++;
          totalFirstTryQuestions += firstTryData.totalQuestions;
          totalFirstTryCorrect += firstTryData.correctAnswers;
        }
      }
    });
  }

  const firstTryPercentage =
    totalFirstTryQuestions > 0
      ? (totalFirstTryCorrect / totalFirstTryQuestions) * 100
      : 0;

  const hasFirstTry = userId && keywordsWithFirstTry > 0;

  return (
    <Link href={`/rc/${rcLevel.id}`} className="group">
      <Card className={`h-full border-border bg-card transition-all duration-200 hover:scale-105 hover:shadow-lg ${isUserSelectedLevel ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-semibold text-card-foreground">
                {rcLevel.level}
              </CardTitle>
              {rcLevel.medalImages && rcLevel.medalImages.length > 0 && (
                <div className="flex items-center gap-1">
                  {["GOLD", "SILVER", "BRONZE"].map((medalType) => {
                    const medal = rcLevel.medalImages?.find(
                      (m) => m.medalType === medalType
                    );
                    return medal ? (
                      <Image
                        key={medal.id}
                        src={medal.imageUrl}
                        alt={`${medalType} medal`}
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    ) : null;
                  })}
                </div>
              )}
            </div>
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
            {defaultScore != null && defaultScore > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700"
              >
                {defaultScore} pts / quiz
              </Badge>
            )}
            {isUserSelectedLevel && (
              <Badge
                variant="secondary"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Your Selected Level
              </Badge>
            )}
            {hasProgress && (
              <Badge
                variant="secondary"
                className="border-primary/20 bg-primary/10 text-xs text-primary"
              >
                {completedKeywords}/{totalKeywords} completed
              </Badge>
            )}
          </div>

          {/* Performance Statistics */}
          {userId && hasFirstTry && (
            <div className="mt-3 space-y-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Performance ({keywordsWithFirstTry} topics)</span>
                  <span>
                    {totalFirstTryCorrect}/{totalFirstTryQuestions} correct (
                    {Math.round(firstTryPercentage)}%)
                  </span>
                </div>
                <Progress value={firstTryPercentage} className="h-2" />
              </div>
            </div>
          )}
          {/* Progress bar for user progress */}
          {userId && totalKeywords > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {completedKeywords}/{totalKeywords} topics
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
