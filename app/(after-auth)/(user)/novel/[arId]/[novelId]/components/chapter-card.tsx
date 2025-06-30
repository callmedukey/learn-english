"use client";

import { Target, Repeat, Lock, Trophy } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { ChallengeRequiredDialog } from "@/components/dialogs/challenge-required-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    firstTryData: {
      totalQuestions: number;
      correctAnswers: number;
      createdAt: Date;
    } | null;
    secondTryData: {
      totalQuestions: number;
      correctAnswers: number;
      createdAt: Date;
    } | null;
    novelQuestionSet: {
      id: string;
      instructions: string;
      active: boolean;
    } | null;
  };
  arId: string;
  novelId: string;
  novelTitle: string;
  arLevel: string;
  userHasPaidSubscription?: boolean;
  isMonthlyChallenge?: boolean;
  userJoinedChallenge?: boolean;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  arId,
  novelId,
  novelTitle,
  arLevel,
  userHasPaidSubscription = false,
  isMonthlyChallenge = false,
  userJoinedChallenge = false,
}) => {
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  
  // Check premium access first
  const hasPremiumAccess = chapter.isFree || userHasPaidSubscription;
  
  // Check challenge access - if it's a challenge novel and user hasn't joined, they can't access quiz
  const challengeBlocked = isMonthlyChallenge && !userJoinedChallenge;
  
  // Can access quiz if they have premium access AND (not a challenge novel OR they've joined the challenge)
  const canAccessQuiz = hasPremiumAccess && !challengeBlocked;

  // Determine chapter status based on try data
  const getTryStatus = () => {
    if (chapter.secondTryData) {
      return "second-try-completed";
    } else if (chapter.firstTryData) {
      return "first-try-completed";
    } else if (chapter.totalQuestionsCount > 0) {
      return "available";
    } else {
      return "no-questions";
    }
  };

  const tryStatus = getTryStatus();

  const getTryBadge = () => {
    switch (tryStatus) {
      case "first-try-completed":
        return (
          <Badge
            variant="secondary"
            className="border-amber-200 bg-amber-100 text-amber-800"
          >
            <Target className="mr-1 h-3 w-3" />
            First Try: {chapter.firstTryData?.correctAnswers}/
            {chapter.firstTryData?.totalQuestions}
          </Badge>
        );
      case "second-try-completed":
        return (
          <Badge
            variant="secondary"
            className="border-green-200 bg-green-100 text-green-800"
          >
            <Repeat className="mr-1 h-3 w-3" />
            Second Try: {chapter.secondTryData?.correctAnswers}/
            {chapter.secondTryData?.totalQuestions}
          </Badge>
        );
      case "available":
        return (
          <Badge
            variant="secondary"
            className="border-primary/20 bg-primary/10 text-primary"
          >
            Available
          </Badge>
        );
      default:
        return null;
    }
  };

  const cardContent = (
    <Card className="h-full">
      <CardHeader className="pb-4">
        {/* Title first */}
        <CardTitle className="line-clamp-1 text-lg font-semibold text-card-foreground">
          Chapter {chapter.orderNumber}: {chapter.title}
        </CardTitle>

        {/* Badges below title */}
        <div className="flex flex-wrap items-center gap-2">
          {chapter.isFree && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Free
            </Badge>
          )}
          {!hasPremiumAccess && (
            <Badge variant="destructive" className="bg-gray-100 text-gray-600">
              <Lock className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
          {challengeBlocked && hasPremiumAccess && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Trophy className="mr-1 h-3 w-3" />
              Challenge Required
            </Badge>
          )}
          {canAccessQuiz && getTryBadge()}
        </div>

        {/* Progress bars below badges */}
        {chapter.novelQuestionSet &&
          chapter.totalQuestionsCount > 0 &&
          chapter.firstTryData && (
            <div className="mt-3 space-y-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-primary">
                  <span>Performance</span>
                  <span>
                    {chapter.firstTryData.correctAnswers}/
                    {chapter.firstTryData.totalQuestions} correct
                  </span>
                </div>
                <Progress
                  value={
                    (chapter.firstTryData.correctAnswers /
                      chapter.firstTryData.totalQuestions) *
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
          {chapter.description && (
            <CardDescription className="line-clamp-2 text-sm text-gray-600">
              {chapter.description}
            </CardDescription>
          )}

          {!chapter.novelQuestionSet && (
            <div className="text-sm text-gray-500 italic">
              No questions available yet
            </div>
          )}

          {chapter.novelQuestionSet &&
            chapter.totalQuestionsCount > 0 &&
            !chapter.firstTryData &&
            !chapter.secondTryData && (
              <div className="text-sm text-gray-600">
                {chapter.totalQuestionsCount} question
                {chapter.totalQuestionsCount !== 1 ? "s" : ""} available
              </div>
            )}

          {!hasPremiumAccess && (
            <div className="text-sm text-gray-500 italic">
              Upgrade to premium to access this chapter
            </div>
          )}
          
          {challengeBlocked && hasPremiumAccess && (
            <div className="text-sm text-amber-600 italic">
              Join the monthly challenge to start this quiz
            </div>
          )}
        </div>

        {/* Button positioned at bottom */}
        <div className="mt-4">
          <Button
            className="w-full"
            variant={tryStatus === "available" ? "outline" : "default"}
            disabled={!hasPremiumAccess}
            onClick={(e) => {
              if (challengeBlocked) {
                e.preventDefault();
                setChallengeDialogOpen(true);
              }
            }}
          >
            {!hasPremiumAccess
              ? "Premium Required"
              : challengeBlocked
              ? "Join Challenge to Start"
              : tryStatus === "first-try-completed"
              ? "Second Try"
              : tryStatus === "second-try-completed"
              ? "Retry"
              : "Start Quiz"}
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
      {canAccessQuiz ? (
        <Link
          href={`/novel/${arId}/${novelId}/${chapter.id}`}
          className="block transition-transform hover:scale-105"
        >
          {cardContent}
        </Link>
      ) : hasPremiumAccess && challengeBlocked ? (
        <div 
          className="block cursor-pointer transition-transform hover:scale-105"
          onClick={handleCardClick}
        >
          {cardContent}
        </div>
      ) : (
        <div className="cursor-not-allowed opacity-60">{cardContent}</div>
      )}
      
      <ChallengeRequiredDialog
        open={challengeDialogOpen}
        onOpenChange={setChallengeDialogOpen}
        levelType="AR"
        levelId={arId}
        levelName={arLevel}
        contentName={novelTitle}
        contentType="novel"
      />
    </>
  );
};

export default ChapterCard;
