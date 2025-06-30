"use client";

import DOMPurify from "isomorphic-dompurify";
import { FileText, Lock, Target, Repeat, Trophy, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ChallengeRequiredDialog } from "@/components/dialogs/challenge-required-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RCKeywordCardProps {
  keyword: {
    id: string;
    name: string;
    description: string | null;
    isFree: boolean;
    comingSoon: boolean;
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
  rcLevelName?: string;
  userId?: string;
  hasPaidSubscription?: boolean;
  isMonthlyChallenge?: boolean;
  userJoinedChallenge?: boolean;
}

export function RCKeywordCard({
  keyword,
  rcLevelId,
  rcLevelName = "",
  userId,
  hasPaidSubscription,
  isMonthlyChallenge = false,
  userJoinedChallenge = false,
}: RCKeywordCardProps) {
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
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

  // Check challenge access
  const challengeBlocked = isMonthlyChallenge && !userJoinedChallenge;

  // Determine status based on first/second try completion
  let status:
    | "available"
    | "locked"
    | "challenge-locked"
    | "first-try-completed"
    | "second-try-completed"
    | "no-content"
    | "coming-soon" = "no-content";

  if (keyword.comingSoon) {
    status = "coming-soon";
  } else if (!hasQuestionSet || !isQuestionSetActive || !hasQuestions) {
    status = "no-content";
  } else if (!keyword.isFree && !hasPaidSubscription) {
    status = "locked";
  } else if (challengeBlocked) {
    status = "challenge-locked";
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
      case "challenge-locked":
        return (
          <Badge
            variant="secondary"
            className="border-amber-200 bg-amber-100 text-amber-800"
          >
            <Trophy className="mr-1 h-3 w-3" />
            Challenge Required
          </Badge>
        );
      case "no-content":
        return (
          <Badge
            variant="secondary"
            className="border-amber-300 bg-amber-100 text-xs font-semibold text-amber-700"
          >
            COMING SOON
          </Badge>
        );
      case "coming-soon":
        return (
          <Badge
            variant="secondary"
            className="border-amber-300 bg-amber-100 text-xs font-semibold text-amber-700"
          >
            COMING SOON
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
      case "challenge-locked":
        return "Join Challenge to Start";
      case "coming-soon":
        return "✨ Coming Next Month!";
      default:
        return "✨ Coming Next Month!";
    }
  };

  const isClickable =
    !keyword.comingSoon &&
    hasQuestionSet &&
    isQuestionSetActive &&
    hasQuestions &&
    (keyword.isFree || hasPaidSubscription) &&
    !challengeBlocked;

  const cardContent = (
    <Card
      className={`flex h-full flex-col border-border bg-card transition-all duration-200 ${
        keyword.comingSoon
          ? "opacity-60"
          : isClickable
            ? "cursor-pointer hover:scale-105 hover:shadow-lg"
            : "opacity-75"
      } ${
        isMonthlyChallenge
          ? "ring-2 ring-amber-400 ring-offset-2 hover:ring-amber-500"
          : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1 text-lg font-semibold text-card-foreground">
            {keyword.name}
          </CardTitle>
          {getStatusBadge()}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMonthlyChallenge && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className={`${
                      userJoinedChallenge
                        ? "border-yellow-300 bg-yellow-100 text-yellow-800"
                        : "border-amber-300 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <Trophy className="mr-1 h-3 w-3" />
                    Challenge
                    {userJoinedChallenge ? (
                      <span className="ml-1 text-green-600">✓</span>
                    ) : (
                      <Info className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {userJoinedChallenge ? (
                    <p>
                      You&apos;ve joined this month&apos;s challenge! Points
                      count toward medals.
                    </p>
                  ) : (
                    <p>
                      Monthly challenge content - join the challenge to earn
                      medal points!
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {hasQuestionSet && isQuestionSetActive && hasQuestions && (
            <>
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
                  <span
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(keyword.RCQuestionSet.title),
                    }}
                  />
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Progress display for performance - hide for coming soon */}
        {userId &&
          hasQuestionSet &&
          isQuestionSetActive &&
          hasQuestions &&
          firstTryData &&
          !keyword.comingSoon && (
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

        {/* Coming soon teaser message */}
        {keyword.comingSoon && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3">
            <p className="text-center text-xs font-medium text-amber-800">
              🎯 New reading passage incoming! We&apos;re crafting engaging
              passages to boost your skills.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-0">
        {!keyword.comingSoon && (
          <div className="flex-1">
            {keyword.description && (
              <CardDescription className="line-clamp-3 text-muted-foreground">
                {keyword.description}
              </CardDescription>
            )}
          </div>
        )}

        {/* Button positioned at bottom */}
        <div className="mt-4">
          <Button
            className="w-full"
            variant={status === "available" ? "outline" : "default"}
            disabled={status === "locked" || status === "no-content" || status === "coming-soon"}
            onClick={(e) => {
              if (challengeBlocked) {
                e.preventDefault();
                setChallengeDialogOpen(true);
              }
            }}
          >
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleCardClick = (e: React.MouseEvent) => {
    if (challengeBlocked) {
      e.preventDefault();
      setChallengeDialogOpen(true);
    }
  };

  return (
    <>
      {isClickable ? (
        <Link href={`/rc/${rcLevelId}/${keyword.id}`} className="group">
          {cardContent}
        </Link>
      ) : challengeBlocked && (keyword.isFree || hasPaidSubscription) ? (
        <div className="group cursor-pointer" onClick={handleCardClick}>
          {cardContent}
        </div>
      ) : (
        cardContent
      )}
      
      <ChallengeRequiredDialog
        open={challengeDialogOpen}
        onOpenChange={setChallengeDialogOpen}
        levelType="RC"
        levelId={rcLevelId}
        levelName={rcLevelName}
        contentName={keyword.name}
        contentType="keyword"
      />
    </>
  );
}
