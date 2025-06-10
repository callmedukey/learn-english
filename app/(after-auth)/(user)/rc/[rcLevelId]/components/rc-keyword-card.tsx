import { FileText, Lock, Target, Repeat } from "lucide-react";
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

interface RCKeywordCardProps {
  keyword: {
    id: string;
    name: string;
    description: string | null;
    isFree: boolean;
    RCQuestionSet: {
      id: string;
      title: string;
      active: boolean;
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
  };
  rcLevelId: string;
  userId?: string;
}

export function RCKeywordCard({
  keyword,
  rcLevelId,
  userId,
}: RCKeywordCardProps) {
  // Calculate quiz attempt status
  let totalQuestions = 0;
  let firstTryData: { totalQuestions: number; correctAnswers: number } | null =
    null;
  let secondTryData: { totalQuestions: number; correctAnswers: number } | null =
    null;

  if (keyword.RCQuestionSet && userId) {
    totalQuestions = keyword.RCQuestionSet.RCQuestion.length;
    firstTryData = keyword.RCQuestionSet.RCQuestionFirstTry[0] || null;
    secondTryData = keyword.RCQuestionSet.RCQuestionSecondTry[0] || null;
  }

  const hasQuestionSet = keyword.RCQuestionSet !== null;
  const isQuestionSetActive = keyword.RCQuestionSet?.active === true;
  const hasQuestions = totalQuestions > 0;

  // Determine status based on first/second try completion
  let status:
    | "available"
    | "locked"
    | "first-try-completed"
    | "second-try-completed"
    | "no-content" = "no-content";

  if (!hasQuestionSet || !isQuestionSetActive || !hasQuestions) {
    status = "no-content";
  } else if (!keyword.isFree && !userId) {
    status = "locked";
  } else if (secondTryData) {
    status = "second-try-completed";
  } else if (firstTryData) {
    status = "first-try-completed";
  } else {
    status = "available";
  }

  const getStatusBadge = () => {
    switch (status) {
      case "first-try-completed":
        return (
          <Badge
            variant="secondary"
            className="border-amber-200 bg-amber-100 text-amber-800"
          >
            <Target className="mr-1 h-3 w-3" />
            First Try: {firstTryData?.correctAnswers}/
            {firstTryData?.totalQuestions}
          </Badge>
        );
      case "second-try-completed":
        return (
          <Badge
            variant="secondary"
            className="border-green-200 bg-green-100 text-green-800"
          >
            <Repeat className="mr-1 h-3 w-3" />
            Second Try: {secondTryData?.correctAnswers}/
            {secondTryData?.totalQuestions}
          </Badge>
        );
      case "locked":
        return (
          <Badge
            variant="secondary"
            className="border-gray-200 bg-gray-100 text-gray-600"
          >
            <Lock className="mr-1 h-3 w-3" />
            Premium
          </Badge>
        );
      case "no-content":
        return (
          <Badge
            variant="secondary"
            className="border-amber-200 bg-amber-100 text-amber-800"
          >
            Coming Soon
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            Available
          </Badge>
        );
    }
  };

  const getButtonText = () => {
    switch (status) {
      case "first-try-completed":
        return "Second Try";
      case "second-try-completed":
        return "Retry";
      case "available":
        return "Start";
      case "locked":
        return "Premium Required";
      default:
        return "Coming Soon";
    }
  };

  const isClickable =
    hasQuestionSet &&
    isQuestionSetActive &&
    hasQuestions &&
    (keyword.isFree || userId);

  const cardContent = (
    <Card
      className={`flex h-full flex-col border-border bg-card transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:scale-105 hover:shadow-lg"
          : "opacity-75"
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1 text-lg font-semibold text-card-foreground">
            {keyword.name}
          </CardTitle>
          {getStatusBadge()}
        </div>

        {hasQuestionSet && isQuestionSetActive && hasQuestions && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-muted-foreground/30 text-muted-foreground"
            >
              <FileText className="mr-1 h-3 w-3" />
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
            </Badge>
            {keyword.RCQuestionSet && (
              <Badge
                variant="outline"
                className="border-muted-foreground/30 text-muted-foreground"
              >
                {keyword.RCQuestionSet.title}
              </Badge>
            )}
          </div>
        )}

        {/* Progress display for performance */}
        {userId &&
          hasQuestionSet &&
          isQuestionSetActive &&
          hasQuestions &&
          firstTryData && (
            <div className="mt-3 space-y-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Performance</span>
                  <span>
                    {firstTryData.correctAnswers}/{firstTryData.totalQuestions}{" "}
                    correct
                  </span>
                </div>
                <Progress
                  value={
                    (firstTryData.correctAnswers /
                      firstTryData.totalQuestions) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-0">
        <div className="flex-1">
          {keyword.description && (
            <CardDescription className="line-clamp-3 text-muted-foreground">
              {keyword.description}
            </CardDescription>
          )}
        </div>

        {/* Button positioned at bottom */}
        <div className="mt-4">
          {isClickable ? (
            <Button
              className="w-full"
              variant={status === "available" ? "outline" : "default"}
            >
              {getButtonText()}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              {getButtonText()}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return (
      <Link href={`/rc/${rcLevelId}/${keyword.id}`} className="group">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
