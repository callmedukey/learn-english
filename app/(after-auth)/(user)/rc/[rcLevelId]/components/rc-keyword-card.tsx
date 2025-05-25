import { FileText, Lock, CheckCircle, Clock } from "lucide-react";
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
  // Calculate progress for this keyword
  let totalQuestions = 0;
  let completedQuestions = 0;
  let progressPercentage = 0;

  if (keyword.RCQuestionSet && userId) {
    totalQuestions = keyword.RCQuestionSet.RCQuestion.length;
    completedQuestions = keyword.RCQuestionSet.RCQuestion.filter((question) =>
      question.RCQuestionCompleted.some(
        (completed) => completed.userId === userId,
      ),
    ).length;
    progressPercentage =
      totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
  }

  const isCompleted = progressPercentage === 100;
  const hasProgress = progressPercentage > 0;
  const hasQuestionSet = keyword.RCQuestionSet !== null;
  const isQuestionSetActive = keyword.RCQuestionSet?.active === true;
  const hasQuestions = totalQuestions > 0;

  // Determine status
  let status:
    | "available"
    | "locked"
    | "completed"
    | "in-progress"
    | "no-content" = "no-content";

  if (!hasQuestionSet || !isQuestionSetActive || !hasQuestions) {
    status = "no-content";
  } else if (!keyword.isFree && !userId) {
    status = "locked";
  } else if (isCompleted) {
    status = "completed";
  } else if (hasProgress) {
    status = "in-progress";
  } else {
    status = "available";
  }

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="border-green-200 bg-green-100 text-green-800"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="secondary"
            className="border-amber-200 bg-amber-100 text-amber-800"
          >
            <Clock className="mr-1 h-3 w-3" />
            In Progress
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

        {/* Progress bar */}
        {userId && hasQuestionSet && isQuestionSetActive && hasQuestions && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>
                {completedQuestions}/{totalQuestions} questions
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
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
              variant={hasProgress ? "default" : "outline"}
            >
              {status === "completed"
                ? "Retry"
                : hasProgress
                  ? "Continue"
                  : "Start"}
            </Button>
          ) : (
            <Button className="w-full" variant="outline" disabled>
              {status === "locked"
                ? "Premium Required"
                : !hasQuestionSet
                  ? "Coming Soon"
                  : !isQuestionSetActive
                    ? "Coming Soon"
                    : !hasQuestions
                      ? "Questions Coming Soon"
                      : "Coming Soon"}
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
