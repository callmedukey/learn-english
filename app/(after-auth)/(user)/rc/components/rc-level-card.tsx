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
        RCQuestionSecondTry: Array<{
          id: string;
          totalQuestions: number;
          correctAnswers: number;
          createdAt: Date;
        }>;
      } | null;
    }>;
  };
  userId?: string;
}

export function RCLevelCard({ rcLevel, userId }: RCLevelCardProps) {
  // Calculate total first and second try statistics across all question sets
  let totalFirstTryQuestions = 0;
  let totalFirstTryCorrect = 0;
  let totalSecondTryQuestions = 0;
  let totalSecondTryCorrect = 0;
  let keywordsWithFirstTry = 0;
  let keywordsWithSecondTry = 0;
  const totalKeywords = rcLevel.RCKeyword.length;

  if (userId) {
    rcLevel.RCKeyword.forEach((keyword) => {
      if (keyword.RCQuestionSet) {
        const firstTryData = keyword.RCQuestionSet.RCQuestionFirstTry[0];
        const secondTryData = keyword.RCQuestionSet.RCQuestionSecondTry[0];

        if (firstTryData) {
          keywordsWithFirstTry++;
          totalFirstTryQuestions += firstTryData.totalQuestions;
          totalFirstTryCorrect += firstTryData.correctAnswers;
        }

        if (secondTryData) {
          keywordsWithSecondTry++;
          totalSecondTryQuestions += secondTryData.totalQuestions;
          totalSecondTryCorrect += secondTryData.correctAnswers;
        }
      }
    });
  }

  const firstTryPercentage =
    totalFirstTryQuestions > 0
      ? (totalFirstTryCorrect / totalFirstTryQuestions) * 100
      : 0;
  const secondTryPercentage =
    totalSecondTryQuestions > 0
      ? (totalSecondTryCorrect / totalSecondTryQuestions) * 100
      : 0;

  const hasFirstTry = userId && keywordsWithFirstTry > 0;
  const hasSecondTry = userId && keywordsWithSecondTry > 0;

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
          </div>

          {/* First and Second Try Statistics */}
          {userId && (hasFirstTry || hasSecondTry) && (
            <div className="mt-3 space-y-2">
              {hasFirstTry && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-primary">
                    <span>First Try ({keywordsWithFirstTry} topics)</span>
                    <span>
                      {totalFirstTryCorrect}/{totalFirstTryQuestions} correct (
                      {Math.round(firstTryPercentage)}%)
                    </span>
                  </div>
                  <Progress value={firstTryPercentage} className="h-2" />
                </div>
              )}
              {hasSecondTry && (
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Second Try ({keywordsWithSecondTry} topics)</span>
                    <span>
                      {totalSecondTryCorrect}/{totalSecondTryQuestions} correct
                      ({Math.round(secondTryPercentage)}%)
                    </span>
                  </div>
                  <Progress value={secondTryPercentage} className="h-2" />
                </div>
              )}
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
              {hasFirstTry ? "Continue →" : "Explore →"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
