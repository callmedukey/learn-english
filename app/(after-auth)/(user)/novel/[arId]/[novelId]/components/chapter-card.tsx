import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ChapterCardProps {
  chapter: {
    id: string;
    title: string;
    description: string | null;
    orderNumber: number;
    isFree: boolean;
    isCompleted: boolean;
    completedQuestionsCount: number;
    totalQuestionsCount: number;
    novelQuestionSet: {
      id: string;
      instructions: string;
      active: boolean;
    } | null;
  };
  arId: string;
  novelId: string;
  userHasPaidSubscription?: boolean;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  arId,
  novelId,
  userHasPaidSubscription = false,
}) => {
  const canAccess = chapter.isFree || userHasPaidSubscription;
  const progressPercentage =
    chapter.totalQuestionsCount > 0
      ? (chapter.completedQuestionsCount / chapter.totalQuestionsCount) * 100
      : 0;

  const CardWrapper = canAccess ? Link : "div";
  const cardProps = canAccess
    ? {
        href: `/novel/${arId}/${novelId}/${chapter.id}`,
        className: "block transition-transform hover:scale-105",
      }
    : {
        className: "opacity-60 cursor-not-allowed",
      };

  return (
    <CardWrapper {...cardProps}>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Chapter {chapter.orderNumber}: {chapter.title}
            </CardTitle>
            <div className="flex gap-2">
              {chapter.isFree && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800"
                >
                  Free
                </Badge>
              )}
              {chapter.isCompleted && (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Completed
                </Badge>
              )}
              {!canAccess && (
                <Badge
                  variant="destructive"
                  className="bg-gray-100 text-gray-600"
                >
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {chapter.description && (
            <p className="line-clamp-2 text-sm text-gray-600">
              {chapter.description}
            </p>
          )}

          {chapter.novelQuestionSet && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {chapter.completedQuestionsCount}/
                  {chapter.totalQuestionsCount} questions
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {!chapter.novelQuestionSet && (
            <div className="text-sm text-gray-500 italic">
              No questions available yet
            </div>
          )}

          {!canAccess && (
            <div className="text-sm text-gray-500 italic">
              Upgrade to premium to access this chapter
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

export default ChapterCard;
